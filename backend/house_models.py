"""Pydantic request/response models for saved properties (houses)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# Kept in sync with ml_service.FEATURE_ORDER -- a House is a named, reusable
# set of the model's actual 8 input features, nothing more.
FEATURE_FIELDS = [
    "med_inc", "house_age", "ave_rooms", "ave_bedrms",
    "population", "ave_occup", "latitude", "longitude",
]


class HouseIn(BaseModel):
    label: str = Field(..., min_length=1, max_length=120)
    notes: str | None = Field(None, max_length=1000)
    med_inc: float
    house_age: float
    ave_rooms: float
    ave_bedrms: float
    population: float
    ave_occup: float
    latitude: float
    longitude: float


class HouseUpdate(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=120)
    notes: str | None = Field(None, max_length=1000)
    med_inc: float | None = None
    house_age: float | None = None
    ave_rooms: float | None = None
    ave_bedrms: float | None = None
    population: float | None = None
    ave_occup: float | None = None
    latitude: float | None = None
    longitude: float | None = None


class HouseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    notes: str | None
    med_inc: float
    house_age: float
    ave_rooms: float
    ave_bedrms: float
    population: float
    ave_occup: float
    latitude: float
    longitude: float
    created_at: datetime
    updated_at: datetime


class HouseListResponse(BaseModel):
    count: int
    houses: list[HouseOut]
