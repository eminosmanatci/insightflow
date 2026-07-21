import base64
import hashlib
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
from app.core.database import get_db
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset import DatasetResponse
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

    # Limitten yalnızca bir bayt fazla okuyarak büyük
    # dosyanın tamamını belleğe almaktan kaçınırız.
    contents = await file.read(
        MAX_UPLOAD_SIZE_BYTES + 1
    )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV dosyası boş olamaz.",
        )

    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="CSV dosyası en fazla 10 MB olabilir.",
        )

    # Buradaki hash güvenlik için değil, içerik
    # tekrarını tespit etmek için kullanılır.
    file_hash = hashlib.md5(
        contents,
        usedforsecurity=False,
    ).hexdigest()

    existing_dataset = (
        db.query(Dataset)
        .filter(
            Dataset.organization_id
            == current_user.organization_id,
            Dataset.file_hash == file_hash,
        )
        .first()
    )

    if existing_dataset:
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
        file_hash=file_hash,
    )

    db.add(new_dataset)

    try:
        db.commit()
        db.refresh(new_dataset)
    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Bu veri seti başka bir istek "
                "tarafından zaten yüklendi."
            ),
        ) from exc

    encoded_contents = base64.b64encode(
        contents
    ).decode("ascii")

    try:
        process_csv_task.delay(
            new_dataset.id,
            current_user.organization_id,
            encoded_contents,
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

        # Kuyruğa hiç gönderilemeyen kayıt tekrar
        # yüklemeyi engellememelidir.
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