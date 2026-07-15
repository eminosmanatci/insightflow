from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User

# Önceki yazdığımız fonksiyonları veri çekmek için kullanıyoruz
from app.api.analytics import get_kpis, get_sales_by_region
from app.services.ai_service import generate_business_insight

router = APIRouter(prefix="/ai", tags=["AI Insights"])

@router.get("/analyze")
def analyze_business_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Şirket verilerini toplar ve AI analizinden geçirerek rapor sunar."""
    
    # 1. Veritabanındaki SQL analitiklerini çalıştır
    kpi_data = get_kpis(db, current_user)
    region_data = get_sales_by_region(db, current_user)

    # 2. Verileri LLM motoruna gönder ve yorumlat
    # Model objelerini (Pydantic/SQLAlchemy) dictionary'e çeviriyoruz
    region_data_dict = [{"region": r["region"], "total_revenue": r["total_revenue"]} for r in region_data]
    
    if type(kpi_data) is not dict: # Pydantic modeliyse dict'e çevir
        kpi_data = kpi_data.model_dump()

    ai_comment = generate_business_insight(kpi_data, region_data_dict)

    # 3. Sonucu Dashboard'un anlayacağı formatta dön
    return {
        "organization": current_user.organization.name if current_user.organization else "Bireysel Çalışma Alanı",
        "data_snapshot": {
            "kpis": kpi_data,
            "regions": region_data_dict
        },
        "ai_insight": ai_comment
    }