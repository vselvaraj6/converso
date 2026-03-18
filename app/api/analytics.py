"""
Analytics API endpoint — returns a single aggregated JSON blob for the dashboard.
"""

from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import Lead, Message, CalendarEvent, User

router = APIRouter()

# ── Helpers ───────────────────────────────────────────────────────────────────

MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _month_key(dt: datetime) -> str:
    return MONTH_ABBR[dt.month - 1]


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return aggregated analytics for the current user's company."""
    cid = current_user.company_id
    now = datetime.utcnow()

    # ── Monthly overview (last 6 months) ────────────────────────────────────
    six_months_ago = now - timedelta(days=180)

    month_col = func.date_trunc("month", Lead.created_at)
    monthly_leads_q = await db.execute(
        select(month_col.label("month"), func.count(Lead.id).label("leads"))
        .where(Lead.company_id == cid, Lead.created_at >= six_months_ago)
        .group_by(month_col)
        .order_by(month_col)
    )
    leads_by_month: Dict[str, int] = {}
    for row in monthly_leads_q.all():
        leads_by_month[_month_key(row.month)] = row.leads

    month_col_ce = func.date_trunc("month", CalendarEvent.created_at)
    monthly_meetings_q = await db.execute(
        select(month_col_ce.label("month"), func.count(CalendarEvent.id).label("meetings"))
        .join(Lead, Lead.id == CalendarEvent.lead_id)
        .where(Lead.company_id == cid, CalendarEvent.created_at >= six_months_ago)
        .group_by(month_col_ce)
        .order_by(month_col_ce)
    )
    meetings_by_month: Dict[str, int] = {}
    for row in monthly_meetings_q.all():
        meetings_by_month[_month_key(row.month)] = row.meetings

    conversions_col = func.date_trunc("month", Lead.created_at)
    monthly_conv_q = await db.execute(
        select(conversions_col.label("month"), func.count(Lead.id).label("conversions"))
        .where(Lead.company_id == cid, Lead.status == "converted", Lead.created_at >= six_months_ago)
        .group_by(conversions_col)
        .order_by(conversions_col)
    )
    conv_by_month: Dict[str, int] = {}
    for row in monthly_conv_q.all():
        conv_by_month[_month_key(row.month)] = row.conversions

    # Build 6-slot array (current month last)
    monthly_overview = []
    for i in range(5, -1, -1):
        m = now - timedelta(days=30 * i)
        name = _month_key(m)
        monthly_overview.append({
            "name": name,
            "leads": leads_by_month.get(name, 0),
            "appointments": meetings_by_month.get(name, 0),
            "conversions": conv_by_month.get(name, 0),
        })

    # ── KPIs ─────────────────────────────────────────────────────────────────
    total_leads_r = await db.execute(
        select(func.count(Lead.id)).where(Lead.company_id == cid)
    )
    total_leads = total_leads_r.scalar() or 0

    total_conv_r = await db.execute(
        select(func.count(Lead.id)).where(Lead.company_id == cid, Lead.status == "converted")
    )
    total_conversions = total_conv_r.scalar() or 0

    channel_counts_q = await db.execute(
        select(Message.channel, func.count(Message.id))
        .where(Message.company_id == cid)
        .group_by(Message.channel)
    )
    channel_map: Dict[str, int] = {ch: cnt for ch, cnt in channel_counts_q.all()}

    sms_sent_r = await db.execute(
        select(func.count(Message.id))
        .where(Message.company_id == cid, Message.channel == "sms", Message.direction == "outbound")
    )
    sms_sent = sms_sent_r.scalar() or 0

    voice_calls_r = await db.execute(
        select(func.count(Message.id))
        .where(Message.company_id == cid, Message.channel == "voice")
    )
    voice_calls = voice_calls_r.scalar() or 0

    inbound_r = await db.execute(
        select(func.count(Message.id))
        .where(Message.company_id == cid, Message.direction == "inbound")
    )
    inbound_messages = inbound_r.scalar() or 0

    conversion_rate_pct = round((total_conversions / total_leads * 100), 1) if total_leads else 0.0

    flagged_r = await db.execute(
        select(func.count(Lead.id)).where(Lead.company_id == cid, Lead.needs_human_review == True)
    )
    flagged_for_review = flagged_r.scalar() or 0

    kpis = {
        "total_leads": total_leads,
        "total_conversions": total_conversions,
        "sms_sent": sms_sent,
        "voice_calls": voice_calls,
        "inbound_messages": inbound_messages,
        "conversion_rate_pct": conversion_rate_pct,
        "flagged_for_review": flagged_for_review,
    }

    # ── Funnel ────────────────────────────────────────────────────────────────
    funnel_q = await db.execute(
        select(Lead.status, func.count(Lead.id))
        .where(Lead.company_id == cid)
        .group_by(Lead.status)
    )
    funnel_raw: Dict[str, int] = {str(s): c for s, c in funnel_q.all()}
    funnel = {
        "new": funnel_raw.get("new", 0),
        "contacted": funnel_raw.get("contacted", 0),
        "qualified": funnel_raw.get("qualified", 0),
        "converted": funnel_raw.get("converted", 0),
        "lost": funnel_raw.get("lost", 0),
    }

    # ── Channel mix ──────────────────────────────────────────────────────────
    channel_mix = {
        "sms": channel_map.get("sms", 0),
        "voice": channel_map.get("voice", 0),
        "email": channel_map.get("email", 0),
    }

    # ── Daily leads (last 30 days) ────────────────────────────────────────────
    thirty_days_ago = now - timedelta(days=30)
    day_col = func.date_trunc("day", Lead.created_at)
    daily_q = await db.execute(
        select(day_col.label("day"), func.count(Lead.id).label("leads"))
        .where(Lead.company_id == cid, Lead.created_at >= thirty_days_ago)
        .group_by(day_col)
        .order_by(day_col)
    )
    daily_raw: Dict[str, int] = {}
    for row in daily_q.all():
        daily_raw[row.day.strftime("%Y-%m-%d")] = row.leads

    daily_leads = []
    for i in range(30):
        d = (thirty_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_leads.append({"date": d, "leads": daily_raw.get(d, 0)})

    # ── Intent distribution ───────────────────────────────────────────────────
    intent_q = await db.execute(
        select(
            text("ai_metadata->>'intent' as intent"),
            func.count(Message.id).label("count"),
        )
        .where(
            Message.company_id == cid,
            text("ai_metadata->>'intent' IS NOT NULL"),
        )
        .group_by(text("ai_metadata->>'intent'"))
        .order_by(func.count(Message.id).desc())
        .limit(10)
    )
    intent_distribution = [
        {"intent": row.intent, "count": row.count}
        for row in intent_q.all()
    ]

    # ── Sentiment breakdown ───────────────────────────────────────────────────
    sent_q = await db.execute(
        select(
            text("ai_metadata->>'sentiment' as sentiment"),
            func.count(Message.id).label("count"),
        )
        .where(
            Message.company_id == cid,
            text("ai_metadata->>'sentiment' IS NOT NULL"),
        )
        .group_by(text("ai_metadata->>'sentiment'"))
    )
    sent_raw: Dict[str, int] = {}
    for row in sent_q.all():
        sent_raw[str(row.sentiment).lower()] = row.count

    sentiment_breakdown = {
        "positive": sent_raw.get("positive", 0),
        "neutral": sent_raw.get("neutral", 0),
        "negative": sent_raw.get("negative", 0),
    }

    return {
        "monthly_overview": monthly_overview,
        "kpis": kpis,
        "funnel": funnel,
        "channel_mix": channel_mix,
        "daily_leads": daily_leads,
        "intent_distribution": intent_distribution,
        "sentiment_breakdown": sentiment_breakdown,
    }
