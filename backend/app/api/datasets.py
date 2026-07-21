import logging
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import RoleChecker, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset import DatasetResponse
from app.services.file_storage import (
    EmptyUploadError,
    UploadTooLargeError,
    delete_stored_upload,
    finalize_upload,
    store_temporary_upload,
)
from app.tasks.dataset_tasks import process_csv_task


logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

router = APIRouter(
    prefix="/datasets",
    tags=["Data Pipeline"],
)

allow_upload = RoleChecker(["admin", "analyst"])


@router.get(
    "/",
    response_model=list[DatasetResponse],
)
def get_my_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Dataset)
        .filter(
            Dataset.organization_id
            == current_user.organization_id
        )
        .order_by(Dataset.created_at.desc())
        .all()
    )


@router.post(
    "/upload",
    response_model=DatasetResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_upload),
):
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Veri yüklemek için önce bir şirket "
                "oluşturmalısınız."
            ),
        )

    safe_filename = Path(
        file.filename or ""
    ).name

    if (
        not safe_filename
        or Path(safe_filename).suffix.lower() != ".csv"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece CSV formatı desteklenmektedir.",
        )

    upload_dir = Path(settings.UPLOAD_DIR)

    try:
        stored_upload = await store_temporary_upload(
            upload_file=file,
            upload_dir=upload_dir,
            max_size_bytes=MAX_UPLOAD_SIZE_BYTES,
        )
    except EmptyUploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV dosyası boş olamaz.",
        ) from exc
    except UploadTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="CSV dosyası en fazla 10 MB olabilir.",
        ) from exc

    existing_dataset = (
        db.query(Dataset)
        .filter(
            Dataset.organization_id
            == current_user.organization_id,
            Dataset.file_hash
            == stored_upload.content_hash,
        )
        .first()
    )

    if existing_dataset:
        delete_stored_upload(
            stored_upload.temporary_path
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Bu veri seti daha önce yüklendi. "
                "Lütfen farklı veriler içeren bir "
                "dosya seçin."
            ),
        )

    new_dataset = Dataset(
        name=safe_filename,
        status="processing",
        organization_id=current_user.organization_id,
        file_hash=stored_upload.content_hash,
    )

    db.add(new_dataset)

    try:
        db.commit()
        db.refresh(new_dataset)
    except IntegrityError as exc:
        db.rollback()
        delete_stored_upload(
            stored_upload.temporary_path
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Bu veri seti başka bir istek "
                "tarafından zaten yüklendi."
            ),
        ) from exc

    try:
        final_path = finalize_upload(
            temporary_path=(
                stored_upload.temporary_path
            ),
            upload_dir=upload_dir,
            dataset_id=new_dataset.id,
        )
    except Exception as exc:
        logger.exception(
            "Dataset file could not be finalized",
            extra={
                "dataset_id": new_dataset.id,
            },
        )

        delete_stored_upload(
            stored_upload.temporary_path
        )
        db.delete(new_dataset)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Dosya geçici depolama alanına "
                "kaydedilemedi."
            ),
        ) from exc

    try:
        process_csv_task.delay(
            new_dataset.id,
            current_user.organization_id,
            str(final_path),
        )
    except Exception as exc:
        logger.exception(
            "Dataset could not be queued",
            extra={
                "dataset_id": new_dataset.id,
                "organization_id":
                    current_user.organization_id,
            },
        )

        delete_stored_upload(final_path)
        db.delete(new_dataset)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Veri işleme kuyruğuna şu anda "
                "ulaşılamıyor. Lütfen tekrar deneyin."
            ),
        ) from exc

    return new_dataset


@router.delete(
    "/{dataset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_upload),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id,
            Dataset.organization_id
            == current_user.organization_id,
        )
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Veri seti bulunamadı veya "
                "yetkiniz yok."
            ),
        )

    db.delete(dataset)
    db.commit()

    return None