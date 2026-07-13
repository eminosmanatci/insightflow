from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightFlow"
    # Docker-compose dosyamızdaki ayarlara göre yazılmış URL
    DATABASE_URL: str = "postgresql://insight_admin:secret_password123@db:5432/insightflow_prod"

    class Config:
        env_file = ".env"

settings = Settings()