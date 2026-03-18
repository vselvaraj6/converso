from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict
from openai import AsyncOpenAI
from app.core.config import settings
from app.models import Lead, Message, MessageDirection
import json
import logging

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    # ── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _first_name(name: str) -> str:
        """Safely extract first name; returns 'there' if name is blank."""
        return name.strip().split()[0] if name and name.strip() else "there"

    def _build_chat_messages(
        self,
        system_prompt: str,
        conversation_history: List[Message],
        latest_message: str,
    ) -> List[Dict]:
        """
        Build a properly-structured OpenAI messages list.

        Conversation history is mapped to real assistant/user roles so the
        model understands who said what, rather than receiving a flat text dump.
        """
        messages: List[Dict] = [{"role": "system", "content": system_prompt}]

        for msg in sorted(conversation_history, key=lambda x: x.created_at):
            role = "user" if msg.direction == MessageDirection.INBOUND else "assistant"
            if msg.content and msg.content.strip():
                messages.append({"role": role, "content": msg.content.strip()})

        # Current inbound message
        messages.append({"role": "user", "content": latest_message})
        return messages

    def _build_conversation_thread(self, messages: List[Message]) -> str:
        """Plain-text thread used only for summaries."""
        lines = []
        for msg in sorted(messages, key=lambda x: x.created_at):
            speaker = "Lead" if msg.direction == MessageDirection.INBOUND else "You"
            ts = msg.created_at.strftime("%Y-%m-%d %H:%M")
            lines.append(f"{ts} - {speaker}: {msg.content}")
        return "\n".join(lines)

    @staticmethod
    def _is_mortgage_lead(lead: Lead) -> bool:
        from app.config.mortgage_campaign import is_mortgage_lead
        return is_mortgage_lead(lead)

    def _create_system_prompt(
        self,
        lead: Lead,
        config: Dict,
        tone: str,
        agent_name: str,
        company_name: str,
        lead_status: str = "NEW",
        urgency: str = "medium",
    ) -> str:
        """
        Build the SMS system prompt.

        If the company has set a custom prompt_template, it is used with safe
        format_map substitution (unknown placeholders become empty strings so
        curly braces in company_memory/industry_lingo don't crash).
        """
        industry_lingo = config.get("industry_lingo", "").strip()
        company_memory = config.get("company_memory", "").strip()
        first_name = self._first_name(lead.name)
        prompt_template = config.get("prompt_template", "").strip()

        if prompt_template:
            try:
                return prompt_template.format_map(defaultdict(str, {
                    "lead_name": lead.name or "",
                    "first_name": first_name,
                    "industry": lead.industry or "",
                    "company": lead.lead_company or "",
                    "tone": tone,
                    "agent_name": agent_name,
                    "company_name": company_name,
                }))
            except Exception as e:
                logger.warning(f"Custom prompt_template format failed: {e}. Using as-is.")
                return prompt_template

        # ── Default prompt ────────────────────────────────────────────────
        parts = [
            f"You are {agent_name}, a sales representative at {company_name}. You are texting via SMS.",
            "",
            f"Lead info — Name: {lead.name or 'Unknown'} | "
            f"Company: {lead.lead_company or 'Unknown'} | "
            f"Industry: {lead.industry or 'Unknown'} | "
            f"Interest: {lead.interest or 'General inquiry'}",
            "",
            "RULES:",
            f"- Address them as {first_name} occasionally — not in every message.",
            "- Read the full conversation history before replying. Never repeat yourself.",
            "- Respond directly to what they just said. Answer questions first.",
            "- Keep replies under 160 characters. One clear thought per message.",
            "- Don't re-introduce yourself once you've already done it.",
            "- Don't name-drop the company or industry in every message.",
            "- Tone: match their energy. Warm but not pushy.",
            "- If they show interest in meeting, ask for their availability naturally.",
            "  Example: \"What works for you — tomorrow afternoon or later this week?\"",
            "- Do NOT send booking links. You handle scheduling for them.",
            "- If not interested, acknowledge respectfully. Don't push.",
            "- Max one emoji per message, only when it feels natural.",
        ]

        if company_memory:
            parts += ["", "COMPANY CONTEXT:", company_memory]

        if industry_lingo:
            parts += ["", "INDUSTRY TERMS TO USE:", industry_lingo]

        # Mortgage/Refi: append campaign tone guide so inbound replies stay
        # consistent with the outbound message sequence.
        if self._is_mortgage_lead(lead):
            from app.config.mortgage_campaign import MORTGAGE_TONE_GUIDE
            parts += ["", MORTGAGE_TONE_GUIDE.strip()]

        status_guidance = {
            "NEW": "This is your first contact. Introduce yourself warmly. Goal: establish rapport.",
            "CONTACTED": "You've been in touch before. Skip re-introductions. Goal: move toward booking.",
            "QUALIFIED": "Lead has shown meeting interest. Be concrete — offer specific times now.",
            "CONVERTED": "Lead already booked. Confirm details only.",
            "LOST": "Lead opted out. Do not contact.",
        }
        urgency_guidance = {
            "high": "Lead indicated time pressure. Prioritize booking now.",
            "medium": "Standard cadence — don't rush but stay warm.",
            "low": "Low urgency — keep it brief and leave the door open.",
        }
        stage_hint = status_guidance.get(lead_status.upper(), "")
        urgency_hint = urgency_guidance.get(urgency.lower(), "")
        if stage_hint or urgency_hint:
            parts += ["", "CURRENT LEAD CONTEXT:"]
            if stage_hint:
                parts.append(f"- Stage: {stage_hint}")
            if urgency_hint:
                parts.append(f"- Urgency: {urgency_hint}")

        return "\n".join(parts)

    # ── Core methods ─────────────────────────────────────────────────────────

    async def generate_smart_reply(
        self,
        lead: Lead,
        conversation_history: List[Message],
        company_config: Dict,
        latest_message: str,
        agent_name: str = "your representative",
        company_name: str = "our company",
        lead_status: str = "NEW",
        urgency: str = "medium",
    ) -> Dict:
        """Generate a contextual reply using proper conversation role structure."""
        try:
            prompt_config = company_config.get("ai_config", {})
            temperature = prompt_config.get("temperature", 0.7)
            tone = prompt_config.get("tone", "friendly and professional")

            system_prompt = self._create_system_prompt(
                lead, prompt_config, tone, agent_name, company_name,
                lead_status=lead_status, urgency=urgency,
            )

            messages = self._build_chat_messages(
                system_prompt, conversation_history, latest_message
            )

            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=160,
                )
            except Exception as primary_error:
                logger.warning(
                    f"Primary model {self.model} failed: {primary_error}. "
                    "Falling back to gpt-3.5-turbo."
                )
                response = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    temperature=temperature,
                    max_tokens=160,
                )

            reply_content = response.choices[0].message.content.strip()

            return {
                "success": True,
                "reply": reply_content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
            }
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            first = self._first_name(lead.name)
            return {
                "success": False,
                "error": str(e),
                "reply": (
                    f"Hi {first}! This is {agent_name} from {company_name}. "
                    "Thanks for reaching out — how can I help?"
                ),
            }

    async def analyze_sentiment_and_intent(
        self,
        message: str,
        context: Optional[Dict] = None,
    ) -> Dict:
        """
        Classify sentiment, intent, urgency and extract any datetime mention.

        Intent values:
          request_call     — wants to talk on the phone right now (no time given)
          schedule_meeting — wants to talk at a specific future time
          ask_question     — has a question, seeking information
          not_interested   — declining, opting out
          request_info     — wants more details / brochure / pricing info
          other            — positive/neutral reply, small talk, etc.
        """
        try:
            current_date = datetime.utcnow().strftime("%Y-%m-%d")
            ctx = context or {}

            # Include recent conversation snippet if provided
            recent_msgs = ctx.pop("recent_conversation", [])
            recent_snippet = ""
            if recent_msgs:
                lines = [
                    f"  {'Lead' if m.get('direction') == 'inbound' else 'Agent'}: {m.get('content', '')}"
                    for m in recent_msgs
                ]
                recent_snippet = "\nRecent conversation:\n" + "\n".join(lines)

            prompt = f"""You are a sales analyst classifying a lead's SMS message.

Today: {current_date}
Lead name: {ctx.get('lead_name', 'Unknown')}
Lead company: {ctx.get('company', 'Unknown')}{recent_snippet}

Latest message: "{message}"

Classify and extract the following as JSON:

1. "sentiment": "positive" | "neutral" | "negative"

2. "intent": one of:
   - "request_call"     → Lead explicitly wants a phone call with NO specific time.
                          Examples: "Call me", "Can you call me?", "I'd rather talk"
   - "schedule_meeting" → Lead specifies a FUTURE time/day to talk.
                          Examples: "Call me tomorrow at 3", "Free Monday morning", "Let's talk next week"
   - "ask_question"     → Lead is asking something.
                          Examples: "What are your rates?", "How does it work?", "Do you cover X?"
   - "not_interested"   → Lead is declining or opting out.
                          Examples: "Not interested", "Please stop texting", "Remove me"
   - "request_info"     → Lead wants materials or general info, not a call.
                          Examples: "Send me more info", "Can you email me details?"
   - "other"            → Anything else: acknowledgements, short replies, small talk.
                          Examples: "Ok", "Sure", "Sounds good", "Thanks"

   IMPORTANT: Only use "request_call" when the lead explicitly asks for a call NOW with no time specified.
   A general "sounds good" or "ok" is "other", not "request_call".

3. "urgency": "high" | "medium" | "low"

4. "datetime": ISO string (YYYY-MM-DDTHH:MM:SSZ) if a specific time is mentioned, else null.
   Convert relative dates using today={current_date}.

5. "topics": list of key topics or interests mentioned.

Few-shot examples:
- "Call me" → intent: request_call, urgency: high
- "Can we talk tomorrow at 2pm?" → intent: schedule_meeting, datetime: (tomorrow 2pm)
- "What's your pricing?" → intent: ask_question, urgency: medium
- "Not interested, thanks" → intent: not_interested, urgency: low
- "Ok sounds good" → intent: other, urgency: low
- "Send me more details" → intent: request_info, urgency: low
- "I'm free Friday afternoon" → intent: schedule_meeting
- "Sure, I'd be open to a quick chat" → intent: other (not an explicit call request)

Respond with valid JSON only."""

            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a JSON-only sales message classifier. Output valid JSON.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
            except Exception as primary_error:
                logger.warning(
                    f"Primary model {self.model} failed for analysis: {primary_error}. "
                    "Falling back to gpt-3.5-turbo-0125."
                )
                response = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo-0125",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a JSON-only sales message classifier. Output valid JSON.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )

            analysis = json.loads(response.choices[0].message.content)

            return {
                "success": True,
                "sentiment": analysis.get("sentiment", "neutral"),
                "intent": analysis.get("intent", "other"),
                "urgency": analysis.get("urgency", "medium"),
                "extracted_datetime": analysis.get("datetime"),
                "topics": analysis.get("topics", []),
                "raw_analysis": analysis,
            }
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {
                "success": False,
                "error": str(e),
                "sentiment": "neutral",
                "intent": "other",
                "urgency": "medium",
            }

    async def generate_cold_outreach(
        self,
        lead: Lead,
        company_config: Dict,
        agent_name: str = "your representative",
        company_name: str = "our company",
    ) -> str:
        """Generate the first outreach SMS for a new lead."""
        try:
            prompt_config = company_config.get("ai_config", {})
            temperature = prompt_config.get("temperature", 0.7)
            company_memory = prompt_config.get("company_memory", "").strip()
            first_name = self._first_name(lead.name)

            context_block = f"\nAbout our company: {company_memory}" if company_memory else ""

            prompt = (
                f"Write a short, friendly opening SMS to a new lead on behalf of {agent_name} at {company_name}.\n"
                f"Lead: {lead.name} | Company: {lead.lead_company or 'N/A'} | "
                f"Industry: {lead.industry or 'N/A'} | Interest: {lead.interest or 'General inquiry'}\n"
                f"{context_block}\n\n"
                f"Requirements:\n"
                f"- Under 160 characters total\n"
                f"- Address them as {first_name}\n"
                f"- Introduce {agent_name} from {company_name} briefly\n"
                f"- End with a single open question to start a conversation\n"
                f"- Natural and warm, not salesy\n"
                f"- No links, no emojis unless very natural"
            )

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You write short, friendly sales SMS messages."},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=100,
            )

            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Cold outreach generation error: {e}")
            first = self._first_name(lead.name)
            return (
                f"Hi {first}! This is {agent_name} from {company_name}. "
                "We'd love to learn more about what you're looking for — "
                "what's the biggest challenge you're trying to solve right now?"
            )

    async def summarize_conversation(self, messages: List[Message]) -> str:
        """Summarize a conversation thread for voice call hand-off context."""
        try:
            thread = self._build_conversation_thread(messages)

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Summarize this sales SMS conversation in 2-3 sentences. "
                            "Include: what the lead said they want, any sentiment, "
                            "and any dates or times they mentioned."
                        ),
                    },
                    {"role": "user", "content": thread},
                ],
                temperature=0.3,
                max_tokens=120,
            )

            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Conversation summary error: {e}")
            return "No summary available."
