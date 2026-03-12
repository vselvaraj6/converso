from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    sales_agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Event details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Timing
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    timezone = Column(String, default="UTC")
    
    # Location
    location = Column(String, nullable=True)  # "Google Meet", "Phone", etc.
    meeting_link = Column(String, nullable=True)
    
    # External IDs
    google_event_id = Column(String, nullable=True)
    ics_uid = Column(String, nullable=True)
    
    # Status
    status = Column(String, default="confirmed")  # "confirmed", "cancelled", "rescheduled"
    
    # Metadata
    extra_metadata = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead = relationship("Lead", back_populates="calendar_events")
    sales_agent = relationship("User")