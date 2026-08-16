"""
FastAPI backend that serves predictions from the trained house price model.

Run with:
    uvicorn main:app --reload
"""

from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_DIR = Path(__file__).resolve().parent.parent / "ml"
model = joblib.load(MODEL_DIR / "house_price_model.joblib")
scaler = joblib.load(MODEL_DIR / "scaler.joblib")

app = FastAPI(title="House Price Predictor API")

# Allow the React dev server to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(features: HouseFeatures):
    x = np.array([[
        features.MedInc,
        features.HouseAge,
        features.AveRooms,
        features.AveBedrms,
        features.Population,
        features.AveOccup,
        features.Latitude,
        features.Longitude,
    ]])
    x_scaled = scaler.transform(x)
    prediction = model.predict(x_scaled)[0]
    return PredictionResponse(predicted_price_usd=round(float(prediction) * 100_000, 2))
