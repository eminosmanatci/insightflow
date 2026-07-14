import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker  # RoleChecker'ı import ediyoruz
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetResponse

# Celery Task'ımızı import ediyoruz
from app.tasks.dataset_tasks import process_csv_task

router = APIRouter(prefix="/datasets", tags=["Data Pipeline"])

# İzin verilen rolleri tanımlıyoruz
allow_upload = RoleChecker(["admin", "analyst"])

@router.get("/", response_model=list[DatasetResponse])
def get_my_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    datasets = db.query(Dataset).filter(Dataset.organization_id == current_user.organization_id).all()
    return datasets

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # Artık kullanıcı bu endpoint'e girmeden önce rol kontrolünden geçecek
    current_user: User = Depends(allow_upload)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="Veri yüklemek için önce bir şirket oluşturmalısınız.")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Sadece CSV formatı desteklenmektedir.")

    # 1. Veritabanında dosyayı "processing" durumuyla aç
    new_dataset = Dataset(
        name=file.filename,
        status="processing",
        organization_id=current_user.organization_id
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    # 2. Dosya içeriğini oku
    contents = await file.read()
    
    # 3. İçeriği JSON üzerinden güvenle gönderebilmek için Base64 formatına çevir
    contents_b64 = base64.b64encode(contents).decode('utf-8')
    
    # 4. Celery Task'ını tetikle (.delay() ile asenkron olarak kuyruğa atar)
    process_csv_task.delay(new_dataset.id, current_user.organization_id, contents_b64)

    return new_dataset