"""Aggregate stats for the Dashboard page, scoped to the authenticated user."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

import db_models
import ml_service
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    house_count = db.query(func.count(db_models.House.id)).filter_by(user_id=user.id).scalar()

    price_stats = (
        db.query(
            func.count(db_models.Prediction.id),
            func.avg(db_models.Prediction.predicted_price_usd),
            func.max(db_models.Prediction.predicted_price_usd),
            func.min(db_models.Prediction.predicted_price_usd),
        )
        .filter_by(user_id=user.id)
        .one()
    )
    prediction_count, avg_price, max_price, min_price = price_stats

    recent = (
        db.query(db_models.Prediction)
        .filter_by(user_id=user.id)
        .order_by(db_models.Prediction.created_at.desc())
        .limit(5)
        .all()
    )
    house_labels = {}
    house_ids = [p.house_id for p in recent if p.house_id is not None]
    if house_ids:
        rows = db.query(db_models.House.id, db_models.House.label).filter(db_models.House.id.in_(house_ids)).all()
        house_labels = dict(rows)

    served_key = ml_service.model_comparison["served_model"]
    served = ml_service.model_comparison["models"][served_key]

    return {
        "total_properties": house_count,
        "total_predictions": prediction_count,
        "average_predicted_price_usd": round(avg_price, 2) if avg_price is not None else None,
        "highest_predicted_price_usd": max_price,
        "lowest_predicted_price_usd": min_price,
        "model_r2": served["r2"],
        "model_name": served["name"],
        "recent_predictions": [
            {
                "id": p.id,
                "house_id": p.house_id,
                "house_label": house_labels.get(p.house_id),
                "predicted_price_usd": p.predicted_price_usd,
                "model_used": p.model_used,
                "created_at": p.created_at,
            }
            for p in recent
        ],
    }
