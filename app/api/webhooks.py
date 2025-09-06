"""
Webhook API endpoints for external service integrations.

This module handles incoming webhooks from Twilio (SMS) and VAPI (voice calls),
processing them through the workflow service for automated responses.
"""

import logging
from typing import Dict, Any

from fastapi import APIRouter, Request, HTTPException, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.workflow_service import WorkflowService
from app.integrations.twilio import TwilioService
from app.integrations.vapi import VAPIService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/twilio/inbound", response_model=Dict[str, str])
async def twilio_inbound_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    Handle incoming SMS messages from Twilio.
    
    This endpoint receives webhooks from Twilio when SMS messages are sent
    to the configured phone number. It processes the message through the
    workflow service which:
    1. Identifies the lead
    2. Analyzes sentiment and intent
    3. Generates and sends a smart reply
    4. Updates lead status and conversation history
    
    Args:
        request: FastAPI request object containing webhook data
        db: Database session
        
    Returns:
        Dict with status "received" to acknowledge the webhook
        
    Raises:
        HTTPException: 400 for invalid data, 401 for signature validation failure,
                      500 for processing errors
    """
    try:
        # Extract form data from Twilio webhook
        form_data = await request.form()
        webhook_data = dict(form_data)
        
        # Validate webhook signature in production
        if request.headers.get("X-Twilio-Signature"):
            twilio_service = TwilioService()
            signature = request.headers.get("X-Twilio-Signature", "")
            
            # Construct the full URL for signature validation
            url = str(request.url)
            
            if not twilio_service.validate_webhook(url, webhook_data, signature):
                logger.warning(f"Invalid Twilio signature from {webhook_data.get('From')}")
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Process through workflow service
        workflow_service = WorkflowService(db)
        
        # Convert Twilio format to our internal format
        processed_data = {
            "from": webhook_data.get("From", ""),
            "to": webhook_data.get("To", ""),
            "body": webhook_data.get("Body", ""),
            "message_sid": webhook_data.get("MessageSid", ""),
            "account_sid": webhook_data.get("AccountSid", ""),
            "from_city": webhook_data.get("FromCity", ""),
            "from_state": webhook_data.get("FromState", ""),
            "from_country": webhook_data.get("FromCountry", ""),
        }
        
        # Process the inbound message
        result = await workflow_service.process_inbound_message(processed_data)
        
        if not result["success"]:
            logger.error(f"Failed to process message: {result.get('error')}")
            # Still return 200 to Twilio to prevent retries
            return {"status": "received", "error": result.get("error")}
        
        logger.info(
            f"Successfully processed SMS from {processed_data['from']}: "
            f"Lead ID: {result.get('lead_id')}, "
            f"Sentiment: {result.get('analysis', {}).get('sentiment')}"
        )
        
        # Return success response to Twilio
        return {"status": "received"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Twilio webhook processing error: {e}", exc_info=True)
        # Return 200 to prevent Twilio retries even on error
        return {"status": "received", "error": "Internal processing error"}


@router.post("/vapi/inbound", response_model=Dict[str, str])
async def vapi_inbound_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    Handle voice call events from VAPI.
    
    This endpoint receives webhooks from VAPI for voice call events including:
    - call.started: Call has been initiated
    - call.ended: Call has completed
    - call.failed: Call failed to connect
    
    The webhook data includes call transcripts, duration, and recordings
    which are processed and stored for lead tracking.
    
    Args:
        request: FastAPI request object containing webhook data
        db: Database session
        
    Returns:
        Dict with status "received" to acknowledge the webhook
        
    Raises:
        HTTPException: 500 for processing errors
    """
    try:
        # Parse JSON webhook data
        webhook_data = await request.json()
        
        # Extract event type
        event_type = webhook_data.get("type", "unknown")
        call_id = webhook_data.get("call_id")
        
        logger.info(f"Received VAPI webhook: {event_type} for call {call_id}")
        
        # Process through VAPI service
        vapi_service = VAPIService()
        result = await vapi_service.handle_webhook(webhook_data)
        
        if result["success"]:
            # Process based on event type
            if event_type == "call.ended":
                # Update lead with call information
                workflow_service = WorkflowService(db)
                
                # Extract phone number and find lead
                phone_number = webhook_data.get("phone_number", "").replace("+1", "")
                
                if phone_number:
                    # Store call transcript and update lead status
                    await workflow_service.process_voice_call_ended(
                        phone=phone_number,
                        call_id=call_id,
                        duration=result.get("duration", 0),
                        transcript=result.get("transcript", ""),
                        recording_url=result.get("recording_url")
                    )
            
            elif event_type == "call.failed":
                logger.warning(f"VAPI call failed: {result.get('error')}")
        
        # Always return success to VAPI
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"VAPI webhook processing error: {e}", exc_info=True)
        # Return 200 to prevent retries
        return {"status": "received", "error": str(e)}