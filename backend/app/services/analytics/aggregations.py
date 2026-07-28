from sqlalchemy import func
from sqlalchemy.orm import Query

from app.models.dataset import SalesRecord


def calculate_growth_rate(
    current_value: float,
    previous_value: float,
) -> float | None:
    """Önceki değer sıfırsa tanımsız, değilse yüzde değişim."""
    if previous_value == 0:
        return None

    return round(
        (
            (current_value - previous_value)
            / previous_value
        )
        * 100,
        2,
    )


def aggregate_period(
    query: Query,
) -> tuple[float, int]:
    """Filtrelenmiş satış sorgusunun temel metriklerini hesaplar."""
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

    return (
        round(float(total_revenue), 2),
        int(transaction_count),
    )