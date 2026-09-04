import os
import sys
from pathlib import Path

# Isolated test database -- set before importing main/database so the
# engine is created against this file, never the real house_price.db.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_house_price.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient

import database
import db_models
import main


@pytest.fixture(autouse=True)
def _fresh_db():
    """Every test starts with empty tables -- full isolation, no ordering
    dependence between tests."""
    db_models.Base.metadata.drop_all(bind=database.engine)
    db_models.Base.metadata.create_all(bind=database.engine)
    yield


@pytest.fixture()
def client():
    with TestClient(main.app) as c:
        yield c


@pytest.fixture()
def auth_headers(client):
    def _make(email="user@test.com", password="password123"):
        res = client.post("/auth/signup", json={"email": email, "password": password})
        assert res.status_code == 200, res.text
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    return _make


@pytest.fixture(scope="session", autouse=True)
def _cleanup_db_file():
    yield
    database.engine.dispose()
    db_path = Path(__file__).resolve().parent.parent / "test_house_price.db"
    if db_path.exists():
        db_path.unlink()


VALID_FEATURES = {
    "MedInc": 8.3,
    "HouseAge": 20,
    "AveRooms": 6.5,
    "AveBedrms": 1.1,
    "Population": 800,
    "AveOccup": 3.0,
    "Latitude": 34.2,
    "Longitude": -118.3,
}
