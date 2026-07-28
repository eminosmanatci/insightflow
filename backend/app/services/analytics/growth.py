from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.user import User
from app.services.analytics.aggregations import (
    aggregate_period,
    calculate_growth_rate,
)
from app.services.analytics.queries import (
    apply_date_filter,
    organization_sales_query,
)


def get_growth_metrics(
    db: Session,
    current_user: User,
    date_from: date,
    date_to: date,
) -> dict:
    """Seçilen dönemi eşit uzunluktaki önceki dönemle karşılaştırır."""
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
        "transaction_growth_rate": calculate_growth_rate(
            float(current_transactions),
            float(previous_transactions),
        ),
    }