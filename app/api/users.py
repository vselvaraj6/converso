"""
Company users endpoint with per-user performance stats.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import Lead, CalendarEvent, User

router = APIRouter()


@router.get("/")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return all users in the company with leads_assigned and meetings_booked counts."""
    cid = current_user.company_id

    # Subquery: leads assigned per user
    leads_sq = (
        select(Lead.assigned_agent_id, func.count(Lead.id).label("leads_count"))
        .where(Lead.company_id == cid)
        .group_by(Lead.assigned_agent_id)
        .subquery()
    )

    # Subquery: meetings booked per sales_agent
    meetings_sq = (
        select(CalendarEvent.sales_agent_id, func.count(CalendarEvent.id).label("meetings_count"))
        .join(Lead, Lead.id == CalendarEvent.lead_id)
        .where(Lead.company_id == cid)
        .group_by(CalendarEvent.sales_agent_id)
        .subquery()
    )

    result = await db.execute(
        select(
            User,
            func.coalesce(leads_sq.c.leads_count, 0).label("leads_assigned"),
            func.coalesce(meetings_sq.c.meetings_count, 0).label("meetings_booked"),
        )
        .outerjoin(leads_sq, leads_sq.c.assigned_agent_id == User.id)
        .outerjoin(meetings_sq, meetings_sq.c.sales_agent_id == User.id)
        .where(User.company_id == cid)
        .order_by(User.created_at)
    )

    users = []
    for user, leads_assigned, meetings_booked in result.all():
        users.append({
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "leads_assigned": leads_assigned,
            "meetings_booked": meetings_booked,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        })

    return {"users": users, "total": len(users)}
