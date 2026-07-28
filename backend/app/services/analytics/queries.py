from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Query, Session

from app.models.dataset import SalesRecord
from app.models.user import User


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