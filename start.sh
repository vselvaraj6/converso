#!/bin/bash
set -e

echo "Starting Converso application..."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A app.tasks.celery_app worker --loglevel=info --detach

# Start Celery beat in background
echo "Starting Celery beat..."
celery -A app.tasks.celery_app beat --loglevel=info --detach

# Start the FastAPI application
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}