"""
House Price Predictor API.

Five things live here:
  - /auth/*: sign-up/sign-in (routes_auth.py). Every route below requires
    a valid session (see auth.get_current_user) except /health and /auth/*.
  - /predict, /comparables, /parse-description, /model-*, /dataset-*,
    /evaluation-sample: the original ML pipeline (model loading, tree-path
    explanations, comparables, dataset stats) in ml_service.py /
    llm_service.py. /predict itself stays a stateless preview -- it does
    not touch the database -- so interactive UI (the What-If simulator)
    can call it on every slider change without flooding prediction history.
  - /houses (routes_houses.py): CRUD for saved properties, scoped per user.
  - /predictions (routes_predictions.py): run the model AND persist the
    result, scoped per user -- this is what builds prediction history.
  - /dashboard/summary (routes_dashboard.py): aggregate stats for the
    Dashboard page, scoped per user.

Run with:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import db_models
import llm_service
import ml_service
from auth import get_current_user
from database import Base, engine, get_db, SessionLocal
from routes_auth import router as auth_router
from routes_dashboard import router as dashboard_router
from routes_houses import router as houses_router
from routes_predictions import router as predictions_router
from schemas import (
    Comparable,
    ComparablesResponse,
    DatasetSampleResponse,
    ExtractedFeatures,
    HouseFeatures,
    ParseDescriptionRequest,
    PredictionResponse,
)

Base.metadata.create_all(bind=engine)


def _sync_model_evaluations() -> None:
    """Upsert compare_models.py's latest results into the model_evaluations
    table so model performance is queryable like any other resource, not
    just readable from a JSON file. Idempotent -- safe to run on every
    startup."""
    mc = ml_service.model_comparison
    generated_at = mc.get("generated_at")
    generated_at = datetime.fromisoformat(generated_at) if generated_at else None

    db = SessionLocal()
    try:
        for key, result in mc["models"].items():
            row = db.query(db_models.ModelEvaluation).filter_by(model_key=key).first()
            if row is None:
                row = db_models.ModelEvaluation(model_key=key)
                db.add(row)
            row.model_name = result["name"]
            row.mae_usd = result["mae_usd"]
            row.rmse_usd = result.get("rmse_usd", result["mae_usd"])
            row.r2 = result["r2"]
            row.cv_r2_mean = result.get("cv_r2_mean")
            row.cv_mae_usd_mean = result.get("cv_mae_usd_mean")
            row.training_time_seconds = result.get("training_time_seconds")
            row.is_served = key == mc["served_model"]
            row.generated_at = generated_at
            row.synced_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _sync_model_evaluations()
    yield


app = FastAPI(title="House Price Predictor API", lifespan=lifespan)

# Allow the React dev server (any localhost port, since Vite falls back
# when 5173 is taken) and the deployed Vercel frontend (including preview
# deployments, which get their own *.vercel.app subdomain).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+|https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(houses_router)
app.include_router(predictions_router)
app.include_router(dashboard_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(features: HouseFeatures, _user: db_models.User = Depends(get_current_user)):
    values = features.model_dump()
    price_usd, warnings = ml_service.predict(values)
    explanation = ml_service.explain(values)
    estimated_range = ml_service.estimate_range(price_usd)
    return PredictionResponse(
        predicted_price_usd=price_usd,
        warnings=warnings,
        explanation=explanation,
        estimated_range=estimated_range,
    )


@app.post("/comparables", response_model=ComparablesResponse)
def comparables(
    features: HouseFeatures,
    k: int = Query(8, ge=5, le=10),
    _user: db_models.User = Depends(get_current_user),
):
    values = features.model_dump()
    rows = ml_service.find_comparables(values, k=k)
    return ComparablesResponse(comparables=[Comparable(**row) for row in rows])


@app.get("/dataset-sample", response_model=DatasetSampleResponse)
def dataset_sample(n: int = Query(500, ge=50, le=2000), _user: db_models.User = Depends(get_current_user)):
    rows = ml_service.dataset_sample(n=n)
    return DatasetSampleResponse(rows=[{"features": r["features"], "price_usd": r["price_usd"]} for r in rows])


@app.post("/parse-description", response_model=ExtractedFeatures)
async def parse_description(body: ParseDescriptionRequest, _user: db_models.User = Depends(get_current_user)):
    if not llm_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Natural-language input isn't configured on this server (missing GEMINI_API_KEY).",
        )

    system_instruction = (
        "You extract structured data from a free-text property/neighborhood "
        "description for a machine learning model trained on the California "
        "Housing census dataset. That model's 8 features describe a census "
        "block group (a neighborhood-sized cluster), not a single house: "
        "median household income (MedInc, in $10,000s), median house age "
        "(HouseAge, years), average rooms per household (AveRooms), average "
        "bedrooms per household (AveBedrms), population (Population), average "
        "occupants per household (AveOccup), and latitude/longitude within "
        "California. Only fill a field when the text gives you a reasonable "
        "basis for it -- leave anything else null. Never invent a value, and "
        "never output a price. If the text mentions things this dataset can't "
        "represent (bedroom/bathroom count of a single house, garage, square "
        "footage, year built, condition, quality), do not map them to any "
        "field -- instead note them briefly in unrecognized_notes."
    )

    try:
        return await llm_service.generate_structured(
            body.text,
            schema=ExtractedFeatures,
            system_instruction=system_instruction,
        )
    except llm_service.LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/model-info")
def model_info(_user: db_models.User = Depends(get_current_user)):
    mc = ml_service.model_comparison
    served_key = mc["served_model"]
    served = mc["models"][served_key]
    return {
        "served_model": served_key,
        "model_name": served["name"],
        "dataset": mc["dataset"],
        "metrics": {"mae_usd": served["mae_usd"], "r2": served["r2"]},
        "rationale": mc["rationale"],
        "feature_importance": mc["feature_importance"],
    }


@app.get("/model-comparison")
def get_model_comparison(_user: db_models.User = Depends(get_current_user)):
    return ml_service.model_comparison


@app.get("/model-evaluations")
def get_model_evaluations(db=Depends(get_db), _user: db_models.User = Depends(get_current_user)):
    rows = db.query(db_models.ModelEvaluation).order_by(db_models.ModelEvaluation.mae_usd.asc()).all()
    return [
        {
            "model_key": r.model_key,
            "model_name": r.model_name,
            "mae_usd": r.mae_usd,
            "rmse_usd": r.rmse_usd,
            "r2": r.r2,
            "cv_r2_mean": r.cv_r2_mean,
            "cv_mae_usd_mean": r.cv_mae_usd_mean,
            "training_time_seconds": r.training_time_seconds,
            "is_served": r.is_served,
            "generated_at": r.generated_at,
        }
        for r in rows
    ]


@app.get("/dataset-stats")
def get_dataset_stats(_user: db_models.User = Depends(get_current_user)):
    return ml_service.dataset_stats


@app.get("/evaluation-sample")
def get_evaluation_sample(_user: db_models.User = Depends(get_current_user)):
    return ml_service.evaluation_results
