from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightFlow API"
    
    # .env dosyasından otomatik okunacak zorunlu alanlar
    DATABASE_URL: str
    SECRET_KEY: str
    GROQ_API_KEY: str
    
    # --- YENİ EKLENEN REDIS VE CELERY AYARLARI ---
    # .env'de yoksa bile Docker içindeki redis servisine bağlanması için varsayılan değerler eklendi
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()