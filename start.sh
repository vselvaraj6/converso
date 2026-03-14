#!/bin/bash
set -e

echo "Starting Converso application..."

# Wait for database to be ready
if [ -n "$DATABASE_URL" ]; then
    # Extract host and port from DATABASE_URL if possible, or just use the host part
    # For docker-compose, the host is usually 'postgres'
    DB_HOST=$(echo $DATABASE_URL | sed -e 's|.*@||' -e 's|/.*||' -e 's|:.*||')
    echo "Waiting for database at $DB_HOST..."
    until pg_isready -h "$DB_HOST" -U "${DB_USER:-converso}"; do
      echo "Database is unavailable - sleeping"
      sleep 2
    done
    echo "Database is up!"
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the FastAPI application
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} ${UVICORN_EXTRA_ARGS}
