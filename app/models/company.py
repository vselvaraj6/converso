from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, nullable=True)
    industry = Column(String, nullable=True)
    
    # Dynamic configuration for AI prompts
    ai_config = Column(JSON, default=dict, nullable=False)
    # Example: {"prompt_template": "", "temperature": 0.7, "tone": "friendly"}
    
    # Integration settings
    twilio_phone_number = Column(String, nullable=True)
    calendar_email = Column(String, nullable=True)
    
    # Features enabled
    sms_enabled = Column(Boolean, default=True)
    voice_enabled = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leads = relationship("Lead", back_populates="company")
    users = relationship("User", back_populates="company")