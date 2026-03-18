from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
import logging
import pytz

from app.models import (
    Lead, Message, Company, ConversationThread, CalendarEvent,
    LeadStatus, MessageDirection, User
)
from app.integrations import TwilioService, OpenAIService, VAPIService
from app.integrations.cal_com import CalComService
from app.core.config import settings
from app.config.mortgage_campaign import get_campaign_message, is_mortgage_lead, MORTGAGE_TONE_GUIDE

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
            
            # 7. Analyze sentiment and intent (with recent conversation context)
            recent_context = [
                {"direction": m.direction.value, "content": m.content}
                for m in messages[-4:]
            ]
            analysis = await self.openai.analyze_sentiment_and_intent(
                message_body,
                {
                    "lead_name": lead.name,
                    "company": lead.lead_company,
                    "recent_conversation": recent_context,
                },
            )
            
            # 8. Generate smart reply with personalization
            reply_data = await self.openai.generate_smart_reply(
                lead,
                messages,
                {"name": company.name, "ai_config": company.ai_config},
                message_body,
                agent_name=agent_name,
                company_name=company.name,
                lead_status=lead.status.value,
                urgency=(lead.sentiment_score or {}).get("urgency", "medium"),
            )
            
            first_name = lead.name.strip().split()[0] if lead.name and lead.name.strip() else "there"

            if not reply_data["success"]:
                logger.error(f"OpenAI generation failed for lead {lead.id}: {reply_data.get('error')}. Using fallback.")
                reply_text = (
                    f"Hi {first_name}, this is {agent_name} from {company.name}. "
                    "Thanks for your message — we'll be in touch shortly!"
                )
            else:
                reply_text = reply_data["reply"]

            # 9. Check for call or booking intent (from LLM classification only)
            is_requesting_call = analysis.get("intent") == "request_call"
            is_scheduling = analysis.get("intent") == "schedule_meeting"

            # Keyword safety net: only escalate to call if LLM missed an obvious signal
            # AND the message contains no future-time words (which would mean schedule_meeting)
            body_lower = message_body.lower()
            explicit_call_phrases = ["call me now", "call me asap", "call me right now", "talk on the phone now"]
            future_time_words = ["tomorrow", "next week", "monday", "tuesday", "wednesday",
                                 "thursday", "friday", "saturday", "sunday", "at ", " pm", " am", "later"]
            if (
                not is_requesting_call
                and any(ph in body_lower for ph in explicit_call_phrases)
                and not any(fw in body_lower for fw in future_time_words)
            ):
                logger.info(f"Keyword safety-net override → request_call for lead {lead.id}: {message_body!r}")
                is_requesting_call = True
                is_scheduling = False

            logger.info(
                f"Lead {lead.id}: intent={analysis.get('intent')!r} "
                f"requesting_call={is_requesting_call} scheduling={is_scheduling}"
            )

            if is_requesting_call:
                summary = await self.openai.summarize_conversation(messages + [inbound_msg])
                vapi_phone_id = settings.vapi_phone_number_id or "979910e0-0199-49f3-b5c2-41abd1328378"
                call_result = await self._initiate_voice_call(
                    lead,
                    overrides={
                        "variableValues": {"sms_context": summary},
                        "phoneNumberId": vapi_phone_id,
                    },
                )
                if call_result["success"]:
                    reply_text = f"On it, {first_name}! Calling you now."
                else:
                    reply_text = (
                        "I'd love to chat — what time works best for you "
                        "tomorrow or later this week?"
                    )

            # Only trigger calendar booking when the LLM explicitly classified
            # this as schedule_meeting. Never infer it from the AI's reply text.
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
            lead.lead_score = self._compute_lead_score(lead)

            if analysis.get("intent") == "schedule_meeting":
                lead.status = LeadStatus.QUALIFIED
            elif analysis.get("intent") == "not_interested":
                lead.status = LeadStatus.LOST
                # Flag for human review: give agent a chance to intervene before lead is fully lost
                lead.needs_human_review = True
                logger.info(f"Lead {lead.id} flagged for human review (not_interested)")
            elif lead.status == LeadStatus.NEW:
                lead.status = LeadStatus.CONTACTED

            # Auto-escalate to human when lead is frustrated (negative + seeking help)
            if (
                analysis.get("sentiment") == "negative"
                and analysis.get("intent") in ("ask_question", "other")
                and not lead.needs_human_review
            ):
                lead.needs_human_review = True
                logger.info(f"Lead {lead.id} flagged for human review (negative sentiment + question)")
            
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
                    company = await self.db.get(Company, lead.company_id)
                    call_config = (company.call_config or {}) if company else {}
                    max_attempts = call_config.get("max_attempts", 3)

                    if lead.call_attempts >= max_attempts and not lead.sms_fallback_sent:
                        result = await self._send_sms_fallback(lead)
                    else:
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
    
    def _compute_lead_score(self, lead: Lead) -> int:
        score = 0

        status_scores = {
            LeadStatus.NEW: 10,
            LeadStatus.CONTACTED: 30,
            LeadStatus.QUALIFIED: 70,
            LeadStatus.CONVERTED: 100,
            LeadStatus.LOST: 0,
        }
        score += status_scores.get(lead.status, 10)

        s = lead.sentiment_score or {}
        sentiment_scores = {"positive": 20, "neutral": 0, "negative": -10}
        score += sentiment_scores.get(s.get("latest", "neutral"), 0)

        urgency_scores = {"high": 15, "medium": 5, "low": 0}
        score += urgency_scores.get(s.get("urgency", "medium"), 5)

        intent_scores = {
            "schedule_meeting": 20,
            "request_call": 15,
            "interested": 10,
            "not_interested": -20,
        }
        score += intent_scores.get(s.get("intent", "other"), 0)

        return max(0, min(100, score))

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
        """Get leads based on per-lead nudge intervals, plus call-exhausted leads needing SMS fallback"""
        # Active leads due for contact
        active_query = select(Lead).where(
                and_(
                    Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED]),
                    Lead.call_attempts < 10,  # generous cap; real check is per-company in _should_use_voice
                    Lead.sms_fallback_sent == False,
                    (Lead.last_contacted == None) |
                    (Lead.last_contacted + text("INTERVAL '1 day' * nudge_interval_days") < func.now())
                )
            ).limit(50)
        active_result = await self.db.execute(active_query)
        active_leads = list(active_result.scalars().all())

        # Call-exhausted leads that haven't received SMS fallback yet
        fallback_query = select(Lead).where(
            and_(
                Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED]),
                Lead.call_attempts >= 3,
                Lead.sms_fallback_sent == False,
            )
        ).limit(50)
        fallback_result = await self.db.execute(fallback_query)
        fallback_leads = list(fallback_result.scalars().all())

        # Merge, deduplicate by id
        seen = {l.id for l in active_leads}
        for lead in fallback_leads:
            if lead.id not in seen:
                active_leads.append(lead)
                seen.add(lead.id)
        return active_leads

    async def _should_use_voice(self, lead: Lead) -> bool:
        if not lead.last_contacted: return False  # SMS first for new leads
        lead_age = (datetime.utcnow() - lead.created_at).days
        if lead_age > 30: return False

        company = await self.db.get(Company, lead.company_id)
        call_config = (company.call_config or {}) if company else {}
        max_attempts = call_config.get("max_attempts", 3)
        hours_between = call_config.get("hours_between_attempts", 8)

        if lead.call_attempts >= max_attempts:
            return False
        if lead.last_call_attempt:
            elapsed = (datetime.utcnow() - lead.last_call_attempt).total_seconds() / 3600
            if elapsed < hours_between:
                return False

        result = await self.db.execute(
            select(Message).where(and_(
                Message.lead_id == lead.id,
                Message.direction == MessageDirection.INBOUND
            )).limit(1)
        )
        return result.scalar_one_or_none() is None
    
    async def _is_within_working_hours(self, lead: Lead) -> bool:
        """Check assigned agent's working hours (defaults to 9-17 company-local time)."""
        agent = None
        if lead.assigned_agent_id:
            agent = await self.db.get(User, lead.assigned_agent_id)

        wh = (agent.working_hours if agent else None) or {"start": 9, "end": 17}
        tz_name = wh.get("timezone", "America/New_York")
        try:
            tz = pytz.timezone(tz_name)
        except Exception:
            tz = pytz.timezone("America/New_York")

        local_hour = datetime.now(tz).hour
        return wh.get("start", 9) <= local_hour < wh.get("end", 17)

    async def _send_sms_fallback(self, lead: Lead) -> Dict:
        """SMS nurture message for leads where all call attempts were exhausted."""
        try:
            company = await self.db.get(Company, lead.company_id)
            first = lead.name.strip().split()[0] if lead.name else "there"
            body = (
                f"Hi {first}, I tried reaching you a few times but missed you. "
                "Happy to connect whenever you're free — just reply here!"
            )
            result = await self.twilio.send_sms(
                to=lead.phone,
                body=body,
                from_=company.twilio_phone_number if company else None,
            )
            if result["success"]:
                lead.sms_fallback_sent = True
                lead.last_contacted = datetime.utcnow()
                lead.last_contact_method = "sms"
                self.db.add(Message(
                    company_id=lead.company_id,
                    lead_id=lead.id,
                    direction=MessageDirection.OUTBOUND,
                    channel="sms",
                    content=body,
                    twilio_message_sid=result.get("message_sid"),
                    status="sent",
                ))
            return result
        except Exception as e:
            logger.error(f"SMS fallback error for lead {lead.id}: {e}")
            return {"success": False, "error": str(e)}

    async def _initiate_voice_call(self, lead: Lead, overrides: Optional[Dict] = None) -> Dict:
        try:
            if not await self._is_within_working_hours(lead):
                logger.info(f"Lead {lead.id}: skipping call — outside working hours")
                return {"success": False, "error": "outside_working_hours"}

            company = await self.db.get(Company, lead.company_id)
            agent_name = "your representative"
            if lead.assigned_agent_id:
                agent = await self.db.get(User, lead.assigned_agent_id)
                if agent: agent_name = agent.name

            # Extract SMS context from overrides (passed in from the SMS→call flow)
            sms_context = (overrides or {}).get("variableValues", {}).get("sms_context")

            # Build full contextual prompt for this specific call
            full_prompt = self.vapi.create_lead_assistant_prompt(
                {"name": lead.name, "company": lead.lead_company, "industry": lead.industry, "interest": lead.interest},
                {"name": company.name, "ai_config": company.ai_config},
                sms_context=sms_context,
            )
            system_prompt = f"Your name is {agent_name}. {full_prompt}"

            # Ensure a base assistant exists (reused across calls; context injected per-call via overrides)
            assistant_id = company.vapi_assistant_id
            if not assistant_id:
                assistant_result = await self.vapi.create_assistant(
                    name=f"{company.name} Sales Assistant",
                    system_prompt=system_prompt,
                    first_message=f"Hi {lead.name.split()[0]}, this is {agent_name} from {company.name}. Do you have a moment to chat?"
                )
                if not assistant_result["success"]: return assistant_result
                assistant_id = assistant_result["assistant"]["id"]

            call_result = await self.vapi.create_phone_call(
                phone_number=lead.phone,
                assistant_id=assistant_id,
                phone_number_id=(overrides or {}).get("phoneNumberId") or settings.vapi_phone_number_id,
                webhook_url=f"{settings.app_url}/api/webhooks/vapi/inbound",
                system_prompt=system_prompt,
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
    
    async def _count_outbound_sms(self, lead_id) -> int:
        """Count how many outbound SMS messages have been sent to a lead."""
        result = await self.db.execute(
            select(func.count()).where(
                and_(
                    Message.lead_id == lead_id,
                    Message.direction == MessageDirection.OUTBOUND,
                    Message.channel == "sms",
                )
            )
        )
        return result.scalar() or 0

    @staticmethod
    def _is_mortgage_lead(lead: Lead) -> bool:
        return is_mortgage_lead(lead)

    async def _send_outbound_sms(self, lead: Lead) -> Dict:
        try:
            company = await self.db.get(Company, lead.company_id)
            if not company:
                logger.error(f"Company {lead.company_id} not found for lead {lead.id}")
                return {"success": False, "error": "Company not found"}

            agent_name = "your representative"
            if lead.assigned_agent_id:
                agent = await self.db.get(User, lead.assigned_agent_id)
                if agent:
                    agent_name = agent.name

            first_name = lead.name.strip().split()[0] if lead.name and lead.name.strip() else "there"
            message_body: Optional[str] = None

            # ── Mortgage/Refi campaign: sequenced templates only for mortgage industry ──
            if self._is_mortgage_lead(lead):
                outbound_count = await self._count_outbound_sms(lead.id)
                message_body = get_campaign_message(
                    lead, outbound_count, agent_name, company.name
                )
                if message_body is None:
                    logger.info(f"Lead {lead.id}: mortgage campaign exhausted — skipping.")
                    return {"success": False, "error": "campaign_exhausted"}
                logger.info(
                    f"Lead {lead.id}: mortgage campaign attempt {outbound_count + 1}: {message_body!r}"
                )

            # ── Non-mortgage / AI-generated fallback ───────────────────────
            if message_body is None:
                messages = await self._get_conversation_history(lead.id, limit=5)
                if messages:
                    reply_data = await self.openai.generate_smart_reply(
                        lead, messages,
                        {"name": company.name, "ai_config": company.ai_config},
                        "Generate a friendly follow-up nudge.",
                        agent_name=agent_name,
                        company_name=company.name,
                    )
                    message_body = reply_data.get(
                        "reply",
                        f"Hi {first_name}, this is {agent_name} from {company.name}. Just following up!",
                    )
                else:
                    message_body = await self.openai.generate_cold_outreach(
                        lead,
                        {"name": company.name, "ai_config": company.ai_config},
                        agent_name=agent_name,
                        company_name=company.name,
                    )

            send_result = await self.twilio.send_sms(
                to=lead.phone,
                body=message_body,
                from_=company.twilio_phone_number or settings.twilio_phone_number,
            )
            if send_result["success"]:
                thread = await self._get_or_create_thread(lead.id, "sms")
                self.db.add(Message(
                    company_id=lead.company_id,
                    lead_id=lead.id,
                    thread_id=thread.id,
                    direction=MessageDirection.OUTBOUND,
                    channel="sms",
                    content=message_body,
                    twilio_message_sid=send_result.get("message_sid"),
                ))
                lead.last_contacted = datetime.utcnow()
                lead.last_contact_method = "sms"
                if lead.status == LeadStatus.NEW:
                    lead.status = LeadStatus.CONTACTED
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
            lead = result.scalars().first()
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

            schedule_meeting = False
            if transcript:
                analysis = await self.openai.analyze_sentiment_and_intent(transcript, {"lead_name": lead.name, "call_duration": duration})
                lead.sentiment_score = {**lead.sentiment_score, "latest": analysis.get("sentiment", "neutral"), "intent": analysis.get("intent", "other")}
                if analysis.get("intent") == "schedule_meeting":
                    lead.status = LeadStatus.QUALIFIED
                    schedule_meeting = True
                elif analysis.get("intent") == "not_interested":
                    lead.status = LeadStatus.LOST
                lead.lead_score = self._compute_lead_score(lead)

            lead.last_contacted = datetime.utcnow()
            lead.last_contact_method = "voice"
            await self.db.commit()

            if schedule_meeting:
                company = await self.db.get(Company, lead.company_id)
                if company:
                    await self._handle_calendar_booking(lead, company)

            return {"success": True, "lead_id": str(lead.id)}
        except Exception as e:
            logger.error(f"Voice call ended error: {e}")
            await self.db.rollback()
            return {"success": False, "error": str(e)}
