from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dataset import SalesRecord
from app.models.user import User
from app.services.analytics.queries import (
    apply_date_filter,
    organization_sales_query,
)


def get_kpi_metrics(
    db: Session,
    current_user: User,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, float | int]:
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


def get_region_metrics(
    db: Session,
    current_user: User,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict[str, str | float]]:
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