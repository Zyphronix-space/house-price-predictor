"""
FastAPI backend that serves predictions (with SHAP explanations, an
error-based range, and real comparable properties) from the trained house
price model, plus an optional Gemini-assisted natural-language input mode.

Run with:
    uvicorn main:app --reload
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import llm_service
import ml_service
from schemas import (
    Comparable,
    ComparablesResponse,
    DatasetSampleResponse,
    ExtractedFeatures,
    HouseFeatures,
    ParseDescriptionRequest,
    PredictionResponse,
)

app = FastAPI(title="House Price Predictor API")

# Allow the React dev server (any localhost port, since Vite falls back
# when 5173 is taken) and the deployed Vercel frontend (including preview
# deployments, which get their own *.vercel.app subdomain).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+|https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(features: HouseFeatures):
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
def comparables(features: HouseFeatures, k: int = Query(8, ge=5, le=10)):
    values = features.model_dump()
    rows = ml_service.find_comparables(values, k=k)
    return ComparablesResponse(comparables=[Comparable(**row) for row in rows])


@app.get("/dataset-sample", response_model=DatasetSampleResponse)
def dataset_sample(n: int = Query(500, ge=50, le=2000)):
    rows = ml_service.dataset_sample(n=n)
    return DatasetSampleResponse(rows=[{"features": r["features"], "price_usd": r["price_usd"]} for r in rows])


@app.post("/parse-description", response_model=ExtractedFeatures)
async def parse_description(body: ParseDescriptionRequest):
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
def model_info():
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
def get_model_comparison():
    return ml_service.model_comparison


@app.get("/dataset-stats")
def get_dataset_stats():
    return ml_service.dataset_stats


@app.get("/evaluation-sample")
def get_evaluation_sample():
    return ml_service.evaluation_results
