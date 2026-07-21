from datetime import date, datetime, time, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import func
from sqlalchemy.orm import Query, Session

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
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics & KPIs"],
)


def apply_date_filter(
    query: Query,
    date_from: date | None,
    date_to: date | None,
) -> Query:
    """Analytics sorgusuna kapsayıcı tarih filtresi uygular."""
    if (
        date_from is not None
        and date_to is not None
        and date_from > date_to
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Başlangıç tarihi bitiş tarihinden "
                "sonra olamaz."
            ),
        )

    if date_from is not None:
        start_datetime = datetime.combine(
            date_from,
            time.min,
        )

        query = query.filter(
            SalesRecord.transaction_date
            >= start_datetime
        )

    if date_to is not None:
        exclusive_end = datetime.combine(
            date_to + timedelta(days=1),
            time.min,
        )

        query = query.filter(
            SalesRecord.transaction_date
            < exclusive_end
        )

    return query


def organization_sales_query(
    db: Session,
    current_user: User,
) -> Query:
    """Kullanıcının organizasyonuna ait satış sorgusu."""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Analytics verilerini görüntülemek "
                "için bir organizasyona bağlı olmalısınız."
            ),
        )

    return db.query(SalesRecord).filter(
        SalesRecord.organization_id
        == current_user.organization_id
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
    query = organization_sales_query(
        db,
        current_user,
    )
    query = apply_date_filter(
        query,
        date_from,
        date_to,
    )

    total_revenue, transaction_count = (
        query.with_entities(
            func.coalesce(
                func.sum(SalesRecord.total_price),
                0.0,
            ),
            func.count(SalesRecord.id),
        )
        .one()
    )

    total_revenue = float(total_revenue)
    transaction_count = int(transaction_count)

    average_transaction_value = (
        total_revenue / transaction_count
        if transaction_count > 0
        else 0.0
    )

    return {
        "total_revenue": round(
            total_revenue,
            2,
        ),
        "transaction_count": transaction_count,
        "average_transaction_value": round(
            average_transaction_value,
            2,
        ),
    }


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
            SalesRecord.region,
            func.sum(
                SalesRecord.total_price
            ).label("total_revenue"),
        )
        .group_by(SalesRecord.region)
        .order_by(
            func.sum(
                SalesRecord.total_price
            ).desc()
        )
        .all()
    )

    return [
        {
            "region": result.region,
            "total_revenue": round(
                float(result.total_revenue),
                2,
            ),
        }
        for result in results
    ]

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
    query = organization_sales_query(
        db,
        current_user,
    )
    query = apply_date_filter(
        query,
        date_from,
        date_to,
    )

    year_expression = func.extract(
        "year",
        SalesRecord.transaction_date,
    )
    month_expression = func.extract(
        "month",
        SalesRecord.transaction_date,
    )

    results = (
        query.with_entities(
            year_expression.label("year"),
            month_expression.label("month_number"),
            func.sum(
                SalesRecord.total_price
            ).label("total_revenue"),
            func.count(
                SalesRecord.id
            ).label("transaction_count"),
        )
        .group_by(
            year_expression,
            month_expression,
        )
        .order_by(
            year_expression,
            month_expression,
        )
        .all()
    )

    return [
        {
            "month": (
                f"{int(result.year):04d}-"
                f"{int(result.month_number):02d}"
            ),
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
    "/categories",
    response_model=list[CategoryRevenue],
)
def get_category_revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date | None = None,
    date_to: date | None = None,
):
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
            SalesRecord.category,
            func.sum(
                SalesRecord.total_price
            ).label("total_revenue"),
            func.count(
                SalesRecord.id
            ).label("transaction_count"),
        )
        .group_by(SalesRecord.category)
        .order_by(
            func.sum(
                SalesRecord.total_price
            ).desc(),
            SalesRecord.category.asc(),
        )
        .all()
    )

    return [
        {
            "category": result.category,
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