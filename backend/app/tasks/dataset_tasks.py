import base64
import io
import pandas as pd
from celery import shared_task
from app.core.database import SessionLocal
from app.models.dataset import Dataset, SalesRecord

@shared_task(name="app.tasks.dataset_tasks.process_csv_task")
def process_csv_task(dataset_id: int, org_id: int, file_contents_b64: str):
    """Celery Worker tarafından arka planda yürütülecek temizlik ve kayıt görevi"""
    db = SessionLocal()
    
    try:
        # 1. Base64 formatındaki dosya içeriğini geri çözüyoruz
        file_contents = base64.b64decode(file_contents_b64)
        
        # 2. Dataset durumunu güncelle
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return "Dataset bulunamadı."
            
        # 3. Pandas ile DataFrame'e oku
        df = pd.read_csv(io.BytesIO(file_contents))
        df.columns = df.columns.str.lower().str.replace(' ', '_')
        
        # 4. Satır satır SalesRecord oluştur
        records = []
        for _, row in df.iterrows():
            record = SalesRecord(
                dataset_id=dataset_id,
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
        
        # 5. Toplu Veritabanı Kaydı
        db.bulk_save_objects(records)
        
        # 6. Başarı durumunu işaretle
        dataset.status = "completed"
        dataset.row_count = len(records)
        db.commit()
        return f"Başarıyla tamamlandı. {len(records)} satır eklendi."
        
    except Exception as e:
        db.rollback()
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            dataset.status = "failed"
            db.commit()
        return f"Hata oluştu: {str(e)}"
    finally:
        db.close()