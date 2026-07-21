from io import BytesIO

import pytest
from fastapi import UploadFile

from app.services.file_storage import (
    EmptyUploadError,
    UploadTooLargeError,
    delete_stored_upload,
    finalize_upload,
    store_temporary_upload,
)


@pytest.mark.asyncio
async def test_store_upload_streams_file_to_disk(
    tmp_path,
):
    upload = UploadFile(
        filename="sales.csv",
        file=BytesIO(b"sales-data"),
    )

    stored_upload = await store_temporary_upload(
        upload_file=upload,
        upload_dir=tmp_path,
        max_size_bytes=1024,
    )

    assert stored_upload.temporary_path.exists()
    assert (
        stored_upload.temporary_path.read_bytes()
        == b"sales-data"
    )
    assert stored_upload.size_bytes == 10
    assert len(stored_upload.content_hash) == 32


@pytest.mark.asyncio
async def test_empty_upload_is_removed(
    tmp_path,
):
    upload = UploadFile(
        filename="empty.csv",
        file=BytesIO(b""),
    )

    with pytest.raises(EmptyUploadError):
        await store_temporary_upload(
            upload_file=upload,
            upload_dir=tmp_path,
            max_size_bytes=1024,
        )

    assert list(tmp_path.iterdir()) == []


@pytest.mark.asyncio
async def test_oversized_upload_is_removed(
    tmp_path,
):
    upload = UploadFile(
        filename="large.csv",
        file=BytesIO(b"x" * 11),
    )

    with pytest.raises(UploadTooLargeError):
        await store_temporary_upload(
            upload_file=upload,
            upload_dir=tmp_path,
            max_size_bytes=10,
        )

    assert list(tmp_path.iterdir()) == []


@pytest.mark.asyncio
async def test_finalize_and_delete_upload(
    tmp_path,
):
    upload = UploadFile(
        filename="sales.csv",
        file=BytesIO(b"sales-data"),
    )

    stored_upload = await store_temporary_upload(
        upload_file=upload,
        upload_dir=tmp_path,
        max_size_bytes=1024,
    )

    final_path = finalize_upload(
        temporary_path=(
            stored_upload.temporary_path
        ),
        upload_dir=tmp_path,
        dataset_id=42,
    )

    assert final_path.name == "dataset-42.csv"
    assert final_path.exists()
    assert not stored_upload.temporary_path.exists()

    delete_stored_upload(final_path)

    assert not final_path.exists()