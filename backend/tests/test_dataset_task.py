import base64

from app.models.dataset import Dataset, SalesRecord
from app.models.organization import Organization
from app.tasks.dataset_tasks import process_csv_task
from conftest import TestingSessionLocal


VALID_CSV = b"""date,region,category,customer,product,quantity,price,total
2026-01-10,Marmara,Elektronik,Ahmet,Laptop,1,20000,20000
2026-01-11,Ege,Giyim,Ayse,Kaban,2,1500,3000
"""


def create_dataset(db_session, file_hash: str):
    organization = Organization(
        name="Task Test Organization",
    )
    db_session.add(organization)
    db_session.flush()

    dataset = Dataset(
        name="sales.csv",
        status="processing",
        organization_id=organization.id,
        file_hash=file_hash,
    )
    db_session.add(dataset)
    db_session.commit()
    db_session.refresh(dataset)

    return organization, dataset


def encode_csv(csv_data: bytes) -> str:
    return base64.b64encode(csv_data).decode("ascii")


def test_process_csv_task_imports_valid_records(
    db_session,
    monkeypatch,
):
    monkeypatch.setattr(
        "app.tasks.dataset_tasks.SessionLocal",
        TestingSessionLocal,
    )

    organization, dataset = create_dataset(
        db_session,
        file_hash="valid-file-hash",
    )

    result = process_csv_task.run(
        dataset.id,
        organization.id,
        encode_csv(VALID_CSV),
    )

    db_session.expire_all()

    updated_dataset = db_session.get(
        Dataset,
        dataset.id,
    )

    records = (
        db_session.query(SalesRecord)
        .filter(
            SalesRecord.dataset_id == dataset.id,
        )
        .all()
    )

    assert result["status"] == "completed"
    assert updated_dataset.status == "completed"
    assert updated_dataset.row_count == 2
    assert updated_dataset.total_rows == 2
    assert updated_dataset.valid_rows == 2
    assert updated_dataset.invalid_rows == 0
    assert updated_dataset.error_message is None
    assert updated_dataset.processed_at is not None

    assert len(records) == 2
    assert records[0].region == "Marmara"
    assert records[0].quantity == 1
    assert records[0].total_price == 20000


def test_process_csv_task_records_validation_failure(
    db_session,
    monkeypatch,
):
    monkeypatch.setattr(
        "app.tasks.dataset_tasks.SessionLocal",
        TestingSessionLocal,
    )

    organization, dataset = create_dataset(
        db_session,
        file_hash="invalid-file-hash",
    )

    invalid_csv = VALID_CSV.replace(
        b"2026-01-10",
        b"32/54/2026",
    )

    result = process_csv_task.run(
        dataset.id,
        organization.id,
        encode_csv(invalid_csv),
    )

    db_session.expire_all()

    updated_dataset = db_session.get(
        Dataset,
        dataset.id,
    )

    record_count = (
        db_session.query(SalesRecord)
        .filter(
            SalesRecord.dataset_id == dataset.id,
        )
        .count()
    )

    assert result["status"] == "failed"
    assert updated_dataset.status == "failed"
    assert updated_dataset.row_count == 0
    assert updated_dataset.total_rows == 2
    assert updated_dataset.valid_rows == 1
    assert updated_dataset.invalid_rows == 1
    assert "tarih" in updated_dataset.error_message.lower()
    assert updated_dataset.processed_at is not None
    assert record_count == 0