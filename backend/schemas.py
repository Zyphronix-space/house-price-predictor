"""Pydantic request/response models for the House Price Predictor API."""

from pydantic import BaseModel, Field


class HouseFeatures(BaseModel):
    MedInc: float = Field(..., description="Median income in block group (10k USD)")
    HouseAge: float = Field(..., description="Median house age in block group")
    AveRooms: float = Field(..., description="Average rooms per household")
    AveBedrms: float = Field(..., description="Average bedrooms per household")
    Population: float = Field(..., description="Block group population")
    AveOccup: float = Field(..., description="Average household occupancy")
    Latitude: float
    Longitude: float


class Contribution(BaseModel):
    feature: str
    label: str
    value: float
    shap_usd: float
    direction: str  # "positive" | "negative"


class Explanation(BaseModel):
    base_value_usd: float
    contributions: list[Contribution]
    top_positive: list[Contribution]
    top_negative: list[Contribution]


class EstimatedRange(BaseModel):
    low_usd: float
    high_usd: float
    basis: str


class PredictionResponse(BaseModel):
    predicted_price_usd: float
    warnings: list[str] = []
    explanation: Explanation
    estimated_range: EstimatedRange


class Comparable(BaseModel):
    features: dict[str, float]
    actual_price_usd: float
    similarity_pct: float


class ComparablesResponse(BaseModel):
    comparables: list[Comparable]


class DatasetSampleRow(BaseModel):
    features: dict[str, float]
    price_usd: float


class DatasetSampleResponse(BaseModel):
    rows: list[DatasetSampleRow]


class ParseDescriptionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)


class ExtractedFeatures(BaseModel):
    """Schema Gemini is constrained to. Every field is optional -- the
    model leaves anything it isn't reasonably confident about as null
    rather than guessing, and it never produces a price."""

    MedInc: float | None = Field(None, description="Median household income in $10,000s, e.g. 8.3 for $83,000")
    HouseAge: float | None = Field(None, description="Median age of houses in years")
    AveRooms: float | None = Field(None, description="Average rooms per household")
    AveBedrms: float | None = Field(None, description="Average bedrooms per household")
    Population: float | None = Field(None, description="Population of the surrounding area")
    AveOccup: float | None = Field(None, description="Average people per household")
    Latitude: float | None = Field(None, description="Latitude in California, if a place name was mentioned")
    Longitude: float | None = Field(None, description="Longitude in California, if a place name was mentioned")
    unrecognized_notes: str | None = Field(
        None,
        description=(
            "Anything mentioned that this model cannot represent (e.g. bedroom "
            "count, bathrooms, garage, square footage, year built, condition) -- "
            "explain briefly what was mentioned but couldn't be mapped."
        ),
    )
