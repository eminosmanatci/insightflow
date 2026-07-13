from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.dataset import SalesRecord
from app.schemas.analytics import KPISummary, SalesByRegion

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])

@router.get("/kpis", response_model=KPISummary)
def get_kpis(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Şirketin genel KPI (Temel Performans Göstergesi) özetini getirir."""
    
    # Sadece giriş yapan kullanıcının şirketine ait verileri filtrele
    base_query = db.query(SalesRecord).filter(
        SalesRecord.organization_id == current_user.organization_id
    )
    
    # SQL'deki SUM() ve COUNT() fonksiyonlarını kullanıyoruz
    total_revenue = base_query.with_entities(func.sum(SalesRecord.total_price)).scalar() or 0.0
    total_sales_count = base_query.count()
    
    avg_order = (total_revenue / total_sales_count) if total_sales_count > 0 else 0.0

    return {
        "total_revenue": round(total_revenue, 2),
        "total_sales_count": total_sales_count,
        "average_order_value": round(avg_order, 2)
    }

@router.get("/regions", response_model=list[SalesByRegion])
def get_sales_by_region(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Satışları bölgelere göre gruplayarak getirir (SQL GROUP BY)."""
    
    results = db.query(
        SalesRecord.region,
        func.sum(SalesRecord.total_price).label('total_revenue')
    ).filter(
        SalesRecord.organization_id == current_user.organization_id
    ).group_by(
        SalesRecord.region
    ).all()

    return [{"region": r.region, "total_revenue": round(r.total_revenue, 2)} for r in results]