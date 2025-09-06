import httpx
import asyncio
from typing import Dict, Optional, List
from datetime import datetime
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class VAPIService:
    """VAPI (Voice AI) integration service"""
    
    def __init__(self):
        self.api_key = settings.vapi_api_key
        self.base_url = settings.vapi_base_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def create_phone_call(
        self,
        phone_number: str,
        assistant_id: str,
        variables: Optional[Dict] = None,
        webhook_url: Optional[str] = None
    ) -> Dict:
        """Initiate an outbound phone call"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "assistant_id": assistant_id,
                    "phone_number": phone_number,
                    "type": "outbound"
                }
                
                if variables:
                    payload["variables"] = variables
                
                if webhook_url:
                    payload["webhook_url"] = webhook_url
                
                response = await client.post(
                    f"{self.base_url}/calls",
                    json=payload,
                    headers=self.headers
                )
                
                if response.status_code == 201:
                    return {
                        "success": True,
                        "call": response.json()
                    }
                else:
                    return {
                        "success": False,
                        "error": response.text,
                        "status_code": response.status_code
                    }
        except Exception as e:
            logger.error(f"VAPI call creation error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_call(self, call_id: str) -> Dict:
        """Get call details"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calls/{call_id}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "call": response.json()
                    }
                else:
                    return {
                        "success": False,
                        "error": response.text
                    }
        except Exception as e:
            logger.error(f"VAPI get call error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def list_calls(
        self,
        limit: int = 100,
        phone_number: Optional[str] = None
    ) -> List[Dict]:
        """List calls with optional filtering"""
        try:
            params = {"limit": limit}
            if phone_number:
                params["phone_number"] = phone_number
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/calls",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    return response.json().get("calls", [])
                else:
                    logger.error(f"VAPI list calls error: {response.text}")
                    return []
        except Exception as e:
            logger.error(f"VAPI list calls error: {e}")
            return []
    
    async def create_assistant(
        self,
        name: str,
        system_prompt: str,
        voice: str = "jennifer",
        model: str = "gpt-3.5-turbo",
        first_message: Optional[str] = None
    ) -> Dict:
        """Create a new VAPI assistant"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "name": name,
                    "system_prompt": system_prompt,
                    "voice": voice,
                    "model": model,
                    "temperature": 0.7
                }
                
                if first_message:
                    payload["first_message"] = first_message
                
                response = await client.post(
                    f"{self.base_url}/assistants",
                    json=payload,
                    headers=self.headers
                )
                
                if response.status_code == 201:
                    return {
                        "success": True,
                        "assistant": response.json()
                    }
                else:
                    return {
                        "success": False,
                        "error": response.text
                    }
        except Exception as e:
            logger.error(f"VAPI create assistant error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_webhook(self, webhook_data: Dict) -> Dict:
        """Process VAPI webhook events"""
        try:
            event_type = webhook_data.get("type")
            call_id = webhook_data.get("call_id")
            
            if event_type == "call.started":
                return {
                    "success": True,
                    "action": "call_started",
                    "call_id": call_id,
                    "timestamp": datetime.utcnow()
                }
            
            elif event_type == "call.ended":
                duration = webhook_data.get("duration", 0)
                transcript = webhook_data.get("transcript", "")
                recording_url = webhook_data.get("recording_url")
                
                return {
                    "success": True,
                    "action": "call_ended",
                    "call_id": call_id,
                    "duration": duration,
                    "transcript": transcript,
                    "recording_url": recording_url,
                    "timestamp": datetime.utcnow()
                }
            
            elif event_type == "call.failed":
                error = webhook_data.get("error", "Unknown error")
                return {
                    "success": False,
                    "action": "call_failed",
                    "call_id": call_id,
                    "error": error,
                    "timestamp": datetime.utcnow()
                }
            
            else:
                return {
                    "success": True,
                    "action": "unknown_event",
                    "event_type": event_type,
                    "data": webhook_data
                }
                
        except Exception as e:
            logger.error(f"VAPI webhook processing error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def create_lead_assistant_prompt(self, lead_data: Dict, company_config: Dict) -> str:
        """Create a dynamic system prompt for lead calls"""
        tone = company_config.get("ai_config", {}).get("tone", "friendly and professional")
        
        prompt = f"""You are a {tone} sales assistant for {company_config.get('name', 'our company')}.
        
You are calling {lead_data.get('name', 'a potential customer')} from {lead_data.get('company', 'their company')}.
They are in the {lead_data.get('industry', 'business')} industry and have shown interest in {lead_data.get('interest', 'our services')}.

Your goals:
1. Introduce yourself briefly
2. Understand their needs and pain points
3. Qualify if they're a good fit
4. Try to schedule a meeting with a sales representative
5. Be respectful of their time

Important:
- Keep the conversation natural and conversational
- Don't share pricing information
- If they're not interested, thank them politely and end the call
- If they ask to be removed from the list, acknowledge and confirm
"""
        return prompt