from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightFlow"
    DATABASE_URL: str = "postgresql://insight_admin:secret_password123@db:5432/insightflow_prod"
    
    # Groq API Key
    GROQ_API_KEY: str = "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" 

    class Config:
        env_file = ".env"

settings = Settings()