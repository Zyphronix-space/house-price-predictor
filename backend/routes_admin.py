"""Admin-only platform surface: aggregate stats, plus full CRUD across
every account's users, houses and predictions (not just the admin's own).
Every route here is gated by get_current_admin (403, not just a hidden
frontend page) -- an admin dashboard that only *looks* restricted because
the nav link is hidden isn't actually restricted.

User deletion is a soft delete (deleted_at, not a row removal) -- see
admin_delete_user below and User.deleted_at in db_models.py.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

import db_models
from auth import get_current_admin
from database import get_db
from rate_limit import limiter

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)
    is_admin: bool | None = None


class AdminHouseUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=120)
    notes: str | None = None


def _daily_counts(db: Session, model, date_col, days: int) -> list[dict]:
    since = datetime.now(timezone.utc) - timedelta(days=days - 1)
    rows = (
        db.query(func.date(date_col), func.count(model.id))
        .filter(date_col >= since)
        .group_by(func.date(date_col))
        .all()
    )
    counts = {str(day): count for day, count in rows}
    out = []
    for i in range(days):
        day = (since + timedelta(days=i)).date().isoformat()
        out.append({"date": day, "count": counts.get(day, 0)})
    return out


@router.get("/stats")
@limiter.limit("60/minute")
def admin_stats(
    request: Request,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(db_models.User.id)).filter(db_models.User.deleted_at.is_(None)).scalar()
    total_houses = db.query(func.count(db_models.House.id)).scalar()
    pred_stats = db.query(
        func.count(db_models.Prediction.id),
        func.avg(db_models.Prediction.predicted_price_usd),
    ).one()
    total_predictions, avg_price = pred_stats

    return {
        "total_users": total_users,
        "total_houses": total_houses,
        "total_predictions": total_predictions,
        "average_predicted_price_usd": round(avg_price, 2) if avg_price is not None else None,
        "signups_last_14_days": _daily_counts(db, db_models.User, db_models.User.created_at, 14),
        "predictions_last_14_days": _daily_counts(db, db_models.Prediction, db_models.Prediction.created_at, 14),
    }


@router.get("/users")
@limiter.limit("60/minute")
def admin_list_users(
    request: Request,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    house_counts = dict(
        db.query(db_models.House.user_id, func.count(db_models.House.id)).group_by(db_models.House.user_id).all()
    )
    prediction_counts = dict(
        db.query(db_models.Prediction.user_id, func.count(db_models.Prediction.id))
        .group_by(db_models.Prediction.user_id)
        .all()
    )

    users = db.query(db_models.User).order_by(db_models.User.created_at.desc()).all()
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "display_name": u.display_name,
                "created_at": u.created_at,
                "is_admin": u.is_admin,
                "deleted_at": u.deleted_at,
                "house_count": house_counts.get(u.id, 0),
                "prediction_count": prediction_counts.get(u.id, 0),
            }
            for u in users
        ]
    }


@router.patch("/users/{user_id}")
@limiter.limit("30/hour")
def admin_update_user(
    request: Request,
    user_id: int,
    payload: AdminUserUpdate,
    admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    target = db.query(db_models.User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.is_admin is False and target.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can't remove your own admin access")

    if payload.display_name is not None:
        target.display_name = payload.display_name.strip() or None
    if payload.is_admin is not None:
        target.is_admin = payload.is_admin
    db.commit()
    db.refresh(target)
    return {
        "id": target.id,
        "email": target.email,
        "display_name": target.display_name,
        "is_admin": target.is_admin,
        "created_at": target.created_at,
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/hour")
def admin_delete_user(
    request: Request,
    user_id: int,
    admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Soft delete: the account, its houses and predictions all stay in
    the database (audit trail, and this is reversible via restore) -- only
    deleted_at gets set. login/get_current_user both reject any account
    with deleted_at set, so it can't sign in or use an existing token, but
    nothing about it is actually erased."""
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can't delete your own account from here")
    target = db.query(db_models.User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.deleted_at is None:
        target.deleted_at = datetime.now(timezone.utc)
        db.commit()


@router.post("/users/{user_id}/restore")
@limiter.limit("20/hour")
def admin_restore_user(
    request: Request,
    user_id: int,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    target = db.query(db_models.User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    target.deleted_at = None
    db.commit()
    db.refresh(target)
    return {"id": target.id, "email": target.email, "deleted_at": target.deleted_at}


# ============================================================
# Properties (houses) -- every user's, not just the admin's own
# ============================================================


@router.get("/houses")
@limiter.limit("60/minute")
def admin_list_houses(
    request: Request,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(db_models.House, db_models.User.email)
        .join(db_models.User, db_models.House.user_id == db_models.User.id)
        .order_by(db_models.House.created_at.desc())
        .all()
    )
    return {
        "houses": [
            {
                "id": h.id,
                "label": h.label,
                "notes": h.notes,
                "owner_id": h.user_id,
                "owner_email": email,
                "latitude": h.latitude,
                "longitude": h.longitude,
                "created_at": h.created_at,
                "updated_at": h.updated_at,
            }
            for h, email in rows
        ]
    }


@router.patch("/houses/{house_id}")
@limiter.limit("30/hour")
def admin_update_house(
    request: Request,
    house_id: int,
    payload: AdminHouseUpdate,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    house = db.query(db_models.House).filter_by(id=house_id).first()
    if not house:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if payload.label is not None:
        house.label = payload.label.strip()
    if payload.notes is not None:
        house.notes = payload.notes.strip() or None
    db.commit()
    db.refresh(house)
    return {"id": house.id, "label": house.label, "notes": house.notes}


@router.delete("/houses/{house_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/hour")
def admin_delete_house(
    request: Request,
    house_id: int,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    house = db.query(db_models.House).filter_by(id=house_id).first()
    if not house:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    db.delete(house)
    db.commit()


# ============================================================
# Predictions -- every user's
# ============================================================


@router.get("/predictions")
@limiter.limit("60/minute")
def admin_list_predictions(
    request: Request,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    limit: int = 200,
):
    rows = (
        db.query(db_models.Prediction, db_models.User.email, db_models.House.label)
        .join(db_models.User, db_models.Prediction.user_id == db_models.User.id)
        .outerjoin(db_models.House, db_models.Prediction.house_id == db_models.House.id)
        .order_by(db_models.Prediction.created_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "predictions": [
            {
                "id": p.id,
                "owner_id": p.user_id,
                "owner_email": email,
                "house_label": house_label,
                "predicted_price_usd": p.predicted_price_usd,
                "model_used": p.model_used,
                "created_at": p.created_at,
            }
            for p, email, house_label in rows
        ]
    }


@router.delete("/predictions/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/hour")
def admin_delete_prediction(
    request: Request,
    prediction_id: int,
    _admin: db_models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    prediction = db.query(db_models.Prediction).filter_by(id=prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    db.delete(prediction)
    db.commit()
