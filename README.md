# House Price Predictor

A full-stack AI Real Estate Analytics Platform built around a real trained
model on the California Housing dataset. Sign up, save properties, run
valuations with explainable tree-path breakdowns, compare model choices,
explore the dataset, and track your prediction history — all backed by a
real per-user database, not local-only demo state.

**Live demo:** frontend on Vercel, backend on Azure App Service (see
[Deployment](#deployment) for URLs and how to redeploy).

## Architecture

```
frontend/   React (Vite) SPA — auth, dashboard, property management,
            valuation flow, analysis, model lab, prediction history
backend/    FastAPI service — auth, CRUD, and the ML pipeline, backed by
            SQLite (SQLAlchemy)
ml/         Trains the model and benchmarks alternatives; writes the JSON
            artifacts the backend serves (model_comparison.json,
            dataset_stats.json, evaluation_results.json)
```

The backend never re-implements the ML logic per request: `ml_service.py`
loads the trained model, scaler, and dataset artifacts once at import time,
and every route (`/predict`, `/predictions`, `/comparables`, ...) calls the
same functions.

## Features

- **Authentication** — email/password signup and login, JWT sessions,
  PBKDF2-HMAC-SHA256 password hashing (no plaintext, no third-party auth
  dependency). Every route except `/health` and `/auth/*` requires a
  signed-in user.
- **Property management** — full CRUD on saved properties (the model's
  actual 8 input features, not invented fields like square footage that
  the model was never trained on), with search, sort, and per-user
  isolation.
- **Predictions** — `/predict` stays a stateless preview (used by the
  guided valuation flow and the What-If simulator, which calls it on every
  slider change); `/predictions` runs the same model and persists the
  result, optionally linked to a saved property. Explanations are computed
  as tree-path contributions (Saabas method) — mathematically exact for a
  Random Forest, without SHAP's heavy native dependencies.
- **Model comparison** — Linear Regression, Random Forest, and Gradient
  Boosting benchmarked on the same held-out split (MAE, RMSE, R²,
  5-fold cross-validation, training time). The lowest-MAE model is served;
  Linear Regression is always kept as the interpretable baseline. Results
  are also synced into a `model_evaluations` table so they're queryable
  like any other resource, not just readable from a JSON file.
- **Dashboard** — per-user totals (properties, predictions, average/
  highest/lowest predicted price), served model's R², recent predictions.
- **Analysis** — real correlation heatmap, price distribution, scatter
  plots, and residual histogram, computed from the actual dataset and
  model — nothing illustrative or hardcoded.
- **Comparable properties, What-If simulator, investment calculator,
  natural-language property description (Gemini-assisted)** — unchanged
  from the original build, now behind auth.

## Tech stack

- **ML**: scikit-learn (RandomForestRegressor, GradientBoostingRegressor,
  LinearRegression), joblib, NumPy
- **Backend**: FastAPI, SQLAlchemy + SQLite, PyJWT, Pydantic, httpx/google-genai
  (optional NL input)
- **Frontend**: React 19, Vite, no router library (client-side view state)
- **Testing**: pytest + FastAPI's TestClient

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness check |
| POST | `/auth/signup` | — | Create an account, returns a JWT |
| POST | `/auth/login` | — | Returns a JWT |
| GET | `/auth/me` | ✓ | Current user |
| POST | `/predict` | ✓ | Stateless prediction preview (not persisted) |
| POST | `/comparables` | ✓ | k-NN nearest real properties by feature similarity |
| GET | `/dataset-sample` | ✓ | Sampled real rows for charting |
| POST | `/parse-description` | ✓ | Gemini-assisted free-text → feature extraction |
| GET | `/model-info` / `/model-comparison` / `/model-evaluations` | ✓ | Served model, full comparison, DB-backed evaluation history |
| GET | `/dataset-stats` / `/evaluation-sample` | ✓ | Dataset stats, held-out test results |
| POST/GET/GET/PATCH/PUT/DELETE | `/houses[/{id}]` | ✓ | Property CRUD, search/sort via query params |
| POST/GET/GET/DELETE | `/predictions[/{id}]` | ✓ | Run + persist a prediction, list/get/delete history |
| GET | `/dashboard/summary` | ✓ | Aggregate stats for the Dashboard page |

## Database schema

- **User** — email, password hash/salt, created_at
- **House** — user_id, label, notes, the model's 8 real features
  (med_inc, house_age, ave_rooms, ave_bedrms, population, ave_occup,
  latitude, longitude), timestamps
- **Prediction** — user_id, optional house_id, a snapshot of the features
  actually used (independent of House, so a prediction stays meaningful
  even if the linked property is edited/deleted later), predicted price,
  model used, explanation (base value + contributions), estimated range,
  warnings, created_at
- **ModelEvaluation** — one row per benchmarked model, upserted from
  `compare_models.py`'s output at backend startup

## Local setup

**Train the model / regenerate comparison artifacts** (only needed once,
or after changing `ml/train_model.py` / `ml/compare_models.py`):
```
cd ml
python train_model.py
python compare_models.py
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

Then open `http://localhost:5173` and sign up — there's no seeded account.

### Environment variables

| Variable | Where | Purpose | Default |
|---|---|---|---|
| `DATABASE_URL` | backend | SQLAlchemy connection string | `sqlite:///./house_price.db` |
| `JWT_SECRET_KEY` | backend | Signs session tokens — **set a real secret in any real deployment** | insecure dev fallback |
| `GEMINI_API_KEY` | backend | Enables the "describe your property" NL input | unset (feature disabled) |
| `GEMINI_MODEL` | backend | Which Gemini model to call | `gemini-3.5-flash-lite` |
| `VITE_API_URL` | frontend | Backend base URL | `http://localhost:8000` |

## Testing

```
cd backend
pip install -r requirements-dev.txt
pytest
```

Covers: signup/login (including duplicate email, wrong password, invalid
token), house CRUD and per-user ownership isolation, `/predict` (auth
required, stateless, rejects invalid input), `/predictions` (persists,
links to a house, ownership isolation), the dashboard summary, and the
public `/health` check.

## Deployment

- **Backend** — Azure App Service (Linux, Python 3.12). SQLite lives under
  `/home` (`DATABASE_URL=sqlite:////home/house_price.db`) because the
  app's own code directory is extracted fresh into an ephemeral location
  on every restart — anywhere else would silently lose data. Redeploy
  with a zip built via Python's `zipfile` module (not PowerShell's
  `Compress-Archive`, which writes backslash paths that break on Linux):
  `az webapp deploy -g <rg> -n <app> --src-path backend.zip --type zip`.
- **Frontend** — Vercel. `VITE_API_URL` is set as a Production environment
  variable in the Vercel project (not committed). Redeploy with
  `vercel --prod` from `frontend/`.

## Screenshots

_TODO: add screenshots of the Dashboard, Property Management, Valuation
Flow, and Model Lab pages here._
