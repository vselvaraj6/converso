from typing import Optional, List, Dict
from datetime import datetime
import asyncio
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class TwilioService:
    def __init__(self):
        self.client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        self.phone_number = settings.twilio_phone_number
    
    async def send_sms(self, to: str, body: str, from_: Optional[str] = None) -> Dict:
        """Send an SMS message"""
        try:
            # Run Twilio sync operation in thread pool
            loop = asyncio.get_event_loop()
            message = await loop.run_in_executor(
                None,
                self._send_sms_sync,
                to,
                body,
                from_ or self.phone_number
            )
            
            return {
                "success": True,
                "message_sid": message.sid,
                "to": message.to,
                "from": message.from_,
                "body": message.body,
                "status": message.status,
                "date_created": message.date_created,
                "date_updated": message.date_updated
            }
        except TwilioRestException as e:
            logger.error(f"Twilio SMS error: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_code": e.code
            }
    
    def _send_sms_sync(self, to: str, body: str, from_: str):
        """Synchronous method to send SMS"""
        return self.client.messages.create(
            body=body,
            from_=from_,
            to=to
        )
    
    async def fetch_message_history(
        self, 
        phone: str, 
        limit: int = 10,
        start_date: Optional[datetime] = None
    ) -> List[Dict]:
        """Fetch message history for a phone number"""
        try:
            loop = asyncio.get_event_loop()
            messages = await loop.run_in_executor(
                None,
                self._fetch_messages_sync,
                phone,
                limit,
                start_date
            )
            
            return [
                {
                    "sid": msg.sid,
                    "from": msg.from_,
                    "to": msg.to,
                    "body": msg.body,
                    "status": msg.status,
                    "direction": msg.direction,
                    "date_created": msg.date_created,
                    "date_sent": msg.date_sent
                }
                for msg in messages
            ]
        except TwilioRestException as e:
            logger.error(f"Twilio fetch history error: {e}")
            return []
    
    def _fetch_messages_sync(self, phone: str, limit: int, start_date: Optional[datetime]):
        """Synchronous method to fetch messages"""
        kwargs = {
            "limit": limit
        }
        
        # Add filters
        if start_date:
            kwargs["date_sent_after"] = start_date
        
        # Fetch both sent and received messages
        sent = list(self.client.messages.list(
            from_=self.phone_number,
            to=phone,
            **kwargs
        ))
        
        received = list(self.client.messages.list(
            from_=phone,
            to=self.phone_number,
            **kwargs
        ))
        
        # Combine and sort by date
        all_messages = sent + received
        return sorted(all_messages, key=lambda x: x.date_created, reverse=True)[:limit]
    
    async def handle_incoming_webhook(self, webhook_data: Dict) -> Dict:
        """Process incoming webhook from Twilio"""
        try:
            # Extract relevant data
            from_number = webhook_data.get("From", "").replace("+1", "")
            to_number = webhook_data.get("To", "")
            body = webhook_data.get("Body", "")
            message_sid = webhook_data.get("MessageSid", "")
            
            return {
                "success": True,
                "from": from_number,
                "to": to_number,
                "body": body,
                "message_sid": message_sid,
                "timestamp": datetime.utcnow()
            }
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def validate_webhook(self, url: str, params: Dict, signature: str) -> bool:
        """Validate Twilio webhook signature"""
        try:
            from twilio.request_validator import RequestValidator
            validator = RequestValidator(settings.twilio_auth_token)
            return validator.validate(url, params, signature)
        except Exception as e:
            logger.error(f"Webhook validation error: {e}")
            return False