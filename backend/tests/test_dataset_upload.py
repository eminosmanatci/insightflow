import pytest
from io import BytesIO
from unittest.mock import MagicMock

from app.models.dataset import Dataset


VALID_CSV = b"""date,region,category,customer,product,quantity,price,total
2026-07-01,Marmara,Elektronik,Test User,Laptop,1,20000,20000
"""


@pytest.fixture(autouse=True)
def isolated_upload_directory(
    tmp_path,
    monkeypatch,
):
    monkeypatch.setattr(
        "app.api.datasets.settings.UPLOAD_DIR",
        str(tmp_path),
    )

    return tmp_path


def create_admin_headers(client):
    register_response = client.post(
        "/auth/register",
        json={
            "email": "admin@example.com",
            "full_name": "Admin User",
            "password": "strong-password",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        data={
            "username": "admin@example.com",
            "password": "strong-password",
        },
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    organization_response = client.post(
        "/organizations/",
        json={
            "name": "Upload Test Organization",
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )
    assert organization_response.status_code == 201

    return {
        "Authorization": f"Bearer {token}",
    }


def upload_csv(
    client,
    headers,
    contents: bytes,
    filename: str = "sales.csv",
):
    return client.post(
        "/datasets/upload",
        headers=headers,
        files={
            "file": (
                filename,
                BytesIO(contents),
                "text/csv",
            ),
        },
    )


def mock_csv_task(monkeypatch):
    task_mock = MagicMock()

    monkeypatch.setattr(
        "app.api.datasets.process_csv_task",
        task_mock,
    )

    return task_mock


def test_upload_accepts_uppercase_csv_extension(
    client,
    monkeypatch,
):
    headers = create_admin_headers(client)
    task_mock = mock_csv_task(monkeypatch)

    response = upload_csv(
        client,
        headers,
        VALID_CSV,
        filename="SALES.CSV",
    )

    assert response.status_code == 202
    assert response.json()["status"] == "processing"
    assert response.json()["name"] == "SALES.CSV"
    task_mock.delay.assert_called_once()


def test_upload_rejects_empty_file(
    client,
    monkeypatch,
):
    headers = create_admin_headers(client)
    task_mock = mock_csv_task(monkeypatch)

    response = upload_csv(
        client,
        headers,
        b"",
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "CSV dosyası boş olamaz."
    )
    task_mock.delay.assert_not_called()


def test_upload_rejects_file_over_size_limit(
    client,
    monkeypatch,
):
    headers = create_admin_headers(client)
    task_mock = mock_csv_task(monkeypatch)

    monkeypatch.setattr(
        "app.api.datasets.MAX_UPLOAD_SIZE_BYTES",
        10,
    )

    response = upload_csv(
        client,
        headers,
        b"x" * 11,
    )

    assert response.status_code == 413
    task_mock.delay.assert_not_called()


def test_duplicate_upload_returns_conflict(
    client,
    monkeypatch,
):
    headers = create_admin_headers(client)
    task_mock = mock_csv_task(monkeypatch)

    first_response = upload_csv(
        client,
        headers,
        VALID_CSV,
    )
    second_response = upload_csv(
        client,
        headers,
        VALID_CSV,
    )

    assert first_response.status_code == 202
    assert second_response.status_code == 409
    task_mock.delay.assert_called_once()


def test_queue_failure_removes_pending_dataset(
    client,
    db_session,
    monkeypatch,
    isolated_upload_directory,
):
    headers = create_admin_headers(client)
    task_mock = mock_csv_task(monkeypatch)

    task_mock.delay.side_effect = RuntimeError(
        "Redis unavailable"
    )

    response = upload_csv(
        client,
        headers,
        VALID_CSV,
    )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Veri işleme kuyruğuna şu anda "
        "ulaşılamıyor. Lütfen tekrar deneyin."
    )
    assert db_session.query(Dataset).count() == 0
    assert (
        list(isolated_upload_directory.iterdir())
        == []
    )