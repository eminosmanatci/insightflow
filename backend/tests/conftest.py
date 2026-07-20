import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


# Uygulama modülleri import edilmeden önce test ortamını tanımlıyoruz.
# Bu değişkenler yalnızca pytest process'i içinde geçerlidir.
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-with-sufficient-length"
os.environ["GROQ_API_KEY"] = "gsk-dummy-key"
os.environ["CELERY_BROKER_URL"] = "memory://"
os.environ["CELERY_RESULT_BACKEND"] = "cache+memory://"


from app.core.database import Base, get_db
from app.main import app
from app.models import Dataset, Organization, SalesRecord, User  # noqa: F401


test_engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def isolated_test_database():
    """Her test için boş ve izole bir veritabanı oluşturur."""
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """İzole veritabanını kullanan FastAPI test istemcisi."""
    with TestClient(app) as test_client:
        yield test_client