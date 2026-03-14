import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from datetime import timedelta
import os

# Set test environment
os.environ["APP_ENV"] = "testing"
DEFAULT_TEST_DB = "postgresql+asyncpg://converso:password@localhost:5432/test_converso"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_TEST_DB)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/15")

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.models import Company, User, Lead, Message, CalendarEvent, UserRole
from app.core.security import get_password_hash, create_access_token

# Use the URL from environment/settings
test_engine = create_async_engine(
    DATABASE_URL,
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
def event_loop():
    """Create an instance of the default event loop for each test case."""
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
        await session.rollback()
        await session.close()


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with overridden database dependency"""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def test_company(db_session: AsyncSession) -> Company:
    """Fixture for a basic test company"""
    company = Company(
        name="Fixture Company",
        ai_config={"temperature": 0.7, "tone": "friendly"}
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    return company


@pytest.fixture(scope="function")
async def superuser(db_session: AsyncSession, test_company: Company) -> User:
    """Fixture for a superuser"""
    user = User(
        company_id=test_company.id,
        email="super@converso.app",
        name="Super Admin",
        hashed_password=get_password_hash("password123"),
        role=UserRole.ADMIN,
        is_active=True,
        is_superuser=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def superuser_token_headers(superuser: User) -> dict:
    """Token headers for a superuser"""
    token = create_access_token({"sub": str(superuser.id)}, expires_delta=timedelta(days=1))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
async def admin_user(db_session: AsyncSession, test_company: Company) -> User:
    """Fixture for a company admin"""
    user = User(
        company_id=test_company.id,
        email="admin@example.com",
        name="Admin User",
        hashed_password=get_password_hash("password123"),
        role=UserRole.ADMIN,
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def admin_token_headers(admin_user: User) -> dict:
    """Token headers for an admin user"""
    token = create_access_token({"sub": str(admin_user.id)}, expires_delta=timedelta(days=1))
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def write_user(db_session: AsyncSession, test_company: Company) -> User:
    """Fixture for a user with write access"""
    user = User(
        company_id=test_company.id,
        email="write@example.com",
        name="Write User",
        hashed_password=get_password_hash("password123"),
        role=UserRole.WRITE,
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def write_token_headers(write_user: User) -> dict:
    """Token headers for a write user"""
    token = create_access_token({"sub": str(write_user.id)}, expires_delta=timedelta(days=1))
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def read_user(db_session: AsyncSession, test_company: Company) -> User:
    """Fixture for a user with read-only access"""
    user = User(
        company_id=test_company.id,
        email="read@example.com",
        name="Read User",
        hashed_password=get_password_hash("password123"),
        role=UserRole.READ,
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def read_token_headers(read_user: User) -> dict:
    """Token headers for a read user"""
    token = create_access_token({"sub": str(read_user.id)}, expires_delta=timedelta(days=1))
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def test_user(admin_user: User) -> User:
    """Legacy test user fixture (uses admin for compatibility)"""
    return admin_user


@pytest.fixture(scope="function")
async def normal_user_token_headers(test_user: User) -> dict:
    """Token headers for a normal user"""
    token = create_access_token({"sub": str(test_user.id)}, expires_delta=timedelta(days=1))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
async def auth_client(client: AsyncClient, test_user: User) -> AsyncClient:
    """Create a test client with authentication headers"""
    token = create_access_token(
        {"sub": str(test_user.id)}, 
        expires_delta=timedelta(days=1)
    )
    client.headers.update({
        "Authorization": f"Bearer {token}"
    })
    return client


@pytest.fixture
def sample_lead_data():
    """Sample lead data for testing"""
    return {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+14165551234",
        "title": "CEO",
        "company": "Example Corp",
        "industry": "Technology",
        "status": "new"
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
