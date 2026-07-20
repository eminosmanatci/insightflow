from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Backend API process'inde Celery uygulamasını yapılandırır.
from app.core.celery_app import celery_app  # noqa: F401

from app.api import (
    analytics,
    auth,
    datasets,
    insights,
    organizations,
)


app = FastAPI(
    title="InsightFlow Enterprise Analytics Platform",
    description=(
        "Modern işletmeler için veri toplama ve "
        "AI destekli içgörü platformu."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(datasets.router)
app.include_router(analytics.router)
app.include_router(insights.router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": "InsightFlow API",
    }