import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Company, Lead, LeadStatus, Message, MessageDirection, ConversationThread, CalendarEvent
from datetime import datetime, timedelta

@pytest.mark.asyncio
async def test_create_company(db_session: AsyncSession):
    company = Company(
        name="Acme Corp",
        industry="SaaS",
        ai_config={"temperature": 0.7, "tone": "professional"}
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    
    assert company.id is not None
    assert company.name == "Acme Corp"
    assert company.ai_config["tone"] == "professional"

@pytest.mark.asyncio
async def test_create_lead_with_company(db_session: AsyncSession):
    company = Company(name="Test Co", ai_config={})
    db_session.add(company)
    await db_session.flush()
    
    lead = Lead(
        company_id=company.id,
        name="Jane Smith",
        email="jane@example.com",
        phone="+15550001111",
        status=LeadStatus.NEW
    )
    db_session.add(lead)
    await db_session.commit()
    
    # Use selectinload to avoid lazy-loading issues
    result = await db_session.execute(
        select(Company).where(Company.id == company.id).options(selectinload(Company.leads))
    )
    fetched_company = result.scalar_one()
    assert len(fetched_company.leads) == 1
    assert fetched_company.leads[0].name == "Jane Smith"

@pytest.mark.asyncio
async def test_create_message_for_lead(db_session: AsyncSession):
    company = Company(name="Msg Co", ai_config={})
    db_session.add(company)
    await db_session.flush()
    
    lead = Lead(
        company_id=company.id,
        name="Bob Jones",
        email="bob@example.com",
        phone="+15552223333"
    )
    db_session.add(lead)
    await db_session.flush()
    
    # Create an inbound message
    message = Message(
        company_id=company.id,
        lead_id=lead.id,
        direction=MessageDirection.INBOUND,
        channel="sms",
        content="I'm interested in your product",
        twilio_message_sid="SM123456789"
    )
    db_session.add(message)
    await db_session.commit()
    
    # Check lead relationship by loading lead with messages
    result = await db_session.execute(
        select(Lead).where(Lead.id == lead.id).options(selectinload(Lead.messages))
    )
    fetched_lead = result.scalar_one()
    assert len(fetched_lead.messages) == 1
    assert fetched_lead.messages[0].content == "I'm interested in your product"
    assert fetched_lead.messages[0].company_id == company.id

@pytest.mark.asyncio
async def test_conversation_thread(db_session: AsyncSession):
    company = Company(name="Thread Co", ai_config={})
    db_session.add(company)
    await db_session.flush()
    
    lead = Lead(
        company_id=company.id,
        name="Alice White",
        email="alice@example.com",
        phone="+15554445555"
    )
    db_session.add(lead)
    await db_session.flush()
    
    thread = ConversationThread(
        lead_id=lead.id,
        channel="sms",
        context={"topic": "demo"}
    )
    db_session.add(thread)
    await db_session.flush()
    
    msg = Message(
        company_id=company.id,
        lead_id=lead.id,
        thread_id=thread.id,
        direction=MessageDirection.INBOUND,
        channel="sms",
        content="Can we schedule a demo?"
    )
    db_session.add(msg)
    await db_session.commit()
    
    # Verify thread messages
    result = await db_session.execute(
        select(ConversationThread)
        .where(ConversationThread.id == thread.id)
        .options(selectinload(ConversationThread.messages))
    )
    fetched_thread = result.scalar_one()
    assert len(fetched_thread.messages) == 1
    assert fetched_thread.messages[0].content == "Can we schedule a demo?"

@pytest.mark.asyncio
async def test_calendar_event(db_session: AsyncSession):
    company = Company(name="Cal Co", ai_config={})
    db_session.add(company)
    await db_session.flush()
    
    lead = Lead(
        company_id=company.id,
        name="Cal User",
        email="caluser@example.com", # Added missing email
        phone="+15556667777"
    )
    db_session.add(lead)
    await db_session.flush()
    
    event = CalendarEvent(
        lead_id=lead.id,
        title="Discovery Call",
        start_time=datetime.utcnow() + timedelta(days=1),
        end_time=datetime.utcnow() + timedelta(days=1, hours=1),
        status="confirmed",
        google_event_id="cal_123"
    )
    db_session.add(event)
    await db_session.commit()
    await db_session.refresh(event)
    
    assert event.id is not None
    assert event.lead_id == lead.id
    assert event.status == "confirmed"
