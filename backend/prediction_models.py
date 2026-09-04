"""Pydantic request/response models for the prediction history CRUD."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator

from schemas import HouseFeatures


class PredictionCreate(BaseModel):
    """Either house_id (use a saved property's features) or features (an
    ad-hoc, unsaved property) must be given. If both are given, features
    is what's actually run through the model, but the prediction is still
    linked back to that house."""

    house_id: int | None = None
    features: HouseFeatures | None = None

    @model_validator(mode="after")
    def _require_one(self):
        if self.house_id is None and self.features is None:
            raise ValueError("Provide either house_id or features")
        return self


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    house_id: int | None
    features: dict[str, float]
    predicted_price_usd: float
    model_used: str
    base_value_usd: float | None
    contributions: list[dict] | None
    range_low_usd: float | None
    range_high_usd: float | None
    warnings: list[str]
    created_at: datetime


class PredictionListResponse(BaseModel):
    count: int
    predictions: list[PredictionOut]
