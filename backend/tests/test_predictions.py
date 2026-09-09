from conftest import VALID_FEATURES


def test_predict_allows_anonymous_guests(client):
    """/predict is intentionally guest-accessible (see main.py's docstring)
    so a visitor can try a real prediction before creating an account."""
    res = client.post("/predict", json=VALID_FEATURES)
    assert res.status_code == 200
    assert "predicted_price_usd" in res.json()


def test_predict_does_not_persist(client, auth_headers):
    """POST /predict is a stateless preview -- it must never appear in history."""
    headers = auth_headers()
    res = client.post("/predict", json=VALID_FEATURES, headers=headers)
    assert res.status_code == 200
    assert "predicted_price_usd" in res.json()

    res = client.get("/predictions", headers=headers)
    assert res.json()["count"] == 0


def test_predict_rejects_invalid_input(client, auth_headers):
    headers = auth_headers()
    bad = {**VALID_FEATURES}
    del bad["MedInc"]
    res = client.post("/predict", json=bad, headers=headers)
    assert res.status_code == 422


def test_create_prediction_from_features_persists_it(client, auth_headers):
    headers = auth_headers()
    res = client.post("/predictions", json={"features": VALID_FEATURES}, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["predicted_price_usd"] > 0
    assert body["house_id"] is None

    res = client.get("/predictions", headers=headers)
    assert res.json()["count"] == 1


def test_create_prediction_from_house_uses_its_features(client, auth_headers):
    headers = auth_headers()
    house_payload = {
        "label": "My House",
        "med_inc": VALID_FEATURES["MedInc"],
        "house_age": VALID_FEATURES["HouseAge"],
        "ave_rooms": VALID_FEATURES["AveRooms"],
        "ave_bedrms": VALID_FEATURES["AveBedrms"],
        "population": VALID_FEATURES["Population"],
        "ave_occup": VALID_FEATURES["AveOccup"],
        "latitude": VALID_FEATURES["Latitude"],
        "longitude": VALID_FEATURES["Longitude"],
    }
    house = client.post("/houses", json=house_payload, headers=headers).json()

    res = client.post("/predictions", json={"house_id": house["id"]}, headers=headers)
    assert res.status_code == 200
    assert res.json()["house_id"] == house["id"]
    assert res.json()["features"]["MedInc"] == VALID_FEATURES["MedInc"]


def test_create_prediction_requires_house_id_or_features(client, auth_headers):
    headers = auth_headers()
    res = client.post("/predictions", json={}, headers=headers)
    assert res.status_code == 422


def test_create_prediction_rejects_unknown_house(client, auth_headers):
    headers = auth_headers()
    res = client.post("/predictions", json={"house_id": 999}, headers=headers)
    assert res.status_code == 404


def test_delete_prediction(client, auth_headers):
    headers = auth_headers()
    prediction = client.post("/predictions", json={"features": VALID_FEATURES}, headers=headers).json()

    res = client.delete(f"/predictions/{prediction['id']}", headers=headers)
    assert res.status_code == 204

    res = client.get(f"/predictions/{prediction['id']}", headers=headers)
    assert res.status_code == 404


def test_users_cannot_see_each_others_predictions(client, auth_headers):
    headers_a = auth_headers("a@test.com")
    headers_b = auth_headers("b@test.com")

    client.post("/predictions", json={"features": VALID_FEATURES}, headers=headers_a)

    res = client.get("/predictions", headers=headers_b)
    assert res.json()["count"] == 0


def test_dashboard_summary_reflects_predictions(client, auth_headers):
    headers = auth_headers()
    client.post("/predictions", json={"features": VALID_FEATURES}, headers=headers)

    res = client.get("/dashboard/summary", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total_predictions"] == 1
    assert body["total_properties"] == 0
    assert body["model_r2"] is not None
