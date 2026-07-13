from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth  # Yeni eklenen import

app = FastAPI(
    title="InsightFlow Enterprise Analytics Platform",
    description="Modern işletmeler için veri toplama ve AI destekli içgörü platformu.",
    version="1.0.0"
)

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router'larını sisteme dahil etme (YENİ EKLENEN KISIM)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": "InsightFlow API",
        "version": "1.0.0 Blueprint"
    }