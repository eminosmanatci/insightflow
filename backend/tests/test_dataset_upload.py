import pytest
from io import BytesIO
from unittest.mock import MagicMock

from app.models.dataset import Dataset
from app.models.user import User


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


def create_admin_headers(
    client,
    email: str = "admin@example.com",
    organization_name: str = "Upload Test Organization",
):
    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "full_name": "Admin User",
            "password": "strong-password",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": "strong-password",
        },
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    organization_response = client.post(
        "/organizations/",
        json={
            "name": organization_name,
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


def test_upload_requires_organization(
    client,
    db_session,
    monkeypatch,
):
    email = "without-org@example.com"

    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "full_name": "Without Organization",
            "password": "strong-password",
        },
    )
    assert register_response.status_code == 201

    user = (
        db_session.query(User)
        .filter(User.email == email)
        .one()
    )
    user.role = "admin"
    db_session.commit()

    login_response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": "strong-password",
        },
    )
    assert login_response.status_code == 200

    headers = {
        "Authorization": (
            f"Bearer {login_response.json()['access_token']}"
        ),
    }
    task_mock = mock_csv_task(monkeypatch)

    response = upload_csv(
        client,
        headers,
        VALID_CSV,
    )

    assert response.status_code == 400
    assert "şirket" in response.json()["detail"].lower()
    task_mock.delay.assert_not_called()


@pytest.mark.parametrize(
    "filename",
    [
        "sales.xlsx",
        "sales.txt",
        "sales",
        "../sales.json",
    ],
)
def test_upload_rejects_non_csv_files(
    client,
    monkeypatch,
    filename,
):
    headers = create_admin_headers(client)
    task_mock = mock_csv_task(monkeypatch)

    response = upload_csv(
        client,
        headers,
        VALID_CSV,
        filename=filename,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Sadece CSV formatı desteklenmektedir."
    )
    task_mock.delay.assert_not_called()


def test_finalize_failure_rolls_back_dataset_and_file(
    client,
    db_session,
    monkeypatch,
    isolated_upload_directory,
):
    headers = create_admin_headers(client)
    task_mock = mock_csv_task(monkeypatch)

    finalize_mock = MagicMock(
        side_effect=OSError("Storage unavailable"),
    )
    monkeypatch.setattr(
        "app.api.datasets.finalize_upload",
        finalize_mock,
    )

    response = upload_csv(
        client,
        headers,
        VALID_CSV,
    )

    assert response.status_code == 500
    assert response.json()["detail"] == (
        "Dosya geçici depolama alanına kaydedilemedi."
    )
    assert db_session.query(Dataset).count() == 0
    assert list(isolated_upload_directory.iterdir()) == []
    task_mock.delay.assert_not_called()


def test_dataset_list_and_delete_are_organization_isolated(
    client,
    db_session,
    monkeypatch,
):
    task_mock = mock_csv_task(monkeypatch)

    first_headers = create_admin_headers(
        client,
        email="first-admin@example.com",
        organization_name="First Organization",
    )
    second_headers = create_admin_headers(
        client,
        email="second-admin@example.com",
        organization_name="Second Organization",
    )

    first_upload = upload_csv(
        client,
        first_headers,
        VALID_CSV,
        filename="first-sales.csv",
    )
    assert first_upload.status_code == 202

    second_csv = VALID_CSV.replace(
        b"20000,20000",
        b"25000,25000",
    )
    second_upload = upload_csv(
        client,
        second_headers,
        second_csv,
        filename="second-sales.csv",
    )
    assert second_upload.status_code == 202

    first_dataset_id = first_upload.json()["id"]

    first_list = client.get(
        "/datasets/",
        headers=first_headers,
    )
    second_list = client.get(
        "/datasets/",
        headers=second_headers,
    )

    assert first_list.status_code == 200
    assert second_list.status_code == 200
    assert [
        dataset["name"]
        for dataset in first_list.json()
    ] == ["first-sales.csv"]
    assert [
        dataset["name"]
        for dataset in second_list.json()
    ] == ["second-sales.csv"]

    forbidden_delete = client.delete(
        f"/datasets/{first_dataset_id}",
        headers=second_headers,
    )

    assert forbidden_delete.status_code == 404
    assert db_session.get(
        Dataset,
        first_dataset_id,
    ) is not None

    allowed_delete = client.delete(
        f"/datasets/{first_dataset_id}",
        headers=first_headers,
    )

    assert allowed_delete.status_code == 204
    assert db_session.get(
        Dataset,
        first_dataset_id,
    ) is None
    assert task_mock.delay.call_count == 2