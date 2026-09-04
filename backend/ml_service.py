"""
Everything that touches the trained model: loading it, running a
prediction, explaining it (SHAP), estimating a range from real historical
error, and finding real comparable properties (k-NN over the actual
dataset). Loaded once at import time so a request never re-loads the
model, re-fits the explainer, or re-fits the neighbor index.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import shap
from sklearn.neighbors import NearestNeighbors

_here = Path(__file__).resolve().parent
# Local dev: backend/ with a sibling ../ml/. Azure zip deploy flattens the
# backend to the app root with ml/ copied alongside it, so fall back to that.
ML_DIR = _here.parent / "ml" if (_here.parent / "ml").exists() else _here / "ml"

FEATURE_ORDER = [
    "MedInc", "HouseAge", "AveRooms", "AveBedrms",
    "Population", "AveOccup", "Latitude", "Longitude",
]

model = joblib.load(ML_DIR / "house_price_model.joblib")
scaler = joblib.load(ML_DIR / "scaler.joblib")

model_comparison = json.loads((ML_DIR / "model_comparison.json").read_text())
dataset_stats = json.loads((ML_DIR / "dataset_stats.json").read_text())
evaluation_results = json.loads((ML_DIR / "evaluation_results.json").read_text())

FEATURE_LABELS = {name: dataset_stats["features"][name]["label"] for name in FEATURE_ORDER}

_explainer = shap.TreeExplainer(model)

_reference = joblib.load(ML_DIR / "reference_dataset.joblib")
_reference_X = _reference["X"]  # (20640, 8) raw feature values
_reference_y_usd = _reference["y"] * 100_000  # real recorded target, USD
_reference_X_scaled = scaler.transform(_reference_X)
_neighbors_index = NearestNeighbors(metric="euclidean").fit(_reference_X_scaled)

_error_dist = model_comparison["error_distribution"]


def _values_and_warnings(features: dict) -> tuple[dict, list[str]]:
    values = {name: features[name] for name in FEATURE_ORDER}
    warnings = []
    for name, value in values.items():
        stats = dataset_stats["features"][name]
        if value < stats["p1"] or value > stats["p99"]:
            warnings.append(
                f"{stats['label']} ({value:g}) is outside the range seen in the "
                f"training dataset ({stats['p1']:g} to {stats['p99']:g} {stats['unit']})."
            )
    return values, warnings


def _to_vector(values: dict) -> np.ndarray:
    return np.array([[values[name] for name in FEATURE_ORDER]])


def predict(features: dict) -> tuple[float, list[str]]:
    values, warnings = _values_and_warnings(features)
    x_scaled = scaler.transform(_to_vector(values))
    price_usd = round(float(model.predict(x_scaled)[0]) * 100_000, 2)
    return price_usd, warnings


def explain(features: dict) -> dict:
    """SHAP explanation for one prediction, in USD. base_value + sum of
    contributions reconstructs the model's raw output for this input
    (exact for tree models -- this is a real decomposition, not an
    approximation dressed up as one)."""
    values = {name: features[name] for name in FEATURE_ORDER}
    x_scaled = scaler.transform(_to_vector(values))

    shap_out = _explainer(x_scaled)
    shap_values = np.asarray(shap_out.values[0]).reshape(-1) * 100_000
    base_value_usd = float(np.asarray(shap_out.base_values).reshape(-1)[0]) * 100_000

    contributions = []
    for i, name in enumerate(FEATURE_ORDER):
        shap_usd = round(float(shap_values[i]), 2)
        contributions.append({
            "feature": name,
            "label": FEATURE_LABELS[name],
            "value": values[name],
            "shap_usd": shap_usd,
            "direction": "positive" if shap_usd >= 0 else "negative",
        })

    contributions.sort(key=lambda c: abs(c["shap_usd"]), reverse=True)
    positives = sorted((c for c in contributions if c["direction"] == "positive"), key=lambda c: -c["shap_usd"])
    negatives = sorted((c for c in contributions if c["direction"] == "negative"), key=lambda c: c["shap_usd"])

    return {
        "base_value_usd": round(base_value_usd, 2),
        "contributions": contributions,
        "top_positive": positives[:5],
        "top_negative": negatives[:5],
    }


def estimate_range(price_usd: float) -> dict:
    """An empirical range from this model's own historical error on the
    held-out test set -- explicitly not a statistical confidence interval."""
    low = round(price_usd - _error_dist["p90_usd"], 2)
    high = round(price_usd - _error_dist["p10_usd"], 2)
    basis = (
        f"Middle 80% of this model's prediction errors on {_error_dist['n_test']} "
        "held-out test properties -- an empirical error range, not a formal "
        "statistical confidence interval."
    )
    return {"low_usd": max(0.0, low), "high_usd": high, "basis": basis}


def find_comparables(features: dict, k: int = 8) -> list[dict]:
    values = {name: features[name] for name in FEATURE_ORDER}
    x_scaled = scaler.transform(_to_vector(values))
    distances, indices = _neighbors_index.kneighbors(x_scaled, n_neighbors=k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        row_features = {name: round(float(val), 3) for name, val in zip(FEATURE_ORDER, _reference_X[idx])}
        results.append({
            "features": row_features,
            "actual_price_usd": round(float(_reference_y_usd[idx]), 2),
            "similarity_pct": round(100 / (1 + float(dist)), 1),
        })
    return results


def dataset_sample(n: int = 500) -> list[dict]:
    """Deterministic sample of real reference rows, for the Analysis
    dashboard's scatter charts -- avoids shipping all 20,640 rows."""
    rng = np.random.default_rng(42)
    n = min(n, len(_reference_y_usd))
    idx = rng.choice(len(_reference_y_usd), size=n, replace=False)
    return [
        {
            "features": {name: round(float(val), 3) for name, val in zip(FEATURE_ORDER, _reference_X[i])},
            "price_usd": round(float(_reference_y_usd[i]), 2),
        }
        for i in idx
    ]
