import pytest
import uuid

def test_api_is_running(client):
    """Uygulamanın ayakta olduğunu doğrular."""
    response = client.get("/docs")
    assert response.status_code == 200, f"API ayakta değil! Hata kodu: {response.status_code}"

def test_register_user(client):
    """Sisteme yeni bir kullanıcının başarıyla kayıt olabildiğini doğrular."""
    
    # Test verisini dinamikleştiriyoruz (Her testte benzersiz email ile çakışmayı önler)
    unique_email = f"test_{uuid.uuid4().hex[:8]}@insightflow.com"
    
    test_user = {
        "email": unique_email,
        "password": "gucluSifre123",
        "full_name": "Test Uzmanı",
        "role": "analyst"
    }
    
    # API'ye post isteği atıyoruz
    response = client.post("/auth/register", json=test_user)
    
    # Hata durumunda detayları görmek için assertion mesajını genişlettik
    assert response.status_code == 201, f"Kayıt başarısız! Hata kodu: {response.status_code}, Yanıt: {response.text}"
    
    data = response.json()
    assert data["email"] == test_user["email"], "Dönen email eşleşmiyor!"
    assert "id" in data, "Veritabanı kullanıcıya ID atamadı!"
    assert data["role"] == "analyst", "Kullanıcı rolü yanlış kaydedildi!"