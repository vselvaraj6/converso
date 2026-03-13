from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class MessageDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    thread_id = Column(UUID(as_uuid=True), ForeignKey("conversation_threads.id"), nullable=True)
    
    # Message details
    direction = Column(SQLEnum(MessageDirection), nullable=False)
    channel = Column(String, nullable=False)  # "sms", "voice", "email"
    
    # Content
    content = Column(Text, nullable=False)
    
    # For voice messages
    transcript = Column(Text, nullable=True)
    recording_url = Column(String, nullable=True)
    duration_seconds = Column(String, nullable=True)
    
    # External IDs
    twilio_message_sid = Column(String, nullable=True)
    vapi_call_id = Column(String, nullable=True)
    
    # AI-generated metadata
    ai_metadata = Column(JSON, default=dict)
    # Example: {"sentiment": "positive", "intent": "schedule_meeting", "extracted_datetime": "2025-01-15 10:00"}
    
    # Status tracking
    status = Column(String, default="sent")  # "sent", "delivered", "failed", "read"
    error_message = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company")
    lead = relationship("Lead", back_populates="messages")
    thread = relationship("ConversationThread", back_populates="messages")