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
