"""
Prediction history: run the model and persist the result, scoped to the
authenticated user. Distinct from POST /predict (main.py), which stays a
stateless preview used by interactive UI like the What-If simulator --
saving a row on every slider drag there would flood the history table.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import db_models
import ml_service
from auth import get_current_user
from database import get_db
from house_models import FEATURE_FIELDS
from prediction_models import PredictionCreate, PredictionListResponse, PredictionOut

router = APIRouter(prefix="/predictions", tags=["predictions"])

# ml_service.FEATURE_ORDER (MedInc, HouseAge, ...) <-> House column names
# (med_inc, house_age, ...).
_MODEL_TO_COLUMN = dict(zip(ml_service.FEATURE_ORDER, FEATURE_FIELDS))


def _house_to_features(house: db_models.House) -> dict:
    return {model_key: getattr(house, column) for model_key, column in _MODEL_TO_COLUMN.items()}


@router.post("", response_model=PredictionOut)
def create_prediction(
    payload: PredictionCreate,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    house = None
    if payload.house_id is not None:
        house = db.query(db_models.House).filter_by(id=payload.house_id, user_id=user.id).first()
        if house is None:
            raise HTTPException(status_code=404, detail="Property not found")

    if payload.features is not None:
        values = payload.features.model_dump()
    else:
        values = _house_to_features(house)

    price_usd, warnings = ml_service.predict(values)
    explanation = ml_service.explain(values)
    estimated_range = ml_service.estimate_range(price_usd)
    served_model_name = ml_service.model_comparison["models"][ml_service.model_comparison["served_model"]]["name"]

    prediction = db_models.Prediction(
        user_id=user.id,
        house_id=house.id if house else None,
        features=values,
        predicted_price_usd=price_usd,
        model_used=served_model_name,
        base_value_usd=explanation["base_value_usd"],
        contributions=explanation["contributions"],
        range_low_usd=estimated_range["low_usd"],
        range_high_usd=estimated_range["high_usd"],
        warnings=warnings,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@router.get("", response_model=PredictionListResponse)
def list_predictions(
    house_id: int | None = None,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(db_models.Prediction).filter_by(user_id=user.id)
    if house_id is not None:
        query = query.filter_by(house_id=house_id)
    predictions = query.order_by(db_models.Prediction.created_at.desc()).all()
    return PredictionListResponse(count=len(predictions), predictions=predictions)


@router.get("/{prediction_id}", response_model=PredictionOut)
def get_prediction(
    prediction_id: int,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prediction = db.query(db_models.Prediction).filter_by(id=prediction_id, user_id=user.id).first()
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction


@router.delete("/{prediction_id}", status_code=204)
def delete_prediction(
    prediction_id: int,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prediction = db.query(db_models.Prediction).filter_by(id=prediction_id, user_id=user.id).first()
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(prediction)
    db.commit()
