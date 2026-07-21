from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.analytics import (
    get_kpis,
    get_sales_by_region,
)
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.ai_service import (
    generate_business_insight,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI Insights"],
)


@router.get("/analyze")
def analyze_business_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
):
    """Filtrelenmiş analytics verilerinden AI özeti üretir."""
    kpi_data = get_kpis(
        db,
        current_user,
        date_from,
        date_to,
    )
    region_data = get_sales_by_region(
        db,
        current_user,
        date_from,
        date_to,
    )

    if not isinstance(kpi_data, dict):
        kpi_data = kpi_data.model_dump()

    region_data_dict = [
        {
            "region": region["region"],
            "total_revenue": region[
                "total_revenue"
            ],
        }
        for region in region_data
    ]

    ai_comment = generate_business_insight(
        kpi_data,
        region_data_dict,
    )

    return {
        "organization": (
            current_user.organization.name
            if current_user.organization
            else "Bireysel Çalışma Alanı"
        ),
        "filters": {
            "date_from": date_from,
            "date_to": date_to,
        },
        "data_snapshot": {
            "kpis": kpi_data,
            "regions": region_data_dict,
        },
        "ai_insight": ai_comment,
    }