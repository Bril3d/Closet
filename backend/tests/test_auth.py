"""Tests for authentication endpoints."""


def test_health_check(client):
    """Health endpoint should return ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_user(client):
    """Should register a new user."""
    response = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "password123",
        "username": "newuser"
    })
    assert response.status_code in (200, 201)
    data = response.json()
    assert "id" in data or "email" in data


def test_register_duplicate_email(client):
    """Should reject duplicate email."""
    user_data = {"email": "dup@example.com", "password": "pass123", "username": "dup"}
    client.post("/api/v1/auth/register", json=user_data)
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code in (400, 409, 422)


def test_login_success(client, test_user):
    """Should login with valid credentials."""
    assert test_user["token"] is not None
    assert len(test_user["token"]) > 10


def test_login_wrong_password(client):
    """Should reject wrong password."""
    client.post("/api/v1/auth/register", json={
        "email": "wrong@example.com", "password": "correct", "username": "wronguser"
    })
    response = client.post("/api/v1/auth/login", data={
        "username": "wrong@example.com", "password": "incorrect"
    })
    assert response.status_code in (401, 400)


def test_protected_endpoint_no_token(client):
    """Should reject unauthenticated requests."""
    response = client.get("/api/v1/items/")
    assert response.status_code in (401, 403)
