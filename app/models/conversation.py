from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class ConversationThread(Base):
    __tablename__ = "conversation_threads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    
    # Thread metadata
    channel = Column(String, nullable=False)  # "sms", "voice", "email"
    is_active = Column(Boolean, default=True)
    
    # AI context
    context = Column(JSON, default=dict)
    # Example: {"goal": "schedule_meeting", "next_action": "follow_up", "notes": "Interested in product demo"}
    
    # Conversation summary (AI-generated)
    summary = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = Column(DateTime, nullable=True)
    
    # Relationships
    lead = relationship("Lead", back_populates="conversation_threads")
    messages = relationship("Message", back_populates="thread", order_by="Message.created_at")