#!/usr/bin/env bash
# Manual deploy script — same steps as the GitHub Actions workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "→ Pulling latest code..."
git pull origin main

echo "→ Rebuilding containers..."
docker compose up -d --build --remove-orphans

echo "→ Running database migrations..."
docker compose exec -T app alembic upgrade head || echo "No pending migrations"

echo "→ Cleaning up dangling images..."
docker image prune -f

echo "→ Waiting for app..."
sleep 8
curl -sf http://localhost/api/health && echo "✓ Deployment successful" || echo "✗ Health check failed"
