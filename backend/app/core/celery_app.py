from celery import Celery

celery_app = Celery(
    "insightflow",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=['app.tasks.dataset_tasks']  # <--- ÇÖZÜM BURADA: Celery'e görev dosyasını tanıtıyoruz
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Istanbul",
    enable_utc=True,
)