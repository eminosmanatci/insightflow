from celery import Celery

# Broker ve Backend olarak Redis container'ımızı gösteriyoruz
celery_app = Celery(
    "insightflow_tasks",
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

# Task dosyalarımızı otomatik bulması için tarama yapıyoruz
celery_app.autodiscover_tasks(["app.tasks"])