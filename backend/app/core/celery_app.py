from celery import Celery

celery_app = Celery(
    "insightflow",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Istanbul",
    enable_utc=True,
)

# SİHİRLİ VE ZORUNLU SATIR:
# Python'u bu dosyayı okumaya mecbur bırakıyoruz. 
# Böylece içerideki @shared_task kesinlikle tetiklenecek!
import app.tasks.dataset_tasks