from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.dataset import SalesRecord
from app.models.user import User
from app.services.analytics.queries import (
    apply_date_filter,
    organization_sales_query,
)


def get_monthly_metrics(
    db: Session,
    current_user: User,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict[str, str | float | int]]:
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


def get_category_metrics(
    db: Session,
    current_user: User,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict[str, str | float | int]]:
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