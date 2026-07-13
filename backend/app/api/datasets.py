from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.core.database import get_db, SessionLocal
from app.api.deps import get_current_user
from app.models.user import User
from app.models.dataset import Dataset, SalesRecord
from app.schemas.dataset import DatasetResponse

router = APIRouter(prefix="/datasets", tags=["Data Pipeline"])

def process_csv_data(dataset_id: int, org_id: int, file_contents: bytes):
    """Arka planda çalışıp CSV verisini Pandas ile temizleyen ve DB'ye yazan fonksiyon"""
    # Arka plan görevi için bağımsız bir veritabanı oturumu açıyoruz
    db = SessionLocal()
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    try:
        # 1. Veriyi Pandas DataFrame'e al
        df = pd.read_csv(io.BytesIO(file_contents))
        
        # 2. Temizlik: Sütun isimlerini küçük harfe çevirip boşlukları alt çizgi yapalım
        df.columns = df.columns.str.lower().str.replace(' ', '_')
        
        # 3. Satırları oluştur (Şimdilik örnek bir veri yapısı beklediğimizi varsayıyoruz)
        records = []
        for _, row in df.iterrows():
            record = SalesRecord(
                dataset_id=dataset.id,
                organization_id=org_id,
                transaction_date=pd.to_datetime(row.get('date', pd.Timestamp.now())),
                region=str(row.get('region', 'Unknown')),
                category=str(row.get('category', 'Unknown')),
                customer_name=str(row.get('customer', 'Unknown')),
                product_name=str(row.get('product', 'Unknown')),
                quantity=int(row.get('quantity', 0)),
                unit_price=float(row.get('price', 0.0)),
                total_price=float(row.get('total', 0.0))
            )
            records.append(record)
        
        # 4. Toplu Kayıt (Performans için tek tek add yerine bulk_save kullanılır)
        db.bulk_save_objects(records)
        
        # 5. Veri setinin durumunu Güncelle
        dataset.status = "completed"
        dataset.row_count = len(records)
        db.commit()
        
    except Exception as e:
        dataset.status = "failed"
        db.commit()
        print(f"Veri işleme hatası: {e}")
    finally:
        db.close()


@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kullanıcının şirketi var mı kontrolü
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="Veri yüklemek için önce bir şirket oluşturmalısınız.")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Sadece CSV formatı desteklenmektedir.")

    # 1. Veritabanında dosyayı "processing" (işleniyor) durumuyla oluştur
    new_dataset = Dataset(
        name=file.filename,
        status="processing",
        organization_id=current_user.organization_id
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    # 2. Dosyayı belleğe oku
    contents = await file.read()
    
    # 3. Gerçek işleme görevini arka plana at ve kullanıcıya anında cevap dön
    background_tasks.add_task(process_csv_data, new_dataset.id, current_user.organization_id, contents)

    return new_dataset

@router.get("/", response_model=list[DatasetResponse])
def get_my_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının şirketine ait tüm veri setlerini ve güncel durumlarını listeler."""
    datasets = db.query(Dataset).filter(Dataset.organization_id == current_user.organization_id).all()
    return datasets