from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dataset import SalesRecord
from app.models.user import User
from app.services.analytics.queries import (
    apply_date_filter,
    organization_sales_query,
)


def get_product_metrics(
    db: Session,
    current_user: User,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 10,
) -> list[dict]:
    """Gelire göre en yüksek performanslı ürünleri döndürür."""
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
                SalesRecord.total_price,
            ).label("total_revenue"),
            func.coalesce(
                func.sum(SalesRecord.quantity),
                0,
            ).label("quantity_sold"),
        )
        .group_by(SalesRecord.product_name)
        .order_by(
            func.sum(
                SalesRecord.total_price,
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
                result.quantity_sold,
            ),
        }
        for result in results
    ]


def get_customer_metrics(
    db: Session,
    current_user: User,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 10,
) -> list[dict]:
    """Gelire göre en değerli müşterileri döndürür."""
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
                SalesRecord.total_price,
            ).label("total_revenue"),
            func.count(
                SalesRecord.id,
            ).label("transaction_count"),
        )
        .group_by(SalesRecord.customer_name)
        .order_by(
            func.sum(
                SalesRecord.total_price,
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
                result.transaction_count,
            ),
        }
        for result in results
    ]