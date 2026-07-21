import hashlib
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


READ_CHUNK_SIZE = 1024 * 1024


class EmptyUploadError(ValueError):
    """Yüklenen dosyanın boş olduğunu belirtir."""


class UploadTooLargeError(ValueError):
    """Yüklenen dosyanın boyut sınırını aştığını belirtir."""


@dataclass(frozen=True)
class StoredUpload:
    temporary_path: Path
    content_hash: str
    size_bytes: int


async def store_temporary_upload(
    upload_file: UploadFile,
    upload_dir: Path,
    max_size_bytes: int,
) -> StoredUpload:
    """Upload'u parça parça geçici storage'a kaydeder."""
    upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_path = (
        upload_dir / f"{uuid4().hex}.upload"
    )

    content_hash = hashlib.md5(
        usedforsecurity=False,
    )
    size_bytes = 0

    try:
        with temporary_path.open("xb") as output_file:
            while True:
                chunk = await upload_file.read(
                    READ_CHUNK_SIZE
                )

                if not chunk:
                    break

                size_bytes += len(chunk)

                if size_bytes > max_size_bytes:
                    raise UploadTooLargeError

                content_hash.update(chunk)
                output_file.write(chunk)

        if size_bytes == 0:
            raise EmptyUploadError

        return StoredUpload(
            temporary_path=temporary_path,
            content_hash=content_hash.hexdigest(),
            size_bytes=size_bytes,
        )

    except Exception:
        temporary_path.unlink(
            missing_ok=True,
        )
        raise


def finalize_upload(
    temporary_path: Path,
    upload_dir: Path,
    dataset_id: int,
) -> Path:
    """Geçici dosyayı dataset kimliğiyle kalıcı geçici yola taşır."""
    destination = (
        upload_dir / f"dataset-{dataset_id}.csv"
    )

    temporary_path.replace(destination)

    return destination


def delete_stored_upload(
    file_path: Path | str,
) -> None:
    """Storage dosyasını varsa güvenle siler."""
    Path(file_path).unlink(
        missing_ok=True,
    )