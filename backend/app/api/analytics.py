from datetime import date, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.dataset import SalesRecord
from app.models.user import User
from app.schemas.analytics import (
    CategoryRevenue,
    CustomerRevenue,
    KPISummary,
    MonthlyRevenue,
    ProductPerformance,
    SalesByRegion,
    GrowthComparison,
)
from app.services.analytics import (
    aggregate_period,
    apply_date_filter,
    calculate_growth_rate,
    get_category_metrics,
    get_kpi_metrics,
    get_monthly_metrics,
    get_region_metrics,
    organization_sales_query,
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics & KPIs"],
)


@router.get(
    "/kpis",
    response_model=KPISummary,
)
def get_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
):
    return get_kpi_metrics(
        db=db,
        current_user=current_user,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/regions",
    response_model=list[SalesByRegion],
)
def get_sales_by_region(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
):
    return get_region_metrics(
        db=db,
        current_user=current_user,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/monthly",
    response_model=list[MonthlyRevenue],
)
def get_monthly_revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
):
    return get_monthly_metrics(
        db=db,
        current_user=current_user,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/categories",
    response_model=list[CategoryRevenue],
)
def get_category_revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
):
    return get_category_metrics(
        db=db,
        current_user=current_user,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/products",
    response_model=list[ProductPerformance],
)
def get_product_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 10,
):
    if not 1 <= limit <= 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Limit 1 ile 100 arasında olmalıdır.",
        )

    query = organization_sales_query(
        db,
        current_user,
    )
    query = apply_date_filter(
        query,
        date_from,
        date_to,
    )

    results = (
        query.with_entities(
            SalesRecord.product_name,
            func.sum(
                SalesRecord.total_price
            ).label("total_revenue"),
            func.coalesce(
                func.sum(SalesRecord.quantity),
                0,
            ).label("quantity_sold"),
        )
        .group_by(SalesRecord.product_name)
        .order_by(
            func.sum(
                SalesRecord.total_price
            ).desc(),
            SalesRecord.product_name.asc(),
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "product_name": result.product_name,
            "total_revenue": round(
                float(result.total_revenue),
                2,
            ),
            "quantity_sold": int(
                result.quantity_sold
            ),
        }
        for result in results
    ]


@router.get(
    "/customers",
    response_model=list[CustomerRevenue],
)
def get_customer_revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 10,
):
    if not 1 <= limit <= 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Limit 1 ile 100 arasında olmalıdır.",
        )

    query = organization_sales_query(
        db,
        current_user,
    )
    query = apply_date_filter(
        query,
        date_from,
        date_to,
    )

    results = (
        query.with_entities(
            SalesRecord.customer_name,
            func.sum(
                SalesRecord.total_price
            ).label("total_revenue"),
            func.count(
                SalesRecord.id
            ).label("transaction_count"),
        )
        .group_by(SalesRecord.customer_name)
        .order_by(
            func.sum(
                SalesRecord.total_price
            ).desc(),
            SalesRecord.customer_name.asc(),
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "customer_name": result.customer_name,
            "total_revenue": round(
                float(result.total_revenue),
                2,
            ),
            "transaction_count": int(
                result.transaction_count
            ),
        }
        for result in results
    ]


@router.get(
    "/growth",
    response_model=GrowthComparison,
)
def get_growth_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
):
    if date_from is None or date_to is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Growth analizi için date_from ve "
                "date_to zorunludur."
            ),
        )

    if date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Başlangıç tarihi bitiş tarihinden "
                "sonra olamaz."
            ),
        )

    period_length = (
        date_to - date_from
    ).days + 1

    previous_date_to = (
        date_from - timedelta(days=1)
    )
    previous_date_from = (
        previous_date_to
        - timedelta(days=period_length - 1)
    )

    current_query = organization_sales_query(
        db,
        current_user,
    )
    current_query = apply_date_filter(
        current_query,
        date_from,
        date_to,
    )

    previous_query = organization_sales_query(
        db,
        current_user,
    )
    previous_query = apply_date_filter(
        previous_query,
        previous_date_from,
        previous_date_to,
    )

    (
        current_revenue,
        current_transactions,
    ) = aggregate_period(current_query)

    (
        previous_revenue,
        previous_transactions,
    ) = aggregate_period(previous_query)

    revenue_change = round(
        current_revenue - previous_revenue,
        2,
    )
    transaction_change = (
        current_transactions
        - previous_transactions
    )

    return {
        "current_period": {
            "date_from": date_from,
            "date_to": date_to,
            "total_revenue": current_revenue,
            "transaction_count": current_transactions,
        },
        "previous_period": {
            "date_from": previous_date_from,
            "date_to": previous_date_to,
            "total_revenue": previous_revenue,
            "transaction_count": previous_transactions,
        },
        "revenue_change": revenue_change,
        "revenue_growth_rate": calculate_growth_rate(
            current_revenue,
            previous_revenue,
        ),
        "transaction_change": transaction_change,
        "transaction_growth_rate": (
            calculate_growth_rate(
                float(current_transactions),
                float(previous_transactions),
            )
        ),
    }