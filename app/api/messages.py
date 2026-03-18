"""
Message history API endpoints.

Provides endpoints for retrieving conversation history and messages.
"""

from typing import Dict, Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel

from app.api.auth import get_current_user, require_read_access
from app.core.database import get_db
from app.models import Message, MessageDirection, ConversationThread, User, Lead

router = APIRouter()


class MessageResponse(BaseModel):
    """Response model for individual message."""
    id: str
    lead_id: str
    direction: str
    channel: str
    content: str
    sentiment: Optional[Dict[str, Any]]
    created_at: str
    status: Optional[str]


class MessageListResponse(BaseModel):
    """Response model for message listing."""
    messages: List[MessageResponse]
    total: int
    has_more: bool


@router.get("/lead/{lead_id}", response_model=MessageListResponse)
async def get_lead_messages(
    lead_id: UUID,
    skip: int = Query(0, ge=0, description="Number of messages to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum messages to return"),
    channel: Optional[str] = Query(None, description="Filter by channel (sms/voice/email)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_read_access), # REQUIRE READ
) -> MessageListResponse:
    """
    Get conversation history for a specific lead.
    
    Retrieves all messages exchanged with a lead, sorted by most recent first.
    Supports pagination and filtering by communication channel.
    
    Args:
        lead_id: UUID of the lead
        skip: Number of messages to skip (for pagination)
        limit: Maximum number of messages to return
        channel: Optional filter by communication channel
        db: Database session
        
    Returns:
        MessageListResponse with paginated message history
        
    Raises:
        HTTPException: 404 if lead not found
    """
    # Build query with filters
    query = select(Message).where(Message.lead_id == lead_id)
    
    if channel:
        query = query.where(Message.channel == channel)
    
    # Get total count
    count_query = select(func.count()).select_from(Message).where(Message.lead_id == lead_id)
    if channel:
        count_query = count_query.where(Message.channel == channel)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    if total == 0:
        # Verify lead exists
        from app.models import Lead
        lead_exists = await db.execute(
            select(func.count()).select_from(Lead).where(Lead.id == lead_id)
        )
        if not lead_exists.scalar():
            raise HTTPException(
                status_code=404,
                detail=f"Lead with ID {lead_id} not found"
            )
    
    # Get messages with pagination
    query = query.order_by(Message.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()
    
    # Format response
    return MessageListResponse(
        messages=[
            MessageResponse(
                id=str(msg.id),
                lead_id=str(msg.lead_id),
                direction=msg.direction,
                channel=msg.channel,
                content=msg.content,
                sentiment=msg.ai_metadata if msg.ai_metadata else None,
                created_at=msg.created_at.isoformat(),
                status=msg.status
            )
            for msg in messages
        ],
        total=total,
        has_more=(skip + limit) < total
    )


@router.get("/thread/{thread_id}", response_model=MessageListResponse)
async def get_thread_messages(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_read_access), # REQUIRE READ
) -> MessageListResponse:
    """
    Get all messages in a conversation thread.
    
    Retrieves the complete conversation history for a specific thread,
    useful for maintaining context in ongoing conversations.
    
    Args:
        thread_id: UUID of the conversation thread
        db: Database session
        
    Returns:
        MessageListResponse with all messages in the thread
        
    Raises:
        HTTPException: 404 if thread not found
    """
    # Verify thread exists
    thread_result = await db.execute(
        select(ConversationThread).where(ConversationThread.id == thread_id)
    )
    thread = thread_result.scalar_one_or_none()
    
    if not thread:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation thread with ID {thread_id} not found"
        )
    
    # Get all messages in thread
    result = await db.execute(
        select(Message)
        .where(Message.thread_id == thread_id)
        .order_by(Message.created_at.asc())  # Chronological order for threads
    )
    messages = result.scalars().all()
    
    return MessageListResponse(
        messages=[
            MessageResponse(
                id=str(msg.id),
                lead_id=str(msg.lead_id),
                direction=msg.direction,
                channel=msg.channel,
                content=msg.content,
                sentiment=msg.ai_metadata if msg.ai_metadata else None,
                created_at=msg.created_at.isoformat(),
                status=msg.status
            )
            for msg in messages
        ],
        total=len(messages),
        has_more=False  # All thread messages returned
    )


@router.get("/recent-ai")
async def get_recent_ai_messages(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return the most recent inbound messages that have AI classification metadata."""
    cid = current_user.company_id

    result = await db.execute(
        select(Message, Lead.name.label("lead_name"))
        .join(Lead, Lead.id == Message.lead_id)
        .where(
            Message.company_id == cid,
            Message.direction == MessageDirection.INBOUND,
            text("messages.ai_metadata->>'intent' IS NOT NULL"),
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
    )

    messages = []
    for msg, lead_name in result.all():
        messages.append({
            "id": str(msg.id),
            "lead_id": str(msg.lead_id),
            "lead_name": lead_name,
            "channel": msg.channel,
            "content": msg.content,
            "ai_metadata": msg.ai_metadata,
            "created_at": msg.created_at.isoformat(),
        })

    return {"messages": messages}
