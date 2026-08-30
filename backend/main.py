"""
FastAPI backend that serves predictions from the trained house price model.

Run with:
    uvicorn main:app --reload
"""

import json
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ML_DIR = Path(__file__).resolve().parent.parent / "ml"
model = joblib.load(ML_DIR / "house_price_model.joblib")
scaler = joblib.load(ML_DIR / "scaler.joblib")

model_comparison = json.loads((ML_DIR / "model_comparison.json").read_text())
dataset_stats = json.loads((ML_DIR / "dataset_stats.json").read_text())
evaluation_results = json.loads((ML_DIR / "evaluation_results.json").read_text())

FEATURE_ORDER = [
    "MedInc", "HouseAge", "AveRooms", "AveBedrms",
    "Population", "AveOccup", "Latitude", "Longitude",
]

app = FastAPI(title="House Price Predictor API")

# Allow the React dev server to call this API from the browser. Vite falls
# back to the next free port when 5173 is taken, so match any localhost
# port rather than a single hardcoded one.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


class HouseFeatures(BaseModel):
    MedInc: float = Field(..., description="Median income in block group (10k USD)")
    HouseAge: float = Field(..., description="Median house age in block group")
    AveRooms: float = Field(..., description="Average rooms per household")
    AveBedrms: float = Field(..., description="Average bedrooms per household")
    Population: float = Field(..., description="Block group population")
    AveOccup: float = Field(..., description="Average household occupancy")
    Latitude: float
    Longitude: float


class PredictionResponse(BaseModel):
    predicted_price_usd: float
    warnings: list[str] = []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(features: HouseFeatures):
    values = {name: getattr(features, name) for name in FEATURE_ORDER}

    warnings = []
    for name, value in values.items():
        stats = dataset_stats["features"][name]
        if value < stats["p1"] or value > stats["p99"]:
            warnings.append(
                f"{stats['label']} ({value:g}) is outside the range seen in the "
                f"training dataset ({stats['p1']:g} to {stats['p99']:g} {stats['unit']})."
            )

    x = np.array([[values[name] for name in FEATURE_ORDER]])
    x_scaled = scaler.transform(x)
    prediction = model.predict(x_scaled)[0]
    return PredictionResponse(
        predicted_price_usd=round(float(prediction) * 100_000, 2),
        warnings=warnings,
    )


@app.get("/model-info")
def model_info():
    served_key = model_comparison["served_model"]
    served = model_comparison["models"][served_key]
    return {
        "served_model": served_key,
        "model_name": served["name"],
        "dataset": model_comparison["dataset"],
        "metrics": {"mae_usd": served["mae_usd"], "r2": served["r2"]},
        "rationale": model_comparison["rationale"],
        "feature_importance": model_comparison["feature_importance"],
    }


@app.get("/model-comparison")
def get_model_comparison():
    return model_comparison


@app.get("/dataset-stats")
def get_dataset_stats():
    return dataset_stats


@app.get("/evaluation-sample")
def get_evaluation_sample():
    return evaluation_results
