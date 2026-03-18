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
        phone_number_id: Optional[str] = None,
        variables: Optional[Dict] = None,
        webhook_url: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> Dict:
        """Initiate an outbound phone call"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "assistantId": assistant_id,
                    "customer": {"number": phone_number},
                }

                if phone_number_id:
                    payload["phoneNumberId"] = phone_number_id

                overrides: Dict = {}
                if variables:
                    overrides["variableValues"] = variables
                if system_prompt:
                    overrides["model"] = {
                        "provider": "openai",
                        "model": "gpt-4o-mini",
                        "systemPrompt": system_prompt,
                    }
                if webhook_url:
                    overrides["serverUrl"] = webhook_url
                if overrides:
                    payload["assistantOverrides"] = overrides

                response = await client.post(
                    f"{self.base_url}/call",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0,
                )
                
                if response.status_code == 201:
                    return {
                        "success": True,
                        "call": response.json()
                    }
                else:
                    error_detail = response.text
                    logger.error(f"VAPI call creation error (Status {response.status_code}): {error_detail}")
                    return {
                        "success": False,
                        "error": error_detail,
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
        voice: str = "21m00Tcm4TlvDq8ikWAM",
        model: str = "gpt-4o-mini",
        first_message: Optional[str] = None
    ) -> Dict:
        """Create a new VAPI assistant"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "name": name,
                    "model": {
                        "provider": "openai",
                        "model": model,
                        "temperature": 0.7,
                        "systemPrompt": system_prompt,
                    },
                    "voice": {
                        "provider": "11labs",
                        "voiceId": voice,
                    },
                }

                if first_message:
                    payload["firstMessage"] = first_message

                response = await client.post(
                    f"{self.base_url}/assistant",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0,
                )
                
                if response.status_code in (200, 201):
                    return {
                        "success": True,
                        "assistant": response.json()
                    }
                else:
                    error_detail = response.text
                    logger.error(f"VAPI create assistant error (Status {response.status_code}): {error_detail}")
                    return {
                        "success": False,
                        "error": error_detail
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
    
    def create_lead_assistant_prompt(
        self,
        lead_data: Dict,
        company_config: Dict,
        sms_context: Optional[str] = None,
    ) -> str:
        """Build a natural, conversational voice call system prompt."""
        ai_config = company_config.get("ai_config", {})
        tone = ai_config.get("tone", "friendly and professional")
        industry_lingo = ai_config.get("industry_lingo", "").strip()
        company_memory = ai_config.get("company_memory", "").strip()
        company_name = company_config.get("name", "our company")

        lead_name = lead_data.get("name", "")
        first_name = lead_name.strip().split()[0] if lead_name and lead_name.strip() else "there"
        lead_company = lead_data.get("company") or "their company"
        lead_industry = lead_data.get("industry") or "business"
        lead_interest = lead_data.get("interest") or "our services"

        parts = [
            f"You are a {tone} sales representative for {company_name}.",
            f"You are speaking with {lead_name or 'a potential customer'} "
            f"from {lead_company} ({lead_industry} industry).",
            f"Their stated interest: {lead_interest}.",
            "",
        ]

        if company_memory:
            parts += [
                "ABOUT OUR COMPANY:",
                company_memory,
                "",
            ]

        if industry_lingo:
            parts += [
                "RELEVANT INDUSTRY CONTEXT:",
                industry_lingo,
                "",
            ]

        if sms_context:
            parts += [
                "PRIOR SMS CONVERSATION SUMMARY:",
                sms_context,
                "",
                f"You already know {first_name} from your SMS exchange. "
                "Do not re-introduce the company. "
                "Acknowledge the prior conversation naturally and pick up from there.",
                "",
            ]
        else:
            parts += [
                "This is your first contact with this lead.",
                "",
            ]

        parts += [
            "CALL STYLE:",
            "- Sound like a real person having a genuine conversation, not a script reader.",
            "- Speak in short, natural sentences. Use pauses. Let them finish talking.",
            f"- Use {first_name}'s name occasionally — once or twice, not constantly.",
            "- If they ask a question, answer it directly before moving on.",
            "- Mirror their energy: if they're brief, be brief; if they're chatty, engage more.",
            "- Avoid filler phrases like 'Absolutely!', 'Great question!', 'Of course!'.",
            "",
            "YOUR OBJECTIVES (in order):",
            "1. Confirm you have a moment to talk (30 seconds).",
            "2. Briefly remind them of the context (what they were interested in).",
            "3. Ask one open question to understand their current situation.",
            "4. If they're a good fit, suggest a short follow-up meeting with a specialist.",
            "5. If not interested, thank them sincerely and end the call.",
            "",
            "GUARDRAILS:",
            "- Never quote pricing. Say a specialist will follow up with details.",
            "- If they ask to be removed from outreach, confirm it clearly and end the call.",
            "- Keep the call under 5 minutes unless the lead is highly engaged.",
            "- Do not make promises you cannot keep.",
        ]

        return "\n".join(parts)