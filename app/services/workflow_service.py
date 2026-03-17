from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
import logging

from app.models import (
    Lead, Message, Company, ConversationThread, CalendarEvent,
    LeadStatus, MessageDirection, User
)
from app.integrations import TwilioService, OpenAIService, VAPIService
from app.integrations.cal_com import CalComService
from app.core.config import settings

logger = logging.getLogger(__name__)


class WorkflowService:
    """Main workflow orchestration service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.twilio = TwilioService()
        self.openai = OpenAIService()
        self.calendar = CalComService()
        self.vapi = VAPIService()
    
    async def process_inbound_message(self, webhook_data: Dict) -> Dict:
        """Process incoming SMS message - complete workflow"""
        try:
            # 1. Parse webhook data
            raw_phone = webhook_data.get("from", "")
            # Normalize phone: remove +1 and any non-digits
            phone = ''.join(filter(str.isdigit, raw_phone))
            if phone.startswith('1') and len(phone) > 10:
                phone = phone[1:]
            
            message_body = webhook_data.get("body", "")
            message_sid = webhook_data.get("message_sid", "")
            
            # 2. Find lead by phone - use a more robust matching
            search_phone = phone[-10:]
            result = await self.db.execute(
                select(Lead).where(Lead.phone.like(f"%{search_phone}%")).order_by(Lead.created_at.desc())
            )
            lead = result.scalars().first()
            
            if not lead:
                logger.warning(f"No lead found for phone: {phone}")
                return {"success": False, "error": "Lead not found"}
            
            # 3. Get company and agent info
            company = await self.db.get(Company, lead.company_id)
            agent_name = "your representative"
            if lead.assigned_agent_id:
                agent = await self.db.get(User, lead.assigned_agent_id)
                if agent:
                    agent_name = agent.name
            
            # 4. Create/get conversation thread
            thread = await self._get_or_create_thread(lead.id, "sms")
            
            # 5. Store inbound message
            inbound_msg = Message(
                company_id=lead.company_id,
                lead_id=lead.id,
                thread_id=thread.id,
                direction=MessageDirection.INBOUND,
                channel="sms",
                content=message_body,
                twilio_message_sid=message_sid,
                created_at=datetime.utcnow()
            )
            self.db.add(inbound_msg)
            
            # 6. Get conversation history
            messages = await self._get_conversation_history(lead.id, limit=10)
            
            # 7. Analyze sentiment and intent
            analysis = await self.openai.analyze_sentiment_and_intent(
                message_body,
                {"lead_name": lead.name, "company": lead.lead_company}
            )
            
            # 8. Generate smart reply with personalization
            reply_data = await self.openai.generate_smart_reply(
                lead, 
                messages, 
                {"name": company.name, "ai_config": company.ai_config}, 
                message_body,
                agent_name=agent_name,
                company_name=company.name
            )
            
            if not reply_data["success"]:
                logger.error(f"OpenAI generation failed for lead {lead.id}: {reply_data.get('error')}. Using fallback.")
                reply_text = f"Hi {lead.name.split()[0]}, this is {agent_name} from {company.name}. Thanks for your message! Our team will get back to you soon."
            else:
                reply_text = reply_data["reply"]
            
            # 9. Check for call or booking intent
            is_requesting_call = analysis.get("intent") == "request_call"
            is_scheduling = analysis.get("intent") == "schedule_meeting"
            
            # Aggressive keyword-based override for immediate calls
            body_lower = message_body.lower()
            call_keywords = ["call me", "talk now", "can we talk", "on the phone", "phone call", "call now"]
            if any(kw in body_lower for kw in call_keywords):
                future_keywords = ["later", "tomorrow", "next week", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "at ", "pm", "am"]
                if not any(fw in body_lower for fw in future_keywords):
                    logger.info(f"Keyword override triggered for lead {lead.id}: {message_body}")
                    is_requesting_call = True
                    is_scheduling = False
            
            logger.info(f"Lead {lead.id} interaction: intent={analysis.get('intent')}, is_requesting_call={is_requesting_call}, is_scheduling={is_scheduling}")

            if is_requesting_call:
                # Generate summary for Vapi
                summary = await self.openai.summarize_conversation(messages + [inbound_msg])
                
                # Initiate voice call
                # Fallback to provided ID if setting is empty
                vapi_phone_id = settings.vapi_phone_number_id or "979910e0-0199-49f3-b5c2-41abd1328378"
                call_result = await self._initiate_voice_call(
                    lead, 
                    overrides={
                        "variableValues": {"sms_context": summary},
                        "phoneNumberId": vapi_phone_id
                    }
                )
                
                if call_result["success"]:
                    reply_text = f"Absolutely, {lead.name.split()[0]}! I'm calling you now to discuss this further."
                else:
                    reply_text = "I'd love to jump on a call. Let me have someone reach out to you shortly, or feel free to suggest a time that works for you!"

            elif not is_scheduling and reply_data["success"]:
                reply_lower = reply_text.lower()
                if any(kw in reply_lower for kw in ["invite", "meeting", "call", "schedule", "calendar"]):
                    is_scheduling = True

            if is_scheduling:
                booking_result = await self._handle_calendar_booking(
                    lead, company, requested_time=analysis.get("extracted_datetime")
                )
                if booking_result.get("booked"):
                    # Use the success message directly
                    reply_text = booking_result['confirmation_message']
                elif "confirmation_message" in booking_result:
                    # Append slots/ask for time
                    reply_text = f"{reply_text}\n\n{booking_result['confirmation_message']}"
            
            # 10. Send reply
            send_result = await self.twilio.send_sms(
                to=lead.phone,
                body=reply_text,
                from_=company.twilio_phone_number or settings.twilio_phone_number
            )
            
            # 11. Store outbound message
            if send_result["success"]:
                outbound_msg = Message(
                    company_id=lead.company_id,
                    lead_id=lead.id,
                    thread_id=thread.id,
                    direction=MessageDirection.OUTBOUND,
                    channel="sms",
                    content=reply_text,
                    twilio_message_sid=send_result.get("message_sid"),
                    ai_metadata={
                        "sentiment": analysis.get("sentiment"),
                        "intent": analysis.get("intent"),
                        "urgency": analysis.get("urgency")
                    },
                    created_at=datetime.utcnow()
                )
                self.db.add(outbound_msg)
            
            # 12. Update lead status and metadata
            lead.last_contacted = datetime.utcnow()
            lead.last_contact_method = "sms"
            lead.sentiment_score = {
                "latest": analysis.get("sentiment", "neutral"),
                "intent": analysis.get("intent", "other"),
                "urgency": analysis.get("urgency", "medium"),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if analysis.get("intent") == "schedule_meeting":
                lead.status = LeadStatus.QUALIFIED
            elif analysis.get("intent") == "not_interested":
                lead.status = LeadStatus.LOST
            elif lead.status == LeadStatus.NEW:
                lead.status = LeadStatus.CONTACTED
            
            # 13. Update thread context
            thread.last_message_at = datetime.utcnow()
            thread.context = {
                **thread.context,
                "latest_sentiment": analysis.get("sentiment"),
                "latest_intent": analysis.get("intent"),
                "message_count": len(messages) + 2
            }
            
            await self.db.commit()
            return {"success": True, "lead_id": str(lead.id), "reply_sent": reply_text, "analysis": analysis}
            
        except Exception as e:
            logger.error(f"Inbound message processing error: {e}")
            await self.db.rollback()
            return {"success": False, "error": str(e)}
    
    async def process_outbound_campaign(self) -> Dict:
        """Process scheduled outbound messages with lead-specific intervals"""
        try:
            processed = 0
            errors = 0
            leads = await self._get_leads_for_outbound()
            
            for lead in leads:
                try:
                    should_call = await self._should_use_voice(lead)
                    if should_call:
                        result = await self._initiate_voice_call(lead)
                    else:
                        result = await self._send_outbound_sms(lead)
                    
                    if result["success"]:
                        processed += 1
                    else:
                        errors += 1
                except Exception as e:
                    logger.error(f"Error processing lead {lead.id}: {e}", exc_info=True)
                    errors += 1
            
            await self.db.commit()
            return {"success": True, "processed": processed, "errors": errors, "total": len(leads)}
        except Exception as e:
            logger.error(f"Outbound campaign error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _get_or_create_thread(self, lead_id: str, channel: str) -> ConversationThread:
        result = await self.db.execute(
            select(ConversationThread).where(
                and_(
                    ConversationThread.lead_id == lead_id,
                    ConversationThread.channel == channel,
                    ConversationThread.is_active == True
                )
            )
        )
        thread = result.scalar_one_or_none()
        if not thread:
            thread = ConversationThread(lead_id=lead_id, channel=channel, is_active=True, context={}, created_at=datetime.utcnow())
            self.db.add(thread)
            await self.db.flush()
        return thread
    
    async def _get_conversation_history(self, lead_id: str, limit: int = 10) -> List[Message]:
        result = await self.db.execute(select(Message).where(Message.lead_id == lead_id).order_by(Message.created_at.desc()).limit(limit))
        messages = result.scalars().all()
        return list(reversed(messages))
    
    async def send_manual_sms(self, lead_id: UUID, content: str) -> Dict:
        """Send a manual SMS to a lead and record it"""
        try:
            lead = await self.db.get(Lead, lead_id)
            if not lead:
                return {"success": False, "error": "Lead not found"}
            
            # Send via Twilio
            send_result = await self.twilio.send_sms(
                to=lead.phone,
                body=content
            )
            
            if send_result["success"]:
                # Record in database
                thread = await self._get_or_create_thread(lead.id, "sms")
                msg = Message(
                    company_id=lead.company_id,
                    lead_id=lead.id,
                    thread_id=thread.id,
                    direction=MessageDirection.OUTBOUND,
                    channel="sms",
                    content=content,
                    twilio_message_sid=send_result.get("message_sid"),
                    status="sent",
                    created_at=datetime.utcnow()
                )
                self.db.add(msg)
                
                # Update lead activity
                lead.last_contacted = datetime.utcnow()
                lead.last_contact_method = "sms"
                if lead.status == LeadStatus.NEW:
                    lead.status = LeadStatus.CONTACTED
                
                await self.db.commit()
                return {"success": True, "message_id": str(msg.id)}
            else:
                return {"success": False, "error": send_result.get("error")}
                
        except Exception as e:
            logger.error(f"Manual SMS error: {e}")
            await self.db.rollback()
            return {"success": False, "error": str(e)}

    async def _handle_calendar_booking(self, lead: Lead, company: Company, requested_time: Optional[str] = None) -> Dict:
        """
        Automated booking flow: If time is provided, book it. Else, suggest times.
        """
        # 1. Determine which calendar settings to use (Master Orchestrator Pattern)
        agent = None
        if lead.assigned_agent_id:
            agent = await self.db.get(User, lead.assigned_agent_id)
        
        # Determine booking settings
        if agent and agent.manual_calendar_url:
            booking_url = agent.manual_calendar_url
            event_type_id = None
        elif company.cal_booking_url:
            booking_url = company.cal_booking_url
            event_type_id = company.cal_event_type_id
        else:
            booking_url = None
            event_type_id = None

        if not event_type_id:
            # Fallback if no internal event ID is configured for auto-booking
            return {
                "booking_url": booking_url,
                "confirmation_message": f"I'd love to get that scheduled. What time works best for you tomorrow or later this week?"
            }

        first_name = lead.name.split()[0] if lead.name else "there"

        # 2. If a specific time was extracted, try to book it directly
        if requested_time:
            try:
                # Try to create the booking
                booking = await self.calendar.create_booking(
                    event_type_id=event_type_id,
                    start_time=requested_time,
                    attendee_name=lead.name,
                    attendee_email=lead.email,
                    attendee_phone=lead.phone
                )
                
                if booking.get("success"):
                    dt = datetime.fromisoformat(requested_time.replace("Z", "+00:00")).replace(tzinfo=None)
                    time_str = dt.strftime("%A, %b %d at %I:%M %p")
                    return {
                        "booked": True,
                        "confirmation_message": f"Perfect, {first_name}! I've gone ahead and booked that for you for {time_str}. You'll receive a confirmation email with the calendar invite shortly."
                    }
            except Exception as e:
                logger.error(f"Auto-booking failed for lead {lead.id}: {e}")

        # 3. Fallback: Propose available slots
        slots_text = ""
        try:
            start_search = datetime.utcnow().isoformat() + "Z"
            end_search = (datetime.utcnow() + timedelta(days=3)).isoformat() + "Z"
            slots = await self.calendar.get_available_slots(event_type_id, start_search, end_search)
            
            if slots:
                formatted_slots = []
                for slot in slots[:3]:
                    dt = datetime.fromisoformat(slot["time"].replace("Z", "+00:00")).replace(tzinfo=None)
                    formatted_slots.append(dt.strftime("%A, %b %d at %I:%M %p"))
                slots_text = "\n\nAvailable times:\n- " + "\n- ".join(formatted_slots)
        except Exception as e:
            logger.error(f"Error fetching slots: {e}")

        return {
            "booked": False,
            "confirmation_message": f"I'd love to help with that. {slots_text}\n\nDo any of those times work for you? Or feel free to suggest another time!"
        }
    
    async def _get_leads_for_outbound(self) -> List[Lead]:
        """Get leads based on per-lead nudge intervals"""
        # Find leads past their specific nudge_interval_days
        query = select(Lead).where(
                and_(
                    Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED]),
                    Lead.call_attempts < 3,
                    (Lead.last_contacted == None) | 
                    (Lead.last_contacted + text("INTERVAL '1 day' * nudge_interval_days") < func.now())
                )
            ).limit(50)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def _should_use_voice(self, lead: Lead) -> bool:
        if not lead.last_contacted: return False # SMS first for new leads
        lead_age = (datetime.utcnow() - lead.created_at).days
        if lead_age > 30: return False
        result = await self.db.execute(select(Message).where(and_(Message.lead_id == lead.id, Message.direction == MessageDirection.INBOUND)).limit(1))
        return result.scalar_one_or_none() is None and lead.call_attempts < 3
    
    async def _initiate_voice_call(self, lead: Lead, overrides: Optional[Dict] = None) -> Dict:
        try:
            company = await self.db.get(Company, lead.company_id)
            agent_name = "your representative"
            if lead.assigned_agent_id:
                agent = await self.db.get(User, lead.assigned_agent_id)
                if agent: agent_name = agent.name

            assistant_id = company.vapi_assistant_id
            if not assistant_id:
                prompt = self.vapi.create_lead_assistant_prompt(
                    {"name": lead.name, "company": lead.lead_company, "industry": lead.industry, "interest": lead.interest},
                    {"name": company.name, "ai_config": company.ai_config}
                )
                assistant_result = await self.vapi.create_assistant(
                    name=f"{company.name} Sales Assistant",
                    system_prompt=f"Your name is {agent_name}. {prompt}",
                    first_message=f"Hi {lead.name.split()[0]}, this is {agent_name} from {company.name}. Do you have a moment to chat?"
                )
                if not assistant_result["success"]: return assistant_result
                assistant_id = assistant_result["assistant"]["id"]
            
            call_result = await self.vapi.create_phone_call(
                phone_number=lead.phone,
                assistant_id=assistant_id,
                phone_number_id=overrides.get("phoneNumberId") if overrides else settings.vapi_phone_number_id,
                variables=overrides.get("variableValues") if overrides else None,
                webhook_url=f"{settings.app_url}/api/webhooks/vapi/inbound"
            )
            if call_result["success"]:
                lead.call_attempts += 1
                lead.last_call_attempt = datetime.utcnow()
                lead.last_contacted = datetime.utcnow()
                lead.last_contact_method = "voice"
                self.db.add(Message(
                    company_id=lead.company_id,
                    lead_id=lead.id, 
                    direction=MessageDirection.OUTBOUND, 
                    channel="voice", 
                    content=f"Call initiated by {agent_name}", 
                    vapi_call_id=call_result["call"]["id"]
                ))
            return call_result
        except Exception as e:
            logger.error(f"Voice call error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_outbound_sms(self, lead: Lead) -> Dict:
        try:
            company = await self.db.get(Company, lead.company_id)
            agent_name = "your representative"
            if lead.assigned_agent_id:
                agent = await self.db.get(User, lead.assigned_agent_id)
                if agent: agent_name = agent.name
            
            messages = await self._get_conversation_history(lead.id, limit=5)
            if messages:
                reply_data = await self.openai.generate_smart_reply(lead, messages, {"name": company.name, "ai_config": company.ai_config}, "Generate a follow-up nudge", agent_name=agent_name, company_name=company.name)
                message_body = reply_data.get("reply", f"Hi {lead.name.split()[0]}, this is {agent_name} from {company.name}. Just following up!")
            else:
                message_body = await self.openai.generate_cold_outreach(lead, {"name": company.name, "ai_config": company.ai_config}, agent_name=agent_name, company_name=company.name)
            
            send_result = await self.twilio.send_sms(to=lead.phone, body=message_body, from_=company.twilio_phone_number or settings.twilio_phone_number)
            if send_result["success"]:
                thread = await self._get_or_create_thread(lead.id, "sms")
                self.db.add(Message(
                    company_id=lead.company_id,
                    lead_id=lead.id, 
                    thread_id=thread.id, 
                    direction=MessageDirection.OUTBOUND, 
                    channel="sms", 
                    content=message_body, 
                    twilio_message_sid=send_result.get("message_sid")
                ))
                lead.last_contacted = datetime.utcnow()
                lead.last_contact_method = "sms"
                if lead.status == LeadStatus.NEW: lead.status = LeadStatus.CONTACTED
            return send_result
        except Exception as e:
            logger.error(f"Outbound SMS error: {e}")
            return {"success": False, "error": str(e)}

    async def process_voice_call_ended(self, phone: str, call_id: str, duration: int, transcript: str, recording_url: Optional[str] = None) -> Dict:
        try:
            clean_phone = ''.join(filter(str.isdigit, phone))
            if clean_phone.startswith('1') and len(clean_phone) > 10: clean_phone = clean_phone[1:]
            search_phone = clean_phone[-10:]
            result = await self.db.execute(select(Lead).where(Lead.phone.like(f"%{search_phone}%")))
            lead = result.scalar_one_or_none()
            if not lead: return {"success": False, "error": "Lead not found"}
            
            self.db.add(Message(
                company_id=lead.company_id,
                lead_id=lead.id, 
                direction=MessageDirection.INBOUND, 
                channel="voice", 
                content=f"Voice call: {transcript[:500]}...", 
                transcript=transcript, 
                recording_url=recording_url, 
                duration_seconds=str(duration), 
                vapi_call_id=call_id, 
                status="completed"
            ))
            if transcript:
                analysis = await self.openai.analyze_sentiment_and_intent(transcript, {"lead_name": lead.name, "call_duration": duration})
                lead.sentiment_score = {**lead.sentiment_score, "latest": analysis.get("sentiment", "neutral"), "intent": analysis.get("intent", "other")}
                if analysis.get("intent") == "schedule_meeting": lead.status = LeadStatus.QUALIFIED
                elif analysis.get("intent") == "not_interested": lead.status = LeadStatus.LOST
            
            lead.last_contacted = datetime.utcnow()
            lead.last_contact_method = "voice"
            await self.db.commit()
            return {"success": True, "lead_id": str(lead.id)}
        except Exception as e:
            logger.error(f"Voice call ended error: {e}")
            await self.db.rollback()
            return {"success": False, "error": str(e)}
