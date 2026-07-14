from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Veritabanı ve modelleri import ediyoruz
from app.core.database import engine, Base
from app.models.user import User
from app.models.dataset import Dataset
# Eğer başka modelleriniz varsa (Organization, SalesRecord vb.) buraya eklemeyi unutmayın
# from app.models.organization import Organization 

# Router importları
from app.api import auth, organizations, datasets, analytics, insights

# Uygulama ayağa kalkarken veritabanında eksik tablo varsa otomatik oluşturur
Base.metadata.create_all(bind=engine)

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
app.include_router(organizations.router)  
app.include_router(datasets.router)
app.include_router(analytics.router)
app.include_router(insights.router)

@app.get("/")
def read_root():
    return {"status": "online", "project": "InsightFlow API"}