"""
Everything that touches the trained model: loading it, running a
prediction, explaining it (tree-path contributions), estimating a range
from real historical error, and finding real comparable properties (k-NN
over the actual dataset). Loaded once at import time so a request never
re-loads the model or re-fits the neighbor index.
"""

import json
from pathlib import Path

import joblib
import numpy as np
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


def _tree_contributions(x_scaled: np.ndarray) -> tuple[np.ndarray, float]:
    """Per-feature contributions for one input, averaged across every tree
    in the forest. For each tree, walk the exact decision path this input
    takes (root to leaf) and attribute the change in the tree's predicted
    value at each split to the feature that split was on -- this is the
    Saabas tree-path-contribution method (the same decomposition
    treeinterpreter uses, and the basis SHAP's own TreeExplainer paper
    builds on). base_value + sum(contributions) exactly reconstructs the
    forest's prediction for this input -- an exact decomposition, not an
    approximation, just not Shapley-value-consistent the way full SHAP is.
    """
    n_features = x_scaled.shape[1]
    contributions = np.zeros(n_features)
    base_value = 0.0

    for estimator in model.estimators_:
        tree = estimator.tree_
        node_indicator = estimator.decision_path(x_scaled)
        path = node_indicator.indices[node_indicator.indptr[0]:node_indicator.indptr[1]]

        base_value += tree.value[path[0]].reshape(-1)[0]
        for parent, child in zip(path[:-1], path[1:]):
            delta = tree.value[child].reshape(-1)[0] - tree.value[parent].reshape(-1)[0]
            contributions[tree.feature[parent]] += delta

    n_trees = len(model.estimators_)
    return contributions / n_trees, base_value / n_trees


def explain(features: dict) -> dict:
    """Tree-path contribution breakdown for one prediction, in USD."""
    values = {name: features[name] for name in FEATURE_ORDER}
    x_scaled = scaler.transform(_to_vector(values))

    raw_contributions, base_value = _tree_contributions(x_scaled)
    base_value_usd = base_value * 100_000

    contributions = []
    for i, name in enumerate(FEATURE_ORDER):
        contrib_usd = round(float(raw_contributions[i]) * 100_000, 2)
        contributions.append({
            "feature": name,
            "label": FEATURE_LABELS[name],
            "value": values[name],
            "shap_usd": contrib_usd,
            "direction": "positive" if contrib_usd >= 0 else "negative",
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
