import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.workflow_service import WorkflowService
from app.models import Company, Lead, Message, LeadStatus, MessageDirection


class TestWorkflowService:
    """Test complete workflow service"""
    
    @pytest.mark.asyncio
    async def test_process_inbound_message_new_lead(self, db_session: AsyncSession):
        """Test processing inbound message for new lead"""
        # Setup test data
        company = Company(
            name="Test Company",
            ai_config={"temperature": 0.7, "tone": "friendly"}
        )
        db_session.add(company)
        await db_session.flush()
        
        lead = Lead(
            company_id=company.id,
            name="John Doe",
            email="john@example.com",
            phone="4165551234",
            status=LeadStatus.NEW
        )
        db_session.add(lead)
        await db_session.commit()
        
        # Mock services
        with patch('app.services.workflow_service.TwilioService') as mock_twilio, \
             patch('app.services.workflow_service.OpenAIService') as mock_openai:
            
            # Setup mocks
            mock_twilio.return_value.send_sms = AsyncMock(return_value={
                "success": True,
                "message_sid": "SM123"
            })
            
            mock_openai.return_value.analyze_sentiment_and_intent = AsyncMock(return_value={
                "success": True,
                "sentiment": "positive",
                "intent": "ask_question",
                "urgency": "medium"
            })
            
            mock_openai.return_value.generate_smart_reply = AsyncMock(return_value={
                "success": True,
                "reply": "Thanks for your interest! How can I help you today?"
            })
            
            # Test webhook data
            webhook_data = {
                "from": "+14165551234",
                "body": "I'm interested in your product",
                "message_sid": "SM456"
            }
            
            # Process message
            service = WorkflowService(db_session)
            result = await service.process_inbound_message(webhook_data)
            
            # Assertions
            assert result["success"] is True
            assert "reply_sent" in result
            
            # Check lead was updated
            await db_session.refresh(lead)
            assert lead.status == LeadStatus.CONTACTED
            assert lead.last_contacted is not None
            assert lead.last_contact_method == "sms"
    
    @pytest.mark.asyncio
    async def test_calendar_booking_flow(self, db_session: AsyncSession):
        """Test calendar booking intent flow"""
        # Setup
        company = Company(name="Test Company")
        db_session.add(company)
        await db_session.flush()
        
        lead = Lead(
            company_id=company.id,
            name="Jane Smith",
            email="jane@example.com",
            phone="4165555678",
            status=LeadStatus.CONTACTED
        )
        db_session.add(lead)
        await db_session.commit()
        
        with patch('app.services.workflow_service.OpenAIService') as mock_openai, \
             patch('app.services.workflow_service.TwilioService') as mock_twilio, \
             patch('app.services.workflow_service.CalComService') as mock_calendar:
            
            # Mock calendar booking intent
            mock_openai.return_value.analyze_sentiment_and_intent = AsyncMock(return_value={
                "success": True,
                "sentiment": "positive",
                "intent": "schedule_meeting",
                "urgency": "high",
                "extracted_datetime": "2025-01-15T14:00:00Z"
            })
            
            mock_openai.return_value.generate_smart_reply = AsyncMock(return_value={
                "success": True,
                "reply": "I'd be happy to schedule a demo!"
            })
            
            mock_twilio.return_value.send_sms = AsyncMock(return_value={
                "success": True,
                "message_sid": "SM789"
            })
            
            # Mock successful calendar booking
            service = WorkflowService(db_session)
            service._handle_calendar_booking = AsyncMock(return_value={
                "success": True,
                "confirmation_message": "Perfect! You're booked for Jan 15 at 2:00 PM.",
                "booking_url": "https://cal.com/test"
            })
            
            webhook_data = {
                "from": "+14165555678",
                "body": "Can we schedule a demo tomorrow at 2pm?",
                "message_sid": "SM999"
            }
            
            result = await service.process_inbound_message(webhook_data)
            
            assert result["success"] is True
            assert result["analysis"]["intent"] == "schedule_meeting"
            
            # Check lead status updated
            await db_session.refresh(lead)
            assert lead.status == LeadStatus.QUALIFIED
    
    @pytest.mark.asyncio
    async def test_outbound_campaign(self, db_session: AsyncSession):
        """Test outbound campaign processing"""
        # Setup multiple leads
        company = Company(name="Test Company", ai_config={})
        db_session.add(company)
        await db_session.flush()
        
        # New lead - should get contacted
        new_lead = Lead(
            company_id=company.id,
            name="New Lead",
            email="new@example.com",
            phone="4165551111",
            status=LeadStatus.NEW,
            nudge_interval_days=2
        )
        
        # Old lead - should get follow-up
        old_lead = Lead(
            company_id=company.id,
            name="Old Lead",
            email="old@example.com",
            phone="4165552222",
            status=LeadStatus.CONTACTED,
            last_contacted=datetime.utcnow() - timedelta(days=3),
            nudge_interval_days=2
        )
        
        # Recent lead - should not get contacted
        recent_lead = Lead(
            company_id=company.id,
            name="Recent Lead",
            email="recent@example.com",
            phone="4165553333",
            status=LeadStatus.CONTACTED,
            last_contacted=datetime.utcnow() - timedelta(hours=12),
            nudge_interval_days=2
        )
        
        db_session.add_all([new_lead, old_lead, recent_lead])
        await db_session.commit()
        
        with patch('app.services.workflow_service.VAPIService') as mock_vapi, \
             patch('app.services.workflow_service.TwilioService') as mock_twilio, \
             patch('app.services.workflow_service.OpenAIService') as mock_openai:
            
            # Setup mocks
            mock_vapi.return_value.create_assistant = AsyncMock(return_value={
                "success": True,
                "assistant": {"id": "asst_123"}
            })
            mock_vapi.return_value.create_phone_call = AsyncMock(return_value={
                "success": True,
                "call": {"id": "call_123"}
            })
            
            mock_twilio.return_value.send_sms = AsyncMock(return_value={
                "success": True,
                "message_sid": "SM123"
            })
            
            mock_openai.return_value.generate_cold_outreach = AsyncMock(
                return_value="Hi! Noticed you were interested in our product."
            )
            mock_openai.return_value.generate_smart_reply = AsyncMock(return_value={
                "success": True,
                "reply": "Following up!"
            })
            
            # Run campaign
            service = WorkflowService(db_session)
            result = await service.process_outbound_campaign()
            
            assert result["success"] is True
            assert result["processed"] == 2  # new_lead and old_lead
            
            # Check leads were updated
            await db_session.refresh(new_lead)
            await db_session.refresh(old_lead)
            await db_session.refresh(recent_lead)
            
            assert new_lead.last_contacted is not None
            assert old_lead.last_contacted > datetime.utcnow() - timedelta(minutes=1)
            # recent_lead should NOT have been updated (still 12h ago)
            assert recent_lead.last_contacted < datetime.utcnow() - timedelta(hours=11)
    
    @pytest.mark.asyncio
    async def test_voice_call_retry_logic(self, db_session: AsyncSession):
        """Test voice call retry logic"""
        company = Company(name="Test Company")
        db_session.add(company)
        await db_session.flush()
        
        # Lead with failed call attempts
        lead = Lead(
            company_id=company.id,
            name="Retry Lead",
            email="retry@example.com",
            phone="4165554444",
            status=LeadStatus.NEW,
            last_contacted=datetime.utcnow() - timedelta(days=1),
            call_attempts=2,
            last_call_attempt=datetime.utcnow() - timedelta(days=2)
        )
        db_session.add(lead)
        await db_session.commit()
        
        service = WorkflowService(db_session)
        
        # Test should use voice (under 3 attempts, has been contacted before via SMS)
        should_call = await service._should_use_voice(lead)
        assert should_call is True
        
        # Update to max attempts
        lead.call_attempts = 3
        await db_session.commit()
        
        # Should not use voice anymore
        should_call = await service._should_use_voice(lead)
        assert should_call is False
    
    @pytest.mark.asyncio
    async def test_sentiment_tracking(self, db_session: AsyncSession):
        """Test sentiment score tracking over time"""
        company = Company(name="Test Company", ai_config={})
        db_session.add(company)
        await db_session.flush()
        
        lead = Lead(
            company_id=company.id,
            name="Sentiment Lead",
            email="sentiment@example.com",
            phone="4165556666",
            status=LeadStatus.NEW
        )
        db_session.add(lead)
        await db_session.commit()
        
        with patch('app.services.workflow_service.OpenAIService') as mock_openai, \
             patch('app.services.workflow_service.TwilioService') as mock_twilio:
            
            mock_twilio.return_value.send_sms = AsyncMock(return_value={
                "success": True,
                "message_sid": "SM123"
            })
            
            # First message - neutral
            mock_openai.return_value.analyze_sentiment_and_intent = AsyncMock(return_value={
                "success": True,
                "sentiment": "neutral",
                "intent": "ask_question",
                "urgency": "low"
            })
            mock_openai.return_value.generate_smart_reply = AsyncMock(return_value={
                "success": True,
                "reply": "Happy to help!"
            })
            
            service = WorkflowService(db_session)
            await service.process_inbound_message({
                "from": "+14165556666",
                "body": "What does your product do?",
                "message_sid": "SM1"
            })
            
            await db_session.refresh(lead)
            assert lead.sentiment_score["latest"] == "neutral"
            
            # Second message - positive with booking intent
            mock_openai.return_value.analyze_sentiment_and_intent = AsyncMock(return_value={
                "success": True,
                "sentiment": "positive",
                "intent": "schedule_meeting",
                "urgency": "high"
            })
            
            await service.process_inbound_message({
                "from": "+14165556666",
                "body": "This sounds great! Can we set up a demo?",
                "message_sid": "SM2"
            })
            
            await db_session.refresh(lead)
            assert lead.sentiment_score["latest"] == "positive"
            assert lead.sentiment_score["intent"] == "schedule_meeting"
            assert lead.status == LeadStatus.QUALIFIED
