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
        latest_message: str
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
            system_prompt = self._create_system_prompt(lead, prompt_config, tone)
            
            # Build messages for OpenAI
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Conversation history:\n{thread}"},
                {"role": "user", "content": f"Lead just said: {latest_message}\n\nGenerate a smart reply."}
            ]
            
            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
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
                "reply": "Hi! Thanks for reaching out. How can I help you today?"
            }
    
    async def analyze_sentiment_and_intent(
        self,
        message: str,
        context: Optional[Dict] = None
    ) -> Dict:
        """Analyze sentiment, intent, and extract key information from a message"""
        try:
            prompt = f"""Analyze the following message and provide:
1. Sentiment (positive/neutral/negative)
2. Intent (schedule_meeting/ask_question/not_interested/request_info/other)
3. Urgency level (high/medium/low)
4. Any datetime mentioned (ISO format)
5. Key topics or interests

Message: "{message}"
Context: {json.dumps(context or {})}

Respond in JSON format."""
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an AI that analyzes customer messages for sales insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
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
        company_config: Dict
    ) -> str:
        """Generate initial outreach message for new leads"""
        try:
            prompt_config = company_config.get("ai_config", {})
            temperature = prompt_config.get("temperature", 0.7)
            
            prompt = f"""Create a brief, friendly SMS message to reach out to a new lead.
Lead name: {lead.name}
Company: {lead.lead_company}
Industry: {lead.industry}
Interest: {lead.interest or 'General inquiry'}

Requirements:
- Keep it under 160 characters
- Be warm and professional
- Include a simple question to start conversation
- Use the lead's first name"""
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a friendly sales assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=60
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Cold outreach generation error: {e}")
            return f"Hi {lead.name.split()[0]}! Thanks for your interest. How can we help you today?"
    
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
    
    def _create_system_prompt(self, lead: Lead, config: Dict, tone: str) -> str:
        """Create a dynamic system prompt based on configuration"""
        base_prompt = config.get("prompt_template", "")
        
        if not base_prompt:
            base_prompt = f"""You are a helpful and persuasive sales assistant continuing a conversation 
with a lead in the {lead.industry or 'general'} industry. Your job is to respond like a skilled sales agent. 
Never share pricing — that's reserved for human agents. Your goal is to guide them toward booking a call. 
Keep it {tone}, short (under 160 characters for SMS)."""
        
        return base_prompt.format(
            lead_name=lead.name,
            industry=lead.industry or "general",
            company=lead.lead_company or "their company",
            tone=tone
        )