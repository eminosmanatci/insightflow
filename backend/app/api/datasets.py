import base64
import hashlib
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.models.dataset import Dataset, SalesRecord
from app.schemas.dataset import DatasetResponse
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
    current_user: User = Depends(allow_upload)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="Veri yüklemek için önce bir şirket oluşturmalısınız.")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Sadece CSV formatı desteklenmektedir.")

    # 1. Dosya içeriğini oku
    contents = await file.read()
    
    # 2. Dosya içeriğinin MD5 imzasını (hash) oluştur
    file_hash = hashlib.md5(contents).hexdigest()

    # 3. Veritabanında bu şirkete ait, aynı hash'e sahip bir dosya var mı kontrol et
    existing_dataset = db.query(Dataset).filter(
        Dataset.organization_id == current_user.organization_id,
        Dataset.file_hash == file_hash
    ).first()

    if existing_dataset:
        raise HTTPException(
            status_code=400, 
            detail="Bu veri seti daha önce yüklendi. Lütfen farklı veriler içeren bir dosya seçin."
        )

    # 4. Veritabanında dosyayı "processing" durumuyla aç (file_hash ile birlikte kaydediyoruz)
    new_dataset = Dataset(
        name=file.filename,
        status="processing",
        organization_id=current_user.organization_id,
        file_hash=file_hash
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    # 5. İçeriği JSON üzerinden güvenle gönderebilmek için Base64 formatına çevir
    contents_b64 = base64.b64encode(contents).decode('utf-8')
    
    # 6. Görevi tetikle
    process_csv_task.delay(new_dataset.id, current_user.organization_id, contents_b64)

    return new_dataset

@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_upload)
):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id, 
        Dataset.organization_id == current_user.organization_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Veri seti bulunamadı veya yetkiniz yok.")

    # 1. Önce bu dosyaya bağlı tüm satış kayıtlarını sil (Temizlik)
    db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset_id).delete()
    
    # 2. Sonra veri setinin kendisini sil
    db.delete(dataset)
    db.commit()
    
    return None