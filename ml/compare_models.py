"""
Compare three models -- Linear Regression (interpretable baseline),
Random Forest, and Gradient Boosting -- on the same house price data, to
see how much model choice affects accuracy.

Also writes three machine-readable JSON files, computed entirely from
real fitted models and the real dataset (nothing hardcoded), which the
FastAPI backend serves and the frontend renders:

  model_comparison.json  -- every model's real MAE/RMSE/R2/training time,
                             which one is served, the measured rationale,
                             and the served model's feature importances.
  dataset_stats.json     -- real per-feature ranges (min/p1/p99/max/mean)
                             and a real histogram of the target values.
  evaluation_results.json -- real test-set actual-vs-predicted pairs and
                             the largest-error examples.

The served model is chosen by lowest test-set MAE, whichever model that
turns out to be -- see train_model.py, which must be re-run by hand if a
new model here should actually become what /predict serves (this script
never overwrites the production model file itself).
"""

import json
import time
from datetime import datetime, timezone

import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler

FEATURE_META = {
    "MedInc": {"label": "Median Income", "unit": "$10k / household"},
    "HouseAge": {"label": "House Age", "unit": "years"},
    "AveRooms": {"label": "Average Rooms", "unit": "rooms / household"},
    "AveBedrms": {"label": "Average Bedrooms", "unit": "bedrooms / household"},
    "Population": {"label": "Population", "unit": "people"},
    "AveOccup": {"label": "Average Occupancy", "unit": "people / household"},
    "Latitude": {"label": "Latitude", "unit": "degrees"},
    "Longitude": {"label": "Longitude", "unit": "degrees"},
}

data = fetch_california_housing()
X, y = data.data, data.target
feature_names = list(data.feature_names)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Random forests don't need feature scaling, but linear regression
# benefits from it. Scaling doesn't hurt the forest, so we reuse it
# for both to keep the code simple.
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

models = {
    "linear_regression": ("Linear Regression", LinearRegression()),
    "random_forest": ("Random Forest", RandomForestRegressor(n_estimators=100, random_state=42)),
    "gradient_boosting": ("Gradient Boosting", GradientBoostingRegressor(random_state=42)),
}

print(f"{'Model':<20} {'MAE ($)':>12} {'RMSE ($)':>12} {'R^2':>8} {'Train (s)':>10}")
print("-" * 66)


# 5-fold cross-validation on the training split only (test set stays held
# out for the metrics above) -- gives a mean +/- std that's less sensitive
# to this one particular train/test split than a single score is.
cv = KFold(n_splits=5, shuffle=True, random_state=42)

results = {}
fitted = {}
for key, (name, model) in models.items():
    start = time.perf_counter()
    model.fit(X_train_scaled, y_train)
    training_time_seconds = time.perf_counter() - start

    predictions = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2 = r2_score(y_test, predictions)

    cv_r2 = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring="r2")
    cv_mae = -cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring="neg_mean_absolute_error")

    print(f"{name:<20} {mae * 100000:>12,.0f} {rmse * 100000:>12,.0f} {r2:>8.3f} {training_time_seconds:>10.2f}")
    results[key] = {
        "name": name,
        "mae_usd": round(mae * 100_000, 2),
        "rmse_usd": round(rmse * 100_000, 2),
        "r2": round(r2, 4),
        "training_time_seconds": round(training_time_seconds, 3),
        "cv_folds": cv.get_n_splits(),
        "cv_r2_mean": round(float(cv_r2.mean()), 4),
        "cv_r2_std": round(float(cv_r2.std()), 4),
        "cv_mae_usd_mean": round(float(cv_mae.mean()) * 100_000, 2),
        "cv_mae_usd_std": round(float(cv_mae.std()) * 100_000, 2),
    }
    fitted[key] = (model, predictions)

served_key = min(results, key=lambda k: results[k]["mae_usd"])
runner_up_key = min((k for k in results if k != served_key), key=lambda k: results[k]["mae_usd"])
mae_drop_pct = round(
    100 * (results[runner_up_key]["mae_usd"] - results[served_key]["mae_usd"]) / results[runner_up_key]["mae_usd"], 1
)
rationale = (
    f"{results[served_key]['name']} is served because it measured "
    f"${results[served_key]['mae_usd']:,.0f} MAE (the lowest of the "
    f"{len(results)} models compared here; next best was "
    f"${results[runner_up_key]['mae_usd']:,.0f} for {results[runner_up_key]['name']}, "
    f"a {mae_drop_pct}% reduction) and R^2 {results[served_key]['r2']} on the same "
    f"held-out test split. Linear Regression is kept as the interpretable baseline "
    f"regardless of which model wins on accuracy."
)

# Feature importance comes from whichever tree-ensemble model is actually
# served (both Random Forest and Gradient Boosting expose it identically);
# Linear Regression has no such attribute, so fall back to Random Forest's
# if Linear Regression happens to win on MAE.
_importance_source_key = served_key if served_key != "linear_regression" else "random_forest"
_importance_model, _ = fitted[_importance_source_key]
feature_importance = sorted(
    (
        {"feature": name, "label": FEATURE_META[name]["label"], "importance": round(float(imp), 4)}
        for name, imp in zip(feature_names, _importance_model.feature_importances_)
    ),
    key=lambda item: item["importance"],
    reverse=True,
)

# Signed residuals (predicted - actual) for the served model on the held-out
# test set. Their empirical quantiles are the basis for /predict's
# "estimated range" -- an honest, computed-from-real-errors range, not a
# fabricated confidence interval.
_served_model, _served_predictions = fitted[served_key]
_residuals_usd = (_served_predictions - y_test) * 100_000
error_distribution = {
    "n_test": int(len(y_test)),
    "p10_usd": round(float(np.percentile(_residuals_usd, 10)), 2),
    "p50_usd": round(float(np.percentile(_residuals_usd, 50)), 2),
    "p90_usd": round(float(np.percentile(_residuals_usd, 90)), 2),
}

model_comparison = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "dataset": "California Housing",
    "test_size": 0.2,
    "random_state": 42,
    "models": results,
    "served_model": served_key,
    "rationale": rationale,
    "feature_importance": feature_importance,
    "error_distribution": error_distribution,
}

with open("model_comparison.json", "w") as f:
    json.dump(model_comparison, f, indent=2)
print("\nSaved model_comparison.json")

# --- dataset_stats.json -----------------------------------------------
feature_stats = {}
for i, name in enumerate(feature_names):
    col = X[:, i]
    feature_stats[name] = {
        **FEATURE_META[name],
        "min": round(float(col.min()), 3),
        "p1": round(float(np.percentile(col, 1)), 3),
        "mean": round(float(col.mean()), 3),
        "p99": round(float(np.percentile(col, 99)), 3),
        "max": round(float(col.max()), 3),
    }

target_usd = y * 100_000
bin_edges = np.linspace(target_usd.min(), target_usd.max(), 21)
counts, _ = np.histogram(target_usd, bins=bin_edges)

# Real Pearson correlation across the 8 features + target, computed on the
# full dataset -- feeds the Analysis dashboard's correlation heatmap.
corr_matrix = np.corrcoef(np.column_stack([X, y]), rowvar=False)
corr_labels = feature_names + ["MedHouseVal"]
feature_correlation = {
    "labels": corr_labels,
    "matrix": [[round(float(v), 4) for v in row] for row in corr_matrix],
}

dataset_stats = {
    "n_records": int(X.shape[0]),
    "n_features": int(X.shape[1]),
    "features": feature_stats,
    "target": {
        "label": "Median House Value",
        "unit": "USD",
        "min_usd": round(float(target_usd.min()), 2),
        "max_usd": round(float(target_usd.max()), 2),
        "mean_usd": round(float(target_usd.mean()), 2),
        "capped_at_usd": 500001,
        "histogram": {
            "bin_edges_usd": [round(float(e), 2) for e in bin_edges],
            "counts": [int(c) for c in counts],
        },
    },
    "feature_correlation": feature_correlation,
}

with open("dataset_stats.json", "w") as f:
    json.dump(dataset_stats, f, indent=2)
print("Saved dataset_stats.json")

# --- evaluation_results.json -------------------------------------------
served_model, served_predictions = fitted[served_key]
actual_usd = y_test * 100_000
predicted_usd = served_predictions * 100_000
errors_usd = np.abs(predicted_usd - actual_usd)

rng = np.random.default_rng(42)
sample_size = min(300, len(y_test))
sample_idx = rng.choice(len(y_test), size=sample_size, replace=False)
sample = [
    {"actual_usd": round(float(actual_usd[i]), 2), "predicted_usd": round(float(predicted_usd[i]), 2)}
    for i in sample_idx
]

worst_idx = np.argsort(errors_usd)[::-1][:10]
largest_errors = []
for i in worst_idx:
    row = {name: round(float(val), 3) for name, val in zip(feature_names, X_test[i])}
    largest_errors.append({
        "actual_usd": round(float(actual_usd[i]), 2),
        "predicted_usd": round(float(predicted_usd[i]), 2),
        "error_usd": round(float(errors_usd[i]), 2),
        "features": row,
    })

# Signed-residual histogram over the FULL test set (not just the 300-row
# sample above) -- real errors, feeds the Analysis dashboard's residual
# distribution chart.
signed_residuals_usd = predicted_usd - actual_usd
res_bin_edges = np.linspace(signed_residuals_usd.min(), signed_residuals_usd.max(), 21)
res_counts, _ = np.histogram(signed_residuals_usd, bins=res_bin_edges)

evaluation_results = {
    "served_model": served_key,
    "mae_usd": results[served_key]["mae_usd"],
    "r2": results[served_key]["r2"],
    "sample": sample,
    "largest_errors": largest_errors,
    "residual_histogram": {
        "bin_edges_usd": [round(float(e), 2) for e in res_bin_edges],
        "counts": [int(c) for c in res_counts],
    },
}

with open("evaluation_results.json", "w") as f:
    json.dump(evaluation_results, f, indent=2)
print("Saved evaluation_results.json")
