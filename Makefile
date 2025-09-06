.PHONY: help build run stop clean test lint format install dev prod

# Default target
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Run development environment with docker-compose"
	@echo "  make prod       - Build production Docker image"
	@echo "  make run        - Run the application locally"
	@echo "  make stop       - Stop all containers"
	@echo "  make clean      - Clean up containers and volumes"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linting"
	@echo "  make format     - Format code"
	@echo "  make migrate    - Run database migrations"

# Install dependencies
install:
	pip install -r requirements.txt

# Development environment
dev:
	docker-compose up --build

# Production build
prod:
	docker build -t converso:latest .

# Run locally (without Docker)
run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Stop all containers
stop:
	docker-compose down

# Clean everything
clean:
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Run tests
test:
	./scripts/test.sh

# Run specific test file
test-file:
	pytest tests/$(file)

# Run tests with coverage report
test-cov:
	pytest --cov=app --cov-report=html --cov-report=term

# Lint code
lint:
	@echo "🔍 Running linters..."
	@echo "Running flake8..."
	flake8 app/
	@echo "Running black..."
	black --check app/
	@echo "Running isort..."
	isort --check-only app/
	@echo "Running pylint..."
	pylint app/
	@echo "Running mypy..."
	mypy app/
	@echo "Running bandit..."
	bandit -r app/ -ll
	@echo "✅ All linting passed!"

# Run specific linter
lint-flake8:
	flake8 app/

lint-black:
	black --check app/

lint-isort:
	isort --check-only app/

lint-pylint:
	pylint app/

lint-mypy:
	mypy app/

lint-bandit:
	bandit -r app/ -ll

lint-secrets:
	detect-secrets scan --baseline .secrets.baseline

# Format code
format:
	@echo "🎨 Formatting code..."
	black app/
	isort app/
	@echo "✅ Code formatted!"

# Setup pre-commit hooks
pre-commit-install:
	pre-commit install
	pre-commit install --hook-type commit-msg
	@echo "✅ Pre-commit hooks installed!"

# Run pre-commit on all files
pre-commit-run:
	pre-commit run --all-files

# Update pre-commit hooks
pre-commit-update:
	pre-commit autoupdate

# Database migrations
migrate:
	alembic upgrade head

# Create new migration
migrate-create:
	alembic revision --autogenerate -m "$(msg)"

# Deploy to Railway
deploy-railway:
	railway up

# Deploy to Render
deploy-render:
	@echo "Push to GitHub and Render will auto-deploy"

# Deploy to Fly.io
deploy-fly:
	flyctl deploy

# Local database setup
db-setup:
	docker-compose up -d postgres redis
	sleep 5
	alembic upgrade head

# Logs
logs:
	docker-compose logs -f

# Shell into app container
shell:
	docker-compose exec app /bin/bash