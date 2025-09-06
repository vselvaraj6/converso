import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Company, Lead, Message, MessageDirection
from unittest.mock import patch, Mock


class TestWebhookAPI:
    """Test webhook endpoints"""
    
    def test_twilio_inbound_webhook(self, client: TestClient, twilio_webhook_data):
        """Test Twilio inbound webhook handling"""
        with patch('app.integrations.twilio.TwilioService.handle_incoming_webhook') as mock_handler:
            mock_handler.return_value = {
                "success": True,
                "from": "2899810562",
                "to": "+14373203563",
                "body": "I'd like to schedule a demo",
                "message_sid": "SM93bf458a682f063d263a2ce72745b9a5",
                "timestamp": "2025-01-09T10:00:00"
            }
            
            response = client.post(
                "/api/webhooks/twilio/inbound",
                data=twilio_webhook_data
            )
            
            assert response.status_code == 200
            assert response.json() == {"status": "received"}
    
    def test_vapi_inbound_webhook(self, client: TestClient):
        """Test VAPI inbound webhook handling"""
        vapi_data = {
            "event_type": "call.started",
            "call_id": "call_123",
            "from": "+14165551234",
            "to": "+14373203563"
        }
        
        response = client.post(
            "/api/webhooks/vapi/inbound",
            json=vapi_data
        )
        
        assert response.status_code == 200
        assert response.json() == {"status": "received"}


class TestLeadsAPI:
    """Test leads endpoints"""
    
    @pytest.mark.asyncio
    async def test_list_leads_empty(self, client: TestClient):
        """Test listing leads when database is empty"""
        response = client.get("/api/leads/")
        assert response.status_code == 200
        data = response.json()
        assert data["leads"] == []
        assert data["total"] == 0
    
    @pytest.mark.asyncio
    async def test_list_leads_with_data(
        self, 
        client: TestClient, 
        db_session: AsyncSession
    ):
        """Test listing leads with data"""
        # Create test data
        company = Company(name="Test Company")
        db_session.add(company)
        await db_session.commit()
        
        lead1 = Lead(
            company_id=company.id,
            name="John Doe",
            email="john@example.com",
            phone="+14165551234"
        )
        lead2 = Lead(
            company_id=company.id,
            name="Jane Smith",
            email="jane@example.com",
            phone="+14165555678"
        )
        db_session.add_all([lead1, lead2])
        await db_session.commit()
        
        # Test
        response = client.get("/api/leads/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["leads"]) == 2
    
    @pytest.mark.asyncio
    async def test_get_lead_by_id(
        self,
        client: TestClient,
        db_session: AsyncSession
    ):
        """Test getting a specific lead"""
        # Create test data
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
        
        # Test success
        response = client.get(f"/api/leads/{lead.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["email"] == "john@example.com"
        
        # Test not found
        response = client.get("/api/leads/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404


class TestMessagesAPI:
    """Test messages endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_lead_messages(
        self,
        client: TestClient,
        db_session: AsyncSession
    ):
        """Test getting messages for a lead"""
        # Create test data
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
        
        msg1 = Message(
            lead_id=lead.id,
            direction=MessageDirection.INBOUND,
            channel="sms",
            content="Hello, I'm interested"
        )
        msg2 = Message(
            lead_id=lead.id,
            direction=MessageDirection.OUTBOUND,
            channel="sms",
            content="Thanks for reaching out!"
        )
        db_session.add_all([msg1, msg2])
        await db_session.commit()
        
        # Test
        response = client.get(f"/api/messages/lead/{lead.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["messages"]) == 2
        
        # Verify message content
        messages = data["messages"]
        contents = [msg["content"] for msg in messages]
        assert "Hello, I'm interested" in contents
        assert "Thanks for reaching out!" in contents