# House Price Predictor

A full-stack machine learning app that predicts California house prices from
housing block statistics (income, rooms, population, location, etc).

- **`ml/`** — trains and evaluates the model.
  - `train_model.py` trains a Linear Regression model on the
    [California Housing dataset](https://scikit-learn.org/stable/datasets/real_world.html#california-housing-dataset)
    (scaled features, 80/20 train/test split) and saves it with `joblib`.
  - `compare_models.py` benchmarks Linear Regression against a Random Forest
    on the same data (MAE and R² score).
  - `predict.py` loads the saved model and runs a single example prediction.
- **`backend/`** — a FastAPI service that loads the trained model and exposes
  a `POST /predict` endpoint.
- **`frontend/`** — a React (Vite) form where a user enters housing stats and
  gets back a predicted price, calling the backend API.

## Running it

**Train the model** (only needed once, or after changing `ml/train_model.py`):
```
cd ml
python train_model.py
```

**Backend:**
```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```
cd frontend
npm install
npm run dev
```

Then open the frontend URL (default `http://localhost:5173`) in a browser.

## What this demonstrates

- Data preprocessing and feature scaling with scikit-learn
- Comparing model choices (Linear Regression vs Random Forest) using
  standard regression metrics (MAE, R²)
- Serializing and serving a trained model behind a REST API
- Connecting a trained ML model to a real user-facing frontend
