from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "converso",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.lead_tasks"]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    "send-scheduled-messages": {
        "task": "app.tasks.lead_tasks.send_scheduled_messages",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    "process-new-leads": {
        "task": "app.tasks.lead_tasks.process_new_leads", 
        "schedule": crontab(minute="*"),  # Every minute
    },
    }