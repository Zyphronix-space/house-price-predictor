from conftest import VALID_FEATURES


def _house_payload(label="Test House"):
    return {
        "label": label,
        "med_inc": VALID_FEATURES["MedInc"],
        "house_age": VALID_FEATURES["HouseAge"],
        "ave_rooms": VALID_FEATURES["AveRooms"],
        "ave_bedrms": VALID_FEATURES["AveBedrms"],
        "population": VALID_FEATURES["Population"],
        "ave_occup": VALID_FEATURES["AveOccup"],
        "latitude": VALID_FEATURES["Latitude"],
        "longitude": VALID_FEATURES["Longitude"],
    }


def test_houses_require_auth(client):
    res = client.get("/houses")
    assert res.status_code == 401


def test_create_and_list_house(client, auth_headers):
    headers = auth_headers()
    res = client.post("/houses", json=_house_payload(), headers=headers)
    assert res.status_code == 200
    house = res.json()
    assert house["label"] == "Test House"

    res = client.get("/houses", headers=headers)
    assert res.status_code == 200
    assert res.json()["count"] == 1


def test_update_house(client, auth_headers):
    headers = auth_headers()
    house = client.post("/houses", json=_house_payload(), headers=headers).json()

    res = client.patch(f"/houses/{house['id']}", json={"label": "Renamed"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["label"] == "Renamed"
    # Untouched fields survive a partial update.
    assert res.json()["med_inc"] == VALID_FEATURES["MedInc"]


def test_delete_house(client, auth_headers):
    headers = auth_headers()
    house = client.post("/houses", json=_house_payload(), headers=headers).json()

    res = client.delete(f"/houses/{house['id']}", headers=headers)
    assert res.status_code == 204

    res = client.get(f"/houses/{house['id']}", headers=headers)
    assert res.status_code == 404


def test_house_search(client, auth_headers):
    headers = auth_headers()
    client.post("/houses", json=_house_payload("Downtown Condo"), headers=headers)
    client.post("/houses", json=_house_payload("Suburban House"), headers=headers)

    res = client.get("/houses", params={"q": "condo"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["count"] == 1
    assert res.json()["houses"][0]["label"] == "Downtown Condo"


def test_users_cannot_see_each_others_houses(client, auth_headers):
    headers_a = auth_headers("a@test.com")
    headers_b = auth_headers("b@test.com")

    house = client.post("/houses", json=_house_payload(), headers=headers_a).json()

    # B's list is empty.
    res = client.get("/houses", headers=headers_b)
    assert res.json()["count"] == 0

    # B can't fetch, update, or delete A's house by id.
    assert client.get(f"/houses/{house['id']}", headers=headers_b).status_code == 404
    assert client.patch(f"/houses/{house['id']}", json={"label": "Hijacked"}, headers=headers_b).status_code == 404
    assert client.delete(f"/houses/{house['id']}", headers=headers_b).status_code == 404

    # A's house is untouched.
    res = client.get(f"/houses/{house['id']}", headers=headers_a)
    assert res.json()["label"] == "Test House"
