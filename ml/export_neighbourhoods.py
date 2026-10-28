"""
Export the model's reference block groups for the frontend's place lookup.

The /predict page lets someone pick a place in California and fills the
model's eight inputs from the real 1990 census block group nearest to it.
That needs every block group's features in the browser, so this writes
them (no target values) to frontend/public/data/neighbourhoods.json as
compact rows in FEATURE_ORDER:

  [MedInc, HouseAge, AveRooms, AveBedrms, Population, AveOccup, Latitude, Longitude]

Run after reference_dataset.py whenever the dataset changes:
    python ml/export_neighbourhoods.py
"""

import json
from pathlib import Path

import joblib

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "public" / "data" / "neighbourhoods.json"

# Decimal places per feature: enough to keep each value as the dataset
# records it (lat/lon and house age are already rounded at source).
DECIMALS = [4, 0, 3, 3, 0, 3, 2, 2]


def main() -> None:
    # The project's own artifact (built by reference_dataset.py), the same
    # file the backend loads; never point this at a downloaded pickle.
    ref = joblib.load(ROOT / "ml" / "reference_dataset.joblib")
    rows = [
        [round(float(v), d) if d else int(round(float(v))) for v, d in zip(row, DECIMALS)]
        for row in ref["X"]
    ]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "source": "California Housing dataset (1990 US census block groups), as used to train the model",
        "fields": ["MedInc", "HouseAge", "AveRooms", "AveBedrms", "Population", "AveOccup", "Latitude", "Longitude"],
        "rows": rows,
    }, separators=(",", ":")))
    print(f"wrote {len(rows)} block groups to {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
