def test_signup_creates_account_and_returns_token(client):
    res = client.post("/auth/signup", json={"email": "new@test.com", "password": "password123"})
    assert res.status_code == 200
    body = res.json()
    assert body["user"]["email"] == "new@test.com"
    assert body["access_token"]


def test_signup_rejects_short_password(client):
    res = client.post("/auth/signup", json={"email": "short@test.com", "password": "abc"})
    assert res.status_code == 422


def test_signup_rejects_duplicate_email(client):
    client.post("/auth/signup", json={"email": "dup@test.com", "password": "password123"})
    res = client.post("/auth/signup", json={"email": "dup@test.com", "password": "password123"})
    assert res.status_code == 400


def test_login_succeeds_with_correct_password(client):
    client.post("/auth/signup", json={"email": "login@test.com", "password": "password123"})
    res = client.post("/auth/login", json={"email": "login@test.com", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_login_fails_with_wrong_password(client):
    client.post("/auth/signup", json={"email": "login2@test.com", "password": "password123"})
    res = client.post("/auth/login", json={"email": "login2@test.com", "password": "wrong-password"})
    assert res.status_code == 401


def test_login_fails_for_unknown_email(client):
    res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "password123"})
    assert res.status_code == 401


def test_me_requires_auth(client):
    res = client.get("/auth/me")
    assert res.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    headers = auth_headers("me@test.com")
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "me@test.com"


def test_invalid_token_is_rejected(client):
    res = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401


def test_signup_accepts_optional_display_name(client):
    res = client.post(
        "/auth/signup",
        json={"email": "named@test.com", "password": "password123", "display_name": "Stephan"},
    )
    assert res.status_code == 200
    assert res.json()["user"]["display_name"] == "Stephan"


def test_update_profile_sets_display_name(client, auth_headers):
    headers = auth_headers("profile@test.com")
    res = client.patch("/auth/me", json={"display_name": "New Name"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["display_name"] == "New Name"


def test_change_password_requires_correct_current_password(client, auth_headers):
    headers = auth_headers("pw@test.com", "password123")
    res = client.post(
        "/auth/change-password",
        json={"current_password": "wrong", "new_password": "newpassword123"},
        headers=headers,
    )
    assert res.status_code == 401


def test_change_password_succeeds_and_new_password_works(client, auth_headers):
    headers = auth_headers("pw2@test.com", "password123")
    res = client.post(
        "/auth/change-password",
        json={"current_password": "password123", "new_password": "newpassword123"},
        headers=headers,
    )
    assert res.status_code == 204

    res = client.post("/auth/login", json={"email": "pw2@test.com", "password": "newpassword123"})
    assert res.status_code == 200


def test_forgot_password_unknown_email_does_not_leak_existence(client):
    res = client.post("/auth/forgot-password", json={"email": "nobody@test.com"})
    assert res.status_code == 200
    body = res.json()
    assert body["reset_token"] is None


def test_forgot_password_known_email_returns_demo_token(client):
    client.post("/auth/signup", json={"email": "forgot@test.com", "password": "password123"})
    res = client.post("/auth/forgot-password", json={"email": "forgot@test.com"})
    assert res.status_code == 200
    body = res.json()
    assert body["demo_mode"] is True
    assert body["reset_token"]


def test_reset_password_with_valid_token_changes_password(client):
    client.post("/auth/signup", json={"email": "reset@test.com", "password": "password123"})
    token = client.post("/auth/forgot-password", json={"email": "reset@test.com"}).json()["reset_token"]

    res = client.post("/auth/reset-password", json={"token": token, "new_password": "brandnewpass123"})
    assert res.status_code == 204

    res = client.post("/auth/login", json={"email": "reset@test.com", "password": "brandnewpass123"})
    assert res.status_code == 200


def test_reset_password_token_is_single_use(client):
    client.post("/auth/signup", json={"email": "reuse@test.com", "password": "password123"})
    token = client.post("/auth/forgot-password", json={"email": "reuse@test.com"}).json()["reset_token"]

    client.post("/auth/reset-password", json={"token": token, "new_password": "brandnewpass123"})
    res = client.post("/auth/reset-password", json={"token": token, "new_password": "anotherpass123"})
    assert res.status_code == 400


def test_reset_password_rejects_invalid_token(client):
    res = client.post("/auth/reset-password", json={"token": "not-a-real-token", "new_password": "brandnewpass123"})
    assert res.status_code == 400


def test_delete_account_removes_user_and_data(client, auth_headers):
    headers = auth_headers("delete@test.com")
    client.post("/houses", json={"label": "Test", **VALID_FEATURES_HOUSE}, headers=headers)

    res = client.delete("/auth/me", headers=headers)
    assert res.status_code == 204

    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 401

    res = client.post("/auth/login", json={"email": "delete@test.com", "password": "password123"})
    assert res.status_code == 401


VALID_FEATURES_HOUSE = {
    "med_inc": 8.3,
    "house_age": 20,
    "ave_rooms": 6.5,
    "ave_bedrms": 1.1,
    "population": 800,
    "ave_occup": 3.0,
    "latitude": 34.2,
    "longitude": -118.3,
}
