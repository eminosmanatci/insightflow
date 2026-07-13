from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, organizations  # organizations import edildi

app = FastAPI(
    title="InsightFlow Enterprise Analytics Platform",
    description="Modern işletmeler için veri toplama ve AI destekli içgörü platformu.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router kayıtları
app.include_router(auth.router)
app.include_router(organizations.router)  # Yeni eklendi

@app.get("/")
def read_root():
    return {"status": "online", "project": "InsightFlow API"}