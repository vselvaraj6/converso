from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Boolean, Integer
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
    # Self-hosted Cal.com base URL (e.g., https://booking.mycompany.com)
    calcom_base_url = Column(String, default="https://cal.com")
    # Cal.com round-robin booking URL for this company's team event.
    # All inbound leads are directed here; Cal.com handles agent assignment.
    cal_booking_url = Column(String, nullable=True)
    # Cal.com event type ID — used when the AI books on the lead's behalf via API.
    cal_event_type_id = Column(Integer, nullable=True)
    
    # VAPI (Voice AI) integration
    vapi_assistant_id = Column(String, nullable=True)
    
    # Features enabled
    sms_enabled = Column(Boolean, default=True)
    voice_enabled = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leads = relationship("Lead", back_populates="company")
    users = relationship("User", back_populates="company")