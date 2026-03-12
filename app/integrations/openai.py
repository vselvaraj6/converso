from typing import List, Dict, Optional
from datetime import datetime
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
    
    async def generate_smart_reply(
        self,
        lead: Lead,
        conversation_history: List[Message],
        company_config: Dict,
        latest_message: str,
        agent_name: str = "your representative",
        company_name: str = "our company"
    ) -> Dict:
        """Generate a smart reply based on conversation history and context"""
        try:
            # Build conversation thread
            thread = self._build_conversation_thread(conversation_history)
            
            # Get dynamic prompt configuration
            prompt_config = company_config.get("ai_config", {})
            temperature = prompt_config.get("temperature", 0.7)
            tone = prompt_config.get("tone", "friendly and professional")
            
            # Create system prompt
            system_prompt = self._create_system_prompt(lead, prompt_config, tone, agent_name, company_name)
            
            # Build messages for OpenAI
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Full Conversation History (oldest first):\n{thread}"},
                {"role": "user", "content": f"The lead just said: \"{latest_message}\". Based on this and the history above, generate your natural, helpful response."}
            ]
            
            # Try primary model
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=150
                )
            except Exception as primary_error:
                logger.warning(f"Primary model {self.model} failed: {primary_error}. Falling back to gpt-3.5-turbo.")
                # Fallback to gpt-3.5-turbo which is usually more accessible
                response = await self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    temperature=temperature,
                    max_tokens=150
                )
            
            reply_content = response.choices[0].message.content.strip()
            
            return {
                "success": True,
                "reply": reply_content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "reply": f"Hi! This is {agent_name} from {company_name}. Thanks for reaching out. How can I help you today?"
            }
    
    async def analyze_sentiment_and_intent(
        self,
        message: str,
        context: Optional[Dict] = None
    ) -> Dict:
        """Analyze sentiment, intent, and extract key information from a message"""
        try:
            current_date = datetime.utcnow().strftime("%Y-%m-%d")
            prompt = f"""Analyze the following message and provide sales insights.
Current Date: {current_date}

Extract:
1. Sentiment (positive/neutral/negative)
2. Intent (schedule_meeting/ask_question/not_interested/request_info/other). 
   Set to 'schedule_meeting' if the lead wants to talk, meet, call, or speaks about availability.
3. Urgency level (high/medium/low)
4. Any datetime mentioned. If relative like 'tomorrow' or 'next Monday', convert to ISO date string (YYYY-MM-DD) based on current date {current_date}. 
   If a specific time is mentioned, include it in ISO format (YYYY-MM-DDTHH:MM:SSZ).
5. Key topics or interests

Message: "{message}"
Context: {json.dumps(context or {})}

Respond in JSON format."""
            
            # Try primary model
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an AI that analyzes customer messages for sales insights."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
            except Exception as primary_error:
                logger.warning(f"Primary model {self.model} failed for analysis: {primary_error}. Falling back to gpt-3.5-turbo-0125.")
                try:
                    response = await self.client.chat.completions.create(
                        model="gpt-3.5-turbo-0125", 
                        messages=[
                            {"role": "system", "content": "You are an AI that analyzes customer messages for sales insights."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                        response_format={"type": "json_object"}
                    )
                except Exception as fallback_error:
                    logger.error(f"Fallback model gpt-3.5-turbo-0125 also failed for analysis: {fallback_error}")
                    raise fallback_error
            
            analysis = json.loads(response.choices[0].message.content)
            
            return {
                "success": True,
                "sentiment": analysis.get("sentiment", "neutral"),
                "intent": analysis.get("intent", "other"),
                "urgency": analysis.get("urgency", "medium"),
                "extracted_datetime": analysis.get("datetime"),
                "topics": analysis.get("topics", []),
                "raw_analysis": analysis
            }
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {
                "success": False,
                "error": str(e),
                "sentiment": "neutral",
                "intent": "other",
                "urgency": "medium"
            }
    
    async def generate_cold_outreach(
        self,
        lead: Lead,
        company_config: Dict,
        agent_name: str = "your representative",
        company_name: str = "our company"
    ) -> str:
        """Generate initial outreach message for new leads"""
        try:
            prompt_config = company_config.get("ai_config", {})
            temperature = prompt_config.get("temperature", 0.7)
            
            prompt = f"""Create a brief, friendly SMS message to reach out to a new lead.
My name is {agent_name} and I am from {company_name}.
Lead name: {lead.name}
Company: {lead.lead_company}
Industry: {lead.industry}
Interest: {lead.interest or 'General inquiry'}

Requirements:
- Keep it under 160 characters
- Be warm and professional
- Include a simple question to start conversation
- Use the lead's first name
- Introduce yourself briefly as {agent_name} from {company_name}"""
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a friendly sales assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=100
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Cold outreach generation error: {e}")
            return f"Hi {lead.name.split()[0]}! This is {agent_name} from {company_name}. Thanks for your interest. How can we help you today?"
    
    async def summarize_conversation(
        self,
        messages: List[Message]
    ) -> str:
        """Generate a summary of a conversation thread"""
        try:
            thread = self._build_conversation_thread(messages)
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an AI that summarizes sales conversations."},
                    {"role": "user", "content": f"Summarize this conversation in 2-3 sentences:\n\n{thread}"}
                ],
                temperature=0.3,
                max_tokens=100
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Conversation summary error: {e}")
            return "Unable to generate summary."
    
    def _build_conversation_thread(self, messages: List[Message]) -> str:
        """Build a formatted conversation thread from messages"""
        thread_lines = []
        for msg in sorted(messages, key=lambda x: x.created_at):
            direction = "Lead" if msg.direction == MessageDirection.INBOUND else "You"
            timestamp = msg.created_at.strftime("%Y-%m-%d %H:%M")
            thread_lines.append(f"{timestamp} - {direction}: {msg.content}")
        return "\n".join(thread_lines)
    
    def _create_system_prompt(self, lead: Lead, config: Dict, tone: str, agent_name: str, company_name: str) -> str:
        """Create a dynamic system prompt based on configuration"""
        base_prompt = config.get("prompt_template", "")
        industry_lingo = config.get("industry_lingo", "")
        company_memory = config.get("company_memory", "")
        
        if not base_prompt:
            base_prompt = f"""You are {agent_name}, a professional sales representative at {company_name}.
Your primary goal is to book a consultation call with the lead.

Context:
- Lead: {lead.name}
- Industry: {lead.industry or 'general'}
- Initial Interest: {lead.interest or 'General inquiry'}

Company Context:
{company_memory}

Industry Lingo:
{industry_lingo}

Conversational Guidelines:
- **Be Natural:** Respond like a real human. Acknowledge what the lead just said and answer their specific questions.
- **Avoid Repetition:** Do NOT mention "{lead.industry or 'mortgage'}" or your company name in every message if the conversation is already flowing. 
- **Stay Brief:** Keep SMS under 160 characters. Use emojis sparingly (max 1 per message).
- **Drive to Booking:** If the lead shows interest or asks about next steps, guide them to book a call using the provided link.
- **Address by Name:** Use the lead's first name ({lead.name.split()[0]}) naturally.
- **Context Awareness:** Read the conversation history carefully. Don't re-introduce yourself if you've already done so.
"""
        
        return base_prompt.format(
            lead_name=lead.name,
            industry=lead.industry or "Mortgage/Real Estate",
            company=lead.lead_company or "our firm",
            tone=tone,
            agent_name=agent_name,
            company_name=company_name
        )
