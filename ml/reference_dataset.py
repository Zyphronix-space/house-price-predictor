"""
Save the full California Housing dataset (features + real target values) as
a single artifact the backend can load without re-fetching from sklearn at
request time.

Used for two things, both operating on real recorded records -- nothing
synthesized:
  1. Comparable Properties -- k-nearest-neighbors search in the same scaled
     feature space the model predicts in.
  2. The Analysis dashboard's scatter/correlation charts, via a sampled
     subset served by GET /dataset-sample.

Run after train_model.py (needs the same scaler).
"""

import joblib
from sklearn.datasets import fetch_california_housing

data = fetch_california_housing()

reference = {
    "feature_names": list(data.feature_names),
    "X": data.data,       # shape (20640, 8), raw (unscaled) feature values
    "y": data.target,     # shape (20640,), in $100,000s, same units train_model.py uses
}

joblib.dump(reference, "reference_dataset.joblib", compress=3)
print(f"Saved reference_dataset.joblib ({data.data.shape[0]} records, {data.data.shape[1]} features)")
