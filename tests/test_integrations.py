import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.integrations.twilio import TwilioService
from app.integrations.openai import OpenAIService
from app.models import Lead, Message, MessageDirection
from datetime import datetime


class TestTwilioService:
    """Test Twilio integration"""
    
    @pytest.mark.asyncio
    @patch('app.integrations.twilio.Client')
    async def test_send_sms_success(self, mock_client):
        """Test successful SMS sending"""
        # Mock Twilio response
        mock_message = Mock()
        mock_message.sid = "SM123456789"
        mock_message.to = "+14165551234"
        mock_message.from_ = "+14373203563"
        mock_message.body = "Test message"
        mock_message.status = "sent"
        mock_message.date_created = datetime.utcnow()
        mock_message.date_updated = datetime.utcnow()
        
        mock_client.return_value.messages.create.return_value = mock_message
        
        # Test
        service = TwilioService()
        service.client = mock_client.return_value
        
        result = await service.send_sms(
            to="+14165551234",
            body="Test message"
        )
        
        assert result["success"] is True
        assert result["message_sid"] == "SM123456789"
        assert result["body"] == "Test message"
    
    @pytest.mark.asyncio
    async def test_handle_incoming_webhook(self):
        """Test processing incoming webhook"""
        service = TwilioService()
        
        webhook_data = {
            "From": "+14165551234",
            "To": "+14373203563",
            "Body": "I want to schedule a demo",
            "MessageSid": "SM123456789"
        }
        
        result = await service.handle_incoming_webhook(webhook_data)
        
        assert result["success"] is True
        assert result["from"] == "4165551234"  # +1 removed
        assert result["body"] == "I want to schedule a demo"
        assert result["message_sid"] == "SM123456789"
    
    def test_validate_webhook(self):
        """Test webhook signature validation"""
        service = TwilioService()
        
        # Note: In real tests, you'd use actual signature validation
        # This is a simplified test
        url = "https://example.com/webhook"
        params = {"From": "+14165551234"}
        signature = "fake_signature"
        
        # For now, just ensure the method exists and returns a boolean
        result = service.validate_webhook(url, params, signature)
        assert isinstance(result, bool)


class TestOpenAIService:
    """Test OpenAI integration"""
    
    @pytest.mark.asyncio
    @patch('app.integrations.openai.AsyncOpenAI')
    async def test_generate_smart_reply(self, mock_openai):
        """Test smart reply generation"""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [
            Mock(message=Mock(content="Thanks for your interest! I'd be happy to schedule a demo. Are you available tomorrow at 2 PM?"))
        ]
        mock_response.usage = Mock(
            prompt_tokens=100,
            completion_tokens=20,
            total_tokens=120
        )
        
        mock_openai.return_value.chat.completions.create = AsyncMock(return_value=mock_response)
        
        # Test data
        lead = Lead(
            name="John Doe",
            industry="Technology",
            lead_company="Tech Corp"
        )
        
        messages = [
            Message(
                direction=MessageDirection.INBOUND,
                content="I'm interested in your product",
                created_at=datetime.utcnow()
            )
        ]
        
        company_config = {
            "ai_config": {
                "temperature": 0.7,
                "tone": "friendly and professional"
            }
        }
        
        # Test
        service = OpenAIService()
        service.client = mock_openai.return_value
        
        result = await service.generate_smart_reply(
            lead=lead,
            conversation_history=messages,
            company_config=company_config,
            latest_message="Can we schedule a demo?"
        )
        
        assert result["success"] is True
        assert "demo" in result["reply"].lower()
        assert result["usage"]["total_tokens"] == 120
    
    @pytest.mark.asyncio
    @patch('app.integrations.openai.AsyncOpenAI')
    async def test_analyze_sentiment_and_intent(self, mock_openai):
        """Test sentiment and intent analysis"""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [
            Mock(message=Mock(content='''{
                "sentiment": "positive",
                "intent": "schedule_meeting",
                "urgency": "high",
                "datetime": "2025-01-15T14:00:00",
                "topics": ["demo", "product features"]
            }'''))
        ]
        
        mock_openai.return_value.chat.completions.create = AsyncMock(return_value=mock_response)
        
        # Test
        service = OpenAIService()
        service.client = mock_openai.return_value
        
        result = await service.analyze_sentiment_and_intent(
            "I'd really like to see a demo tomorrow at 2 PM if possible!"
        )
        
        assert result["success"] is True
        assert result["sentiment"] == "positive"
        assert result["intent"] == "schedule_meeting"
        assert result["urgency"] == "high"
        assert result["extracted_datetime"] == "2025-01-15T14:00:00"
    
    @pytest.mark.asyncio
    @patch('app.integrations.openai.AsyncOpenAI')
    async def test_generate_cold_outreach(self, mock_openai):
        """Test cold outreach message generation"""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [
            Mock(message=Mock(content="Hi Sarah! Noticed Tech Corp is growing fast. Curious how you're handling lead nurturing at scale?"))
        ]
        
        mock_openai.return_value.chat.completions.create = AsyncMock(return_value=mock_response)
        
        # Test data
        lead = Lead(
            name="Sarah Johnson",
            lead_company="Tech Corp",
            industry="Technology",
            interest="Lead automation"
        )
        
        company_config = {
            "ai_config": {"temperature": 0.7}
        }
        
        # Test
        service = OpenAIService()
        service.client = mock_openai.return_value
        
        result = await service.generate_cold_outreach(lead, company_config)
        
        assert "Sarah" in result
        assert len(result) < 160  # SMS length constraint