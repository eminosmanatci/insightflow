def test_read_root(client):
    """Health endpoint çalışmalı."""
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "online",
        "project": "InsightFlow API",
    }


def test_get_datasets_unauthorized(client):
    """Token olmadan dataset listesine erişilememeli."""
    response = client.get("/datasets/")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Not authenticated",
    }


def test_login_wrong_credentials(client):
    """Olmayan kullanıcıyla giriş başarısız olmalı."""
    response = client.post(
        "/auth/login",
        data={
            "username": "fakeuser@test.com",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401


def test_register_uses_isolated_database(client):
    """Register endpoint izole test veritabanına yazabilmeli."""
    response = client.post(
        "/auth/register",
        json={
            "email": "isolated@example.com",
            "full_name": "Isolated User",
            "password": "strong-password",
        },
    )

    assert response.status_code == 201

    response_data = response.json()

    assert response_data["email"] == "isolated@example.com"
    assert response_data["role"] == "viewer"
    assert response_data["is_active"] is True