from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Company, User, Lead, Message
from pydantic import BaseModel

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class CompanyStats(BaseModel):
    id: UUID
    name: str
    industry: str | None
    user_count: int
    lead_count: int
    created_at: str

class CompanyUpdateAdmin(BaseModel):
    name: str | None = None
    industry: str | None = None
    twilio_phone_number: str | None = None
    cal_booking_url: str | None = None
    calcom_base_url: str | None = None

# ── Dependency ────────────────────────────────────────────────────────────────

async def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/companies", response_model=List[CompanyStats])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser)
):
    """List all companies with basic stats (Admin only)"""
    # Query companies with counts
    query = select(
        Company,
        func.count(User.id).label("user_count"),
        func.count(Lead.id).label("lead_count")
    ).outerjoin(User, Company.id == User.company_id)\
     .outerjoin(Lead, Company.id == Lead.company_id)\
     .group_by(Company.id)
    
    result = await db.execute(query)
    companies_data = []
    
    for company, user_count, lead_count in result.all():
        companies_data.append(CompanyStats(
            id=company.id,
            name=company.name,
            industry=company.industry,
            user_count=user_count,
            lead_count=lead_count,
            created_at=company.created_at.isoformat()
        ))
    
    return companies_data

@router.get("/companies/{company_id}")
async def get_company_details(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser)
):
    """Get detailed company info including all users"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get users for this company
    user_result = await db.execute(select(User).where(User.company_id == company_id))
    users = user_result.scalars().all()
    
    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "twilio_phone_number": company.twilio_phone_number,
            "cal_booking_url": company.cal_booking_url,
            "calcom_base_url": company.calcom_base_url,
            "ai_config": company.ai_config,
            "created_at": company.created_at
        },
        "users": [
            {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "is_active": u.is_active}
            for u in users
        ]
    }

@router.patch("/companies/{company_id}")
async def update_company_as_admin(
    company_id: UUID,
    data: CompanyUpdateAdmin,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser)
):
    """Override company settings as a platform admin"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(company, field, value)
    
    await db.commit()
    await db.refresh(company)
    return company

@router.get("/usage")
async def get_platform_usage(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser)
):
    """Get aggregate usage stats across the platform (SaaS Oversight)"""
    # 1. Total messages by channel
    msg_stats = await db.execute(
        select(Message.channel, func.count(Message.id))
        .group_by(Message.channel)
    )
    channels = {channel: count for channel, count in msg_stats.all()}
    
    # 2. Total messages per company (Top 10)
    company_usage = await db.execute(
        select(Company.name, func.count(Message.id))
        .join(Message, Company.id == Message.company_id)
        .group_by(Company.name)
        .order_by(func.count(Message.id).desc())
        .limit(10)
    )
    top_companies = [{"name": name, "count": count} for name, count in company_usage.all()]
    
    # 3. Daily volume (Last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    day_col = func.date_trunc('day', Message.created_at)
    daily_volume = await db.execute(
        select(day_col, func.count(Message.id))
        .where(Message.created_at >= seven_days_ago)
        .group_by(day_col)
        .order_by(day_col)
    )
    volume_history = [{"date": str(dt.date()), "count": count} for dt, count in daily_volume.all()]
    
    return {
        "channels": channels,
        "top_ten_companies": top_companies,
        "volume_history": volume_history
    }

@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser)
):
    """Offboard a company and all associated data (USE WITH CARE)"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    await db.delete(company)
    await db.commit()
    return {"status": "success", "message": f"Company {company_id} and all related data deleted"}
