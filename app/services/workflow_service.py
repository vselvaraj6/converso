from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging

from app.models import (
    Lead, Message, Company, ConversationThread, CalendarEvent,
    LeadStatus, MessageDirection, User
)
from app.integrations import TwilioService, OpenAIService, VAPIService
from app.integrations.cal_com import CalComService
from app.core.config import settings
from app.tasks import process_new_lead

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
            # Search for the last 10 digits to match most formats
            search_phone = phone[-10:]
            result = await self.db.execute(
                select(Lead).where(Lead.phone.like(f"%{search_phone}%"))
            )
            lead = result.scalar_one_or_none()
            
            if not lead:
                logger.warning(f"No lead found for phone: {phone}")
                return {"success": False, "error": "Lead not found"}
            
            # 3. Get company configuration
            company = await self.db.get(Company, lead.company_id)
            
            # 4. Create/get conversation thread
            thread = await self._get_or_create_thread(lead.id, "sms")
            
            # 5. Store inbound message
            inbound_msg = Message(
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
            
            # 8. Generate smart reply
            reply_data = await self.openai.generate_smart_reply(
                lead, messages, {"name": company.name, "ai_config": company.ai_config}, message_body
            )
            
            if not reply_data["success"]:
                logger.error(f"OpenAI generation failed for lead {lead.id}: {reply_data.get('error')}. Using fallback.")
                reply_text = "Thanks for your message! Our team will get back to you soon."
            else:
                reply_text = reply_data["reply"]
            
            # 9. Check for calendar booking intent — send Cal.com booking link
            # Be robust: check analysis intent OR if the AI reply mentions scheduling
            is_scheduling = analysis.get("intent") == "schedule_meeting"
            if not is_scheduling and reply_data["success"]:
                reply_lower = reply_text.lower()
                if any(kw in reply_lower for kw in ["invite", "meeting", "call", "schedule", "calendar"]):
                    is_scheduling = True
                    logger.info(f"Detected scheduling intent from AI reply keywords for lead {lead.id}")

            if is_scheduling:
                booking_result = await self._handle_calendar_booking(
                    lead, company, requested_time=analysis.get("extracted_datetime")
                )
                if booking_result.get("booking_url"):
                    reply_text = booking_result["confirmation_message"]
            
            # 10. Send reply
            send_result = await self.twilio.send_sms(
                to=f"+1{phone}",
                body=reply_text
            )
            
            # 11. Store outbound message
            if send_result["success"]:
                outbound_msg = Message(
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
            
            # Update status based on intent
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
                "message_count": len(messages) + 2  # +2 for new in/out messages
            }
            
            # 14. Commit all changes
            await self.db.commit()
            
            return {
                "success": True,
                "lead_id": str(lead.id),
                "reply_sent": reply_text,
                "analysis": analysis
            }
            
        except Exception as e:
            logger.error(f"Inbound message processing error: {e}")
            await self.db.rollback()
            return {"success": False, "error": str(e)}
    
    async def process_outbound_campaign(self) -> Dict:
        """Process scheduled outbound messages"""
        try:
            processed = 0
            errors = 0
            
            # Get leads to contact
            leads = await self._get_leads_for_outbound()
            
            for lead in leads:
                try:
                    # Decide channel based on attempts and response
                    should_call = await self._should_use_voice(lead)
                    
                    if should_call:
                        # Initiate voice call
                        result = await self._initiate_voice_call(lead)
                    else:
                        # Send SMS
                        result = await self._send_outbound_sms(lead)
                    
                    if result["success"]:
                        processed += 1
                    else:
                        errors += 1
                        
                except Exception as e:
                    logger.error(f"Error processing lead {lead.id}: {e}")
                    errors += 1
            
            await self.db.commit()
            
            return {
                "success": True,
                "processed": processed,
                "errors": errors,
                "total": len(leads)
            }
            
        except Exception as e:
            logger.error(f"Outbound campaign error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _get_or_create_thread(self, lead_id: str, channel: str) -> ConversationThread:
        """Get or create conversation thread"""
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
            thread = ConversationThread(
                lead_id=lead_id,
                channel=channel,
                is_active=True,
                context={},
                created_at=datetime.utcnow()
            )
            self.db.add(thread)
            await self.db.flush()
        
        return thread
    
    async def _get_conversation_history(
        self, 
        lead_id: str,
        limit: int = 10
    ) -> List[Message]:
        """Get recent conversation history"""
        result = await self.db.execute(
            select(Message)
            .where(Message.lead_id == lead_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        return list(reversed(messages))  # Return in chronological order
    
    async def _handle_calendar_booking(self, lead: Lead, company: Company, requested_time: Optional[str] = None) -> Dict:
        """
        Return the company's Cal.com round-robin booking URL or specific slots.
        """
        booking_url = getattr(company, "cal_booking_url", None)
        event_type_id = getattr(company, "cal_event_type_id", None)
        
        if not booking_url:
            return {
                "booking_url": None,
                "confirmation_message": "I'll have someone reach out to find a time that works for you.",
            }

        first_name = lead.name.split()[0] if lead.name else "there"
        
        # If we have an event type ID, try to get actual available slots
        slots_text = ""
        if event_type_id:
            try:
                # Look for slots in the next 3 days
                start_search = datetime.utcnow().isoformat() + "Z"
                end_search = (datetime.utcnow() + timedelta(days=3)).isoformat() + "Z"
                slots = await self.calendar.get_available_slots(event_type_id, start_search, end_search)
                
                if slots:
                    # Take first 3 slots and format them nicely
                    formatted_slots = []
                    for slot in slots[:3]:
                        dt = datetime.fromisoformat(slot["time"].replace("Z", "+00:00"))
                        formatted_slots.append(dt.strftime("%A, %b %d at %I:%M %p"))
                    
                    slots_text = "\n\nAvailable times:\n- " + "\n- ".join(formatted_slots)
            except Exception as e:
                logger.error(f"Error fetching slots for scheduling response: {e}")

        return {
            "booking_url": booking_url,
            "confirmation_message": (
                f"Great, {first_name}! I can certainly help with that.{slots_text}\n\n"
                f"You can also pick any other time that works for you here: {booking_url}"
            ),
        }
    
    async def _get_leads_for_outbound(self) -> List[Lead]:
        """Get leads that need outbound contact"""
        # Get NEW leads or leads not contacted in 48 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=48)
        
        result = await self.db.execute(
            select(Lead).where(
                and_(
                    Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED]),
                    Lead.call_attempts < 3,
                    (Lead.last_contacted == None) | (Lead.last_contacted < cutoff_time)
                )
            ).limit(50)  # Process in batches
        )
        
        return result.scalars().all()
    
    async def _should_use_voice(self, lead: Lead) -> bool:
        """Determine if should use voice call instead of SMS"""
        # Use voice if:
        # 1. Lead is new (never contacted)
        # 2. No SMS response after 2 attempts
        # 3. Lead age < 30 days
        
        if not lead.last_contacted:
            return True
        
        lead_age = (datetime.utcnow() - lead.created_at).days
        if lead_age > 30:
            return False
        
        # Check for SMS responses
        result = await self.db.execute(
            select(Message).where(
                and_(
                    Message.lead_id == lead.id,
                    Message.direction == MessageDirection.INBOUND
                )
            ).limit(1)
        )
        has_responded = result.scalar_one_or_none() is not None
        
        return not has_responded and lead.call_attempts < 3
    
    async def _initiate_voice_call(self, lead: Lead) -> Dict:
        """Initiate voice call to lead"""
        try:
            company = await self.db.get(Company, lead.company_id)
            
            # Use specific assistant if provided, otherwise create dynamic one
            assistant_id = company.vapi_assistant_id
            
            if not assistant_id:
                # Create assistant prompt
                prompt = self.vapi.create_lead_assistant_prompt(
                    {"name": lead.name, "company": lead.lead_company, "industry": lead.industry, "interest": lead.interest},
                    {"name": company.name, "ai_config": company.ai_config}
                )
                
                # Create dynamic assistant
                assistant_result = await self.vapi.create_assistant(
                    name=f"{company.name} Sales Assistant",
                    system_prompt=prompt,
                    first_message=f"Hi {lead.name.split()[0]}, this is from {company.name}. Do you have a moment to chat about how we can help with {lead.interest or 'your needs'}?"
                )
                
                if not assistant_result["success"]:
                    return assistant_result
                assistant_id = assistant_result["assistant"]["id"]
            
            # Initiate call
            call_result = await self.vapi.create_phone_call(
                phone_number=f"+1{lead.phone}",
                assistant_id=assistant_id,
                variables={
                    "lead_name": lead.name,
                    "company": lead.lead_company,
                    "interest": lead.interest
                },
                webhook_url="https://converso.hawkly.app/api/webhooks/vapi/inbound"
            )
            
            if call_result["success"]:
                # Update lead
                lead.call_attempts += 1
                lead.last_call_attempt = datetime.utcnow()
                lead.last_contact_method = "voice"
                
                # Log the call attempt
                msg = Message(
                    lead_id=lead.id,
                    direction=MessageDirection.OUTBOUND,
                    channel="voice",
                    content=f"Outbound call initiated to {lead.name}",
                    vapi_call_id=call_result["call"]["id"],
                    status="initiated"
                )
                self.db.add(msg)
            
            return call_result
            
        except Exception as e:
            logger.error(f"Voice call initiation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_outbound_sms(self, lead: Lead) -> Dict:
        """Send outbound SMS to lead"""
        try:
            company = await self.db.get(Company, lead.company_id)
            
            # Get message history
            messages = await self._get_conversation_history(lead.id, limit=5)
            
            if messages:
                # Generate smart follow-up
                reply_data = await self.openai.generate_smart_reply(
                    lead, messages, {"name": company.name, "ai_config": company.ai_config}, 
                    "Generate a follow-up message"
                )
                message_body = reply_data.get("reply", "Hi! Just following up on my previous message. Are you still interested?")
            else:
                # Generate cold outreach
                message_body = await self.openai.generate_cold_outreach(
                    lead, {"name": company.name, "ai_config": company.ai_config}
                )
            
            # Send SMS
            send_result = await self.twilio.send_sms(
                to=f"+1{lead.phone}",
                body=message_body,
                from_=company.twilio_phone_number or settings.twilio_phone_number
            )
            
            if send_result["success"]:
                # Create thread if needed
                thread = await self._get_or_create_thread(lead.id, "sms")
                
                # Store message
                msg = Message(
                    lead_id=lead.id,
                    thread_id=thread.id,
                    direction=MessageDirection.OUTBOUND,
                    channel="sms",
                    content=message_body,
                    twilio_message_sid=send_result.get("message_sid"),
                    status="sent"
                )
                self.db.add(msg)
                
                # Update lead
                lead.last_contacted = datetime.utcnow()
                lead.last_contact_method = "sms"
                if lead.status == LeadStatus.NEW:
                    lead.status = LeadStatus.CONTACTED
            
            return send_result
            
        except Exception as e:
            logger.error(f"Outbound SMS error: {e}")
            return {"success": False, "error": str(e)}
    
    async def process_voice_call_ended(
        self,
        phone: str,
        call_id: str,
        duration: int,
        transcript: str,
        recording_url: Optional[str] = None
    ) -> Dict:
        """
        Process ended voice call data from VAPI webhook.
        
        Args:
            phone: Phone number of the lead
            call_id: VAPI call identifier
            duration: Call duration in seconds
            transcript: Call transcript
            recording_url: Optional recording URL
            
        Returns:
            Dict with processing result
        """
        try:
            # Normalize phone for searching
            clean_phone = ''.join(filter(str.isdigit, phone))
            if clean_phone.startswith('1') and len(clean_phone) > 10:
                clean_phone = clean_phone[1:]
            search_phone = clean_phone[-10:]

            # Find lead by phone
            result = await self.db.execute(
                select(Lead).where(Lead.phone.like(f"%{search_phone}%"))
            )
            lead = result.scalar_one_or_none()
            
            if not lead:
                logger.warning(f"No lead found for voice call from {phone}")
                return {"success": False, "error": "Lead not found"}
            
            # Store voice message record
            voice_msg = Message(
                lead_id=lead.id,
                direction=MessageDirection.INBOUND,
                channel="voice",
                content=f"Voice call transcript: {transcript[:500]}...",  # Store first 500 chars
                transcript=transcript,  # Full transcript
                recording_url=recording_url,
                duration_seconds=str(duration),
                vapi_call_id=call_id,
                status="completed"
            )
            self.db.add(voice_msg)
            
            # Analyze call transcript for sentiment and intent
            if transcript:
                analysis = await self.openai.analyze_sentiment_and_intent(
                    transcript,
                    {"lead_name": lead.name, "call_duration": duration}
                )
                
                # Update lead based on analysis
                lead.sentiment_score = {
                    **lead.sentiment_score,
                    "latest": analysis.get("sentiment", "neutral"),
                    "intent": analysis.get("intent", "other"),
                    "from_call": True,
                    "call_duration": duration
                }
                
                # Update lead status based on call outcome
                if analysis.get("intent") == "schedule_meeting":
                    lead.status = LeadStatus.QUALIFIED
                elif analysis.get("intent") == "not_interested":
                    lead.status = LeadStatus.LOST
            
            # Update lead contact info
            lead.last_contacted = datetime.utcnow()
            lead.last_contact_method = "voice"
            
            await self.db.commit()
            
            logger.info(f"Processed voice call for lead {lead.id}: Duration {duration}s")
            
            return {
                "success": True,
                "lead_id": str(lead.id),
                "duration": duration,
                "analysis": analysis if transcript else None
            }
            
        except Exception as e:
            logger.error(f"Voice call processing error: {e}")
            await self.db.rollback()
            return {"success": False, "error": str(e)}