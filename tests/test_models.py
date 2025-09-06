import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime

from app.models import (
    Company, Lead, Message, ConversationThread, 
    CalendarEvent, User, LeadStatus, MessageDirection
)


@pytest.mark.asyncio
async def test_create_company(db_session: AsyncSession):
    """Test creating a company"""
    company = Company(
        name="Test Company",
        domain="testcompany.com",
        industry="Technology",
        ai_config={"temperature": 0.7, "tone": "friendly"},
        twilio_phone_number="+14165551234"
    )
    db_session.add(company)
    await db_session.commit()
    
    # Query back
    result = await db_session.execute(
        select(Company).where(Company.name == "Test Company")
    )
    saved_company = result.scalar_one()
    
    assert saved_company.name == "Test Company"
    assert saved_company.domain == "testcompany.com"
    assert saved_company.ai_config["temperature"] == 0.7


@pytest.mark.asyncio
async def test_create_lead_with_company(db_session: AsyncSession):
    """Test creating a lead associated with a company"""
    # Create company first
    company = Company(name="Test Company")
    db_session.add(company)
    await db_session.commit()
    
    # Create lead
    lead = Lead(
        company_id=company.id,
        name="John Doe",
        email="john@example.com",
        phone="+14165551234",
        title="CEO",
        lead_company="Doe Industries",
        industry="Manufacturing",
        status=LeadStatus.NEW
    )
    db_session.add(lead)
    await db_session.commit()
    
    # Query with relationship
    result = await db_session.execute(
        select(Lead).where(Lead.email == "john@example.com")
    )
    saved_lead = result.scalar_one()
    
    assert saved_lead.name == "John Doe"
    assert saved_lead.company_id == company.id
    assert saved_lead.status == LeadStatus.NEW


@pytest.mark.asyncio
async def test_create_message_for_lead(db_session: AsyncSession):
    """Test creating messages for a lead"""
    # Setup
    company = Company(name="Test Company")
    db_session.add(company)
    await db_session.commit()
    
    lead = Lead(
        company_id=company.id,
        name="John Doe",
        email="john@example.com",
        phone="+14165551234"
    )
    db_session.add(lead)
    await db_session.commit()
    
    # Create inbound message
    inbound_msg = Message(
        lead_id=lead.id,
        direction=MessageDirection.INBOUND,
        channel="sms",
        content="I'm interested in your product",
        twilio_message_sid="SM123456789"
    )
    db_session.add(inbound_msg)
    
    # Create outbound message
    outbound_msg = Message(
        lead_id=lead.id,
        direction=MessageDirection.OUTBOUND,
        channel="sms",
        content="Thanks for your interest! How can I help?",
        twilio_message_sid="SM987654321"
    )
    db_session.add(outbound_msg)
    await db_session.commit()
    
    # Query messages
    result = await db_session.execute(
        select(Message).where(Message.lead_id == lead.id)
    )
    messages = result.scalars().all()
    
    assert len(messages) == 2
    assert any(m.direction == MessageDirection.INBOUND for m in messages)
    assert any(m.direction == MessageDirection.OUTBOUND for m in messages)


@pytest.mark.asyncio
async def test_conversation_thread(db_session: AsyncSession):
    """Test conversation thread functionality"""
    # Setup
    company = Company(name="Test Company")
    db_session.add(company)
    await db_session.commit()
    
    lead = Lead(
        company_id=company.id,
        name="John Doe",
        email="john@example.com",
        phone="+14165551234"
    )
    db_session.add(lead)
    await db_session.commit()
    
    # Create thread
    thread = ConversationThread(
        lead_id=lead.id,
        channel="sms",
        is_active=True,
        context={"goal": "schedule_meeting", "notes": "Interested in demo"}
    )
    db_session.add(thread)
    await db_session.commit()
    
    # Add messages to thread
    msg1 = Message(
        lead_id=lead.id,
        thread_id=thread.id,
        direction=MessageDirection.INBOUND,
        channel="sms",
        content="Can we schedule a demo?"
    )
    msg2 = Message(
        lead_id=lead.id,
        thread_id=thread.id,
        direction=MessageDirection.OUTBOUND,
        channel="sms",
        content="Absolutely! I have slots available tomorrow at 2 PM."
    )
    db_session.add_all([msg1, msg2])
    await db_session.commit()
    
    # Query thread with messages
    result = await db_session.execute(
        select(ConversationThread).where(ConversationThread.id == thread.id)
    )
    saved_thread = result.scalar_one()
    
    assert saved_thread.is_active is True
    assert saved_thread.context["goal"] == "schedule_meeting"


@pytest.mark.asyncio
async def test_calendar_event(db_session: AsyncSession):
    """Test calendar event creation"""
    # Setup
    company = Company(name="Test Company")
    db_session.add(company)
    await db_session.commit()
    
    user = User(
        company_id=company.id,
        email="sales@example.com",
        name="Sales Agent",
        hashed_password="hashed_password_here",
        role="sales_agent"
    )
    db_session.add(user)
    
    lead = Lead(
        company_id=company.id,
        name="John Doe",
        email="john@example.com",
        phone="+14165551234"
    )
    db_session.add(lead)
    await db_session.commit()
    
    # Create calendar event
    event = CalendarEvent(
        lead_id=lead.id,
        sales_agent_id=user.id,
        title="Demo with John Doe",
        description="Product demonstration",
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow(),
        location="Google Meet",
        meeting_link="https://meet.google.com/abc-defg-hij"
    )
    db_session.add(event)
    await db_session.commit()
    
    # Query event
    result = await db_session.execute(
        select(CalendarEvent).where(CalendarEvent.lead_id == lead.id)
    )
    saved_event = result.scalar_one()
    
    assert saved_event.title == "Demo with John Doe"
    assert saved_event.location == "Google Meet"
    assert saved_event.sales_agent_id == user.id