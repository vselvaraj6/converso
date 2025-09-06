import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
import os

# Set test environment
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test_converso"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# Test database engine
test_engine = create_async_engine(
    settings.database_url,
    poolclass=NullPool,
)

# Test session
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client(db_session: AsyncSession) -> TestClient:
    """Create test client with overridden database dependency"""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_lead_data():
    """Sample lead data for testing"""
    return {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+14165551234",
        "title": "CEO",
        "lead_company": "Example Corp",
        "industry": "Technology",
        "status": "new"
    }


@pytest.fixture
def sample_message_data():
    """Sample message data for testing"""
    return {
        "direction": "inbound",
        "channel": "sms",
        "content": "I'm interested in your product",
        "twilio_message_sid": "SM123456789"
    }


@pytest.fixture
def twilio_webhook_data():
    """Sample Twilio webhook data"""
    return {
        "ToCountry": "CA",
        "ToState": "Ontario",
        "SmsMessageSid": "SM93bf458a682f063d263a2ce72745b9a5",
        "NumMedia": "0",
        "ToCity": "Toronto",
        "FromZip": "",
        "SmsSid": "SM93bf458a682f063d263a2ce72745b9a5",
        "FromState": "ON",
        "SmsStatus": "received",
        "FromCity": "OAKVILLE",
        "Body": "I'd like to schedule a demo",
        "FromCountry": "CA",
        "To": "+14373203563",
        "ToZip": "",
        "NumSegments": "1",
        "MessageSid": "SM93bf458a682f063d263a2ce72745b9a5",
        "AccountSid": "ACbcd449bf61dbe7abce8b071a0c67dac9",
        "From": "+12899810562",
        "ApiVersion": "2010-04-01"
    }