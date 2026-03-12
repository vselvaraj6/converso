"""
Lead Model - Core entity representing potential customers

This module defines the Lead model and its status enumeration,
representing individuals who have shown interest in the company's services.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class LeadStatus(str, Enum):
    """
    Lead lifecycle status enumeration.
    
    Tracks the progression of a lead through the sales funnel:
    - NEW: Just entered the system, not yet contacted
    - CONTACTED: Initial contact has been made
    - QUALIFIED: Lead has shown genuine interest and meets criteria
    - CONVERTED: Lead has become a customer
    - LOST: Lead is no longer interested or viable
    """
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"


class Lead(Base):
    """
    Lead model representing a potential customer.
    
    This is the central entity in the system, tracking all information
    about leads including their contact details, interaction history,
    sentiment analysis, and conversion status.
    
    Attributes:
        id: Unique identifier for the lead
        company_id: Reference to the company this lead belongs to
        name: Full name of the lead
        email: Email address (unique across system)
        phone: Phone number for SMS/voice communication
        title: Job title or position
        lead_company: The company where the lead works
        status: Current stage in the sales funnel
        industry: Business sector of the lead
        source: How the lead was acquired (e.g., "website", "referral")
        interest: What product/service they're interested in
        lead_owner: Assigned sales representative
        last_contacted: Timestamp of most recent contact
        last_contact_method: Channel used for last contact
        call_attempts: Number of voice call attempts made
        last_call_attempt: Timestamp of most recent call attempt
        sentiment_score: AI-analyzed sentiment and intent data
        lead_score: Calculated score based on engagement and fit
        zoho_lead_id: External CRM identifier
        created_at: When the lead was created
        updated_at: Last modification timestamp
    """
    __tablename__ = "leads"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Company association - leads belong to a specific company/tenant
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Core lead information
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False, index=True)
    title = Column(String, nullable=True)
    lead_company = Column(String, nullable=True)  # Company where the lead works
    
    # Lead qualification metadata
    status = Column(SQLEnum(LeadStatus), default=LeadStatus.NEW, nullable=False, index=True)
    industry = Column(String, nullable=True)
    source = Column(String, nullable=True)  # Acquisition source
    interest = Column(String, nullable=True)  # Product/service of interest
    
    # Sales tracking
    lead_owner = Column(String, nullable=True)  # Deprecated: use assigned_agent_id
    assigned_agent_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    last_contacted = Column(DateTime, nullable=True, index=True)
    last_contact_method = Column(String, nullable=True)  # "sms", "voice", "email"
    
    # Voice call retry tracking
    call_attempts = Column(Integer, default=0, nullable=False)
    last_call_attempt = Column(DateTime, nullable=True)
    
    # Automated nurturing configuration
    nudge_interval_days = Column(Integer, default=2, nullable=False)  # Default to nudge every 2 days if no response
    
    # AI-powered insights
    sentiment_score = Column(JSON, default=dict, nullable=False)
    # Example structure:
    # {
    #     "latest": "positive",
    #     "intent": "schedule_meeting",
    #     "urgency": "high",
    #     "confidence": 0.85,
    #     "updated_at": "2025-01-09T10:00:00Z"
    # }
    
    lead_score = Column(Integer, default=0, nullable=False)
    
    # External system integration
    zoho_lead_id = Column(String, nullable=True, unique=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="leads")
    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id])
    messages = relationship(
        "Message",
        back_populates="lead",
        order_by="Message.created_at",
        cascade="all, delete-orphan"
    )
    conversation_threads = relationship(
        "ConversationThread",
        back_populates="lead",
        cascade="all, delete-orphan"
    )
    calendar_events = relationship(
        "CalendarEvent",
        back_populates="lead",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<Lead(name='{self.name}', email='{self.email}', status='{self.status}')>"
    
    @property
    def is_qualified(self) -> bool:
        """Check if lead is qualified or converted."""
        return self.status in [LeadStatus.QUALIFIED, LeadStatus.CONVERTED]
    
    @property
    def days_since_contact(self) -> Optional[int]:
        """Calculate days since last contact."""
        if self.last_contacted:
            return (datetime.utcnow() - self.last_contacted).days
        return None