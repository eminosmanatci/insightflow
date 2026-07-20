from pydantic import Field
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True,
    )

    PROJECT_NAME: str = "InsightFlow API"

    DATABASE_URL: str
    SECRET_KEY: str = Field(min_length=32)
    GROQ_API_KEY: str

    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"


settings = Settings()