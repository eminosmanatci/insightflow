from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Veritabanı motorunu oluşturuyoruz
engine = create_engine(settings.DATABASE_URL)

# Her istekte yeni bir veritabanı oturumu açmak için session fabrikası
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tüm modellerimizin miras alacağı temel sınıf
Base = declarative_base()

# FastAPI Dependency Injection için veritabanı oturumu sağlayıcısı
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()