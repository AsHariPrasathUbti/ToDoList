def test_admin_create_user_success(client, admin_auth):
    response = client.post(
        "/api/users/",
        json={
            "username": "janedoe",
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "securepassword123",
            "role": "User"
        },
        headers=admin_auth["headers"],
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "janedoe"
    assert data["email"] == "jane@example.com"
    assert data["role"] == "User"
    assert "hashed_password" not in data

def test_admin_create_user_duplicate_username(client, admin_auth):
    payload = {
        "username": "janedup",
        "name": "Jane",
        "email": "jane.dup@example.com",
        "password": "password123",
        "role": "User"
    }
    res1 = client.post("/api/users/", json=payload, headers=admin_auth["headers"])
    assert res1.status_code == 201

    res2 = client.post("/api/users/", json=payload, headers=admin_auth["headers"])
    assert res2.status_code == 409

def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "Admin@12345"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"

def test_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]

def test_login_nonexistent_user(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "nobody", "password": "anypassword"},
    )
    assert response.status_code == 401

def test_get_current_user_profile(client, user_auth):
    response = client.get("/api/auth/me", headers=user_auth["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "hari"
    assert data["role"] == "User"

def test_protected_endpoint_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_protected_endpoint_with_invalid_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer fake.invalid.token"})
    assert response.status_code == 401
