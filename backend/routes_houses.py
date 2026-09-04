"""
CRUD for saved properties (houses), scoped to the authenticated user.
Supports free-text search, a couple of useful filters, and sorting -- all
server-side so the frontend never has to fetch everything to filter client-side.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

import db_models
from auth import get_current_user
from database import get_db
from house_models import HouseIn, HouseListResponse, HouseOut, HouseUpdate

router = APIRouter(prefix="/houses", tags=["houses"])

SORTABLE_FIELDS = {
    "created_at": db_models.House.created_at,
    "updated_at": db_models.House.updated_at,
    "label": db_models.House.label,
    "med_inc": db_models.House.med_inc,
    "house_age": db_models.House.house_age,
}


def _get_owned_house(house_id: int, user: db_models.User, db: Session) -> db_models.House:
    house = db.query(db_models.House).filter_by(id=house_id, user_id=user.id).first()
    if house is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return house


@router.post("", response_model=HouseOut)
def create_house(
    payload: HouseIn,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    house = db_models.House(user_id=user.id, **payload.model_dump())
    db.add(house)
    db.commit()
    db.refresh(house)
    return house


@router.get("", response_model=HouseListResponse)
def list_houses(
    q: str | None = Query(None, description="Search label/notes"),
    sort_by: str = Query("created_at", description="One of: " + ", ".join(SORTABLE_FIELDS)),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if sort_by not in SORTABLE_FIELDS:
        raise HTTPException(status_code=400, detail=f"sort_by must be one of: {', '.join(SORTABLE_FIELDS)}")

    query = db.query(db_models.House).filter_by(user_id=user.id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (db_models.House.label.ilike(like)) | (db_models.House.notes.ilike(like))
        )

    direction = asc if order == "asc" else desc
    query = query.order_by(direction(SORTABLE_FIELDS[sort_by]))

    houses = query.all()
    return HouseListResponse(count=len(houses), houses=houses)


@router.get("/{house_id}", response_model=HouseOut)
def get_house(
    house_id: int,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_house(house_id, user, db)


@router.put("/{house_id}", response_model=HouseOut)
@router.patch("/{house_id}", response_model=HouseOut)
def update_house(
    house_id: int,
    payload: HouseUpdate,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    house = _get_owned_house(house_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(house, field, value)
    db.commit()
    db.refresh(house)
    return house


@router.delete("/{house_id}", status_code=204)
def delete_house(
    house_id: int,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    house = _get_owned_house(house_id, user, db)
    db.delete(house)
    db.commit()
