"""
Meetings (calendar events) API endpoints.
"""

from datetime import datetime
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import User
from app.models.calendar_event import CalendarEvent
from app.models.lead import Lead

router = APIRouter()


@router.get("/")
async def list_meetings(
    upcoming_only: bool = Query(True, description="Only return future meetings"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return calendar events for the current user's company, joined with lead info."""
    query = (
        select(CalendarEvent, Lead)
        .join(Lead, CalendarEvent.lead_id == Lead.id)
        .where(
            or_(
                CalendarEvent.sales_agent_id == current_user.id,
                Lead.company_id == current_user.company_id
            )
        )
    )

    if upcoming_only:
        query = query.where(CalendarEvent.start_time >= datetime.utcnow())

    query = query.order_by(CalendarEvent.start_time.asc()).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    meetings = [
        {
            "id": str(event.id),
            "title": event.title,
            "description": event.description,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "timezone": event.timezone,
            "location": event.location,
            "meeting_link": event.meeting_link,
            "status": event.status,
            "google_event_id": event.google_event_id,
            "lead": {
                "id": str(lead.id),
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "company": lead.lead_company,
            },
        }
        for event, lead in rows
    ]

    return {"meetings": meetings, "total": len(meetings)}
