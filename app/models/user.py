from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    WRITE = "write"
    READ = "read"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Company association
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # User information
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    
    # Authentication
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Role
    role = Column(String, default=UserRole.WRITE)
    
    # OAuth tokens (for calendar integration)
    oauth_tokens = Column(JSON, default=dict)
    # Example: {"google": {"access_token": "", "refresh_token": "", "expires_at": ""}}
    
    # Managed Calendar (Platform handles Cal.com integration)
    calendar_connected = Column(Boolean, default=False)
    manual_calendar_url = Column(String, nullable=True)
    calcom_user_id = Column(Integer, nullable=True)
    calcom_username = Column(String, nullable=True)
    calcom_event_id = Column(Integer, nullable=True)
    working_hours = Column(JSON, default={"start": 9, "end": 17})
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="users")
