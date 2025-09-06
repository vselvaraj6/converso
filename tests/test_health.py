import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test basic health check endpoint"""
    response = client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app_name" in data
    assert "environment" in data


def test_database_health(client: TestClient):
    """Test database health check"""
    response = client.get("/api/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_redis_health(client: TestClient):
    """Test Redis health check"""
    response = client.get("/api/health/redis")
    assert response.status_code == 200
    # Note: This might fail if Redis is not running locally
    # In that case, we expect the unhealthy status
    data = response.json()
    assert "status" in data
    assert "redis" in data