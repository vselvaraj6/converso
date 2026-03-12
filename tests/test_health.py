import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test the main health check endpoint"""
    response = await client.get("/api/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_database_health(client: AsyncClient):
    """Test the database health check endpoint"""
    response = await client.get("/api/health/db")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_redis_health(client: AsyncClient):
    """Test the redis health check endpoint"""
    response = await client.get("/api/health/redis")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
