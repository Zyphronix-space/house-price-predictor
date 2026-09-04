"""
SQLAlchemy tables: user accounts, saved properties, prediction history, and
model evaluation snapshots.

House and Prediction are both scoped by user_id — each account only ever
sees its own properties and predictions (enforced in routes_houses.py /
routes_predictions.py via the get_current_user dependency, not just in the
UI). House uses the model's actual 8 input features (the California
Housing dataset describes a census block group, not a single home) rather
than invented fields like square footage or bedroom count that the model
was never trained on — see ml_service.FEATURE_ORDER.

ModelEvaluation is not user-scoped: it's a shared snapshot of the latest
compare_models.py run, synced into the database at backend startup (see
main.py) so model performance can be queried like any other resource
instead of only living in a JSON file.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    password_salt = Column(String, nullable=False)
    created_at = Column(DateTime, default=_now)

    houses = relationship("House", back_populates="owner", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="owner", cascade="all, delete-orphan")


class House(Base):
    __tablename__ = "houses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    label = Column(String, nullable=False)
    notes = Column(String, nullable=True)

    # The model's real 8 inputs (see ml_service.FEATURE_ORDER) -- a saved
    # House is just a named, reusable set of these values.
    med_inc = Column(Float, nullable=False)
    house_age = Column(Float, nullable=False)
    ave_rooms = Column(Float, nullable=False)
    ave_bedrms = Column(Float, nullable=False)
    population = Column(Float, nullable=False)
    ave_occup = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    owner = relationship("User", back_populates="houses")
    predictions = relationship("Prediction", back_populates="house")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=True, index=True)

    # Snapshot of the 8 input features used for this prediction -- kept
    # independent of House so a prediction stays meaningful even if the
    # linked House is later edited or deleted.
    features = Column(JSON, nullable=False)
    predicted_price_usd = Column(Float, nullable=False)
    model_used = Column(String, nullable=False)
    base_value_usd = Column(Float, nullable=True)
    contributions = Column(JSON, nullable=True)
    range_low_usd = Column(Float, nullable=True)
    range_high_usd = Column(Float, nullable=True)
    warnings = Column(JSON, default=list)
    created_at = Column(DateTime, default=_now)

    owner = relationship("User", back_populates="predictions")
    house = relationship("House", back_populates="predictions")


class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_key = Column(String, nullable=False, unique=True, index=True)
    model_name = Column(String, nullable=False)
    mae_usd = Column(Float, nullable=False)
    rmse_usd = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    cv_r2_mean = Column(Float, nullable=True)
    cv_mae_usd_mean = Column(Float, nullable=True)
    training_time_seconds = Column(Float, nullable=True)
    is_served = Column(Boolean, default=False)
    generated_at = Column(DateTime, nullable=True)
    synced_at = Column(DateTime, default=_now, onupdate=_now)
