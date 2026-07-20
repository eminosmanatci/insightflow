from fastapi.testclient import TestClient
from app.main import app

# Test ortamı için FastAPI'nin sanal istemcisini oluşturuyoruz
client = TestClient(app)

def test_read_root():
    """Uygulamanın ana endpoint'inin (Health Check) çalışıp çalışmadığını test eder."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "project": "InsightFlow API"}

def test_get_datasets_unauthorized():
    """Giriş yapmamış (token'ı olmayan) birinin veri setlerini görmesinin yasak olduğunu test eder."""
    response = client.get("/datasets/")
    # 401 Unauthorized dönmesi beklenir
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}

def test_login_wrong_credentials():
    """Yanlış şifre ile giriş yapıldığında sistemin hata dönmesini test eder."""
    response = client.post(
        "/auth/login",
        data={"username": "fakeuser@test.com", "password": "wrongpassword"} # FastAPI OAuth2 form data kullanır
    )
    assert response.status_code == 401