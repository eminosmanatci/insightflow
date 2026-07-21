import logging
from datetime import datetime, timezone
from pathlib import Path

from celery import shared_task

from app.core.database import SessionLocal
from app.models.dataset import Dataset, SalesRecord
from app.pipeline.validation import (
    CSVValidationError,
    validate_sales_csv,
)
from app.services.file_storage import (
    delete_stored_upload,
)


logger = logging.getLogger(__name__)


def mark_dataset_failed(
    db,
    dataset_id: int,
    organization_id: int,
    error_message: str,
    total_rows: int = 0,
    invalid_rows: int = 0,
) -> None:
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.organization_id == organization_id,
        )
        .first()
    )

    if dataset is None:
        return

    dataset.status = "failed"
    dataset.row_count = 0
    dataset.total_rows = total_rows
    dataset.valid_rows = max(
        total_rows - invalid_rows,
        0,
    )
    dataset.invalid_rows = invalid_rows
    dataset.error_message = error_message
    dataset.processed_at = datetime.now(timezone.utc)

    db.commit()


@shared_task(
    name="app.tasks.dataset_tasks.process_csv_task",
)
def process_csv_task(
    dataset_id: int,
    organization_id: int,
    file_path: str,
):
    """Storage'daki CSV'yi doğrular ve satış kayıtlarını oluşturur."""
    db = SessionLocal()

    try:
        dataset = (
            db.query(Dataset)
            .filter(
                Dataset.id == dataset_id,
                Dataset.organization_id == organization_id,
            )
            .first()
        )

        if dataset is None:
            return {
                "status": "ignored",
                "reason": "dataset_not_found",
            }

        file_contents = Path(file_path).read_bytes()
        dataframe = validate_sales_csv(file_contents)

        records = [
            SalesRecord(
                dataset_id=dataset.id,
                organization_id=organization_id,
                transaction_date=row.date.to_pydatetime(),
                region=row.region,
                category=row.category,
                customer_name=row.customer,
                product_name=row.product,
                quantity=int(row.quantity),
                unit_price=float(row.price),
                total_price=float(row.total),
            )
            for row in dataframe.itertuples(index=False)
        ]

        db.bulk_save_objects(records)

        row_count = len(records)

        dataset.status = "completed"
        dataset.row_count = row_count
        dataset.total_rows = row_count
        dataset.valid_rows = row_count
        dataset.invalid_rows = 0
        dataset.error_message = None
        dataset.processed_at = datetime.now(timezone.utc)

        db.commit()

        return {
            "status": "completed",
            "dataset_id": dataset.id,
            "row_count": row_count,
        }

    except CSVValidationError as exc:
        db.rollback()

        mark_dataset_failed(
            db=db,
            dataset_id=dataset_id,
            organization_id=organization_id,
            error_message=str(exc),
            total_rows=exc.total_rows,
            invalid_rows=exc.invalid_rows,
        )

        return {
            "status": "failed",
            "dataset_id": dataset_id,
            "errors": exc.errors,
        }

    except Exception:
        db.rollback()

        logger.exception(
            "Dataset processing failed",
            extra={
                "dataset_id": dataset_id,
                "organization_id": organization_id,
            },
        )

        mark_dataset_failed(
            db=db,
            dataset_id=dataset_id,
            organization_id=organization_id,
            error_message=(
                "Veri seti işlenirken beklenmeyen "
                "bir hata oluştu."
            ),
        )

        return {
            "status": "failed",
            "dataset_id": dataset_id,
            "errors": [
                "Beklenmeyen veri işleme hatası."
            ],
        }

    finally:
        db.close()
        delete_stored_upload(file_path)