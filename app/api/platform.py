from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.api.auth import get_current_user
from app.core.security import get_password_hash
from app.models import Company, User, Lead, Message, UserRole

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

class AiConfigUpdate(BaseModel):
    prompt_template: Optional[str] = None
    temperature: Optional[float] = None
    tone: Optional[str] = None
    industry_lingo: Optional[str] = None
    company_memory: Optional[str] = None


class CallConfigUpdate(BaseModel):
    max_attempts: Optional[int] = None
    hours_between_attempts: Optional[int] = None


class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.WRITE

class UserResponseAdmin(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    is_active: bool

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

@router.post("/companies/{company_id}/users", response_model=UserResponseAdmin)
async def create_user_as_admin(
    company_id: UUID,
    data: UserCreateAdmin,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser)
):
    """Add a user to a company (Platform Admin only)"""
    # Check if company exists
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if email exists
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        company_id=company_id,
        email=data.email,
        name=data.name,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user_as_admin(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser)
):
    """Remove a user from the platform (Platform Admin only)"""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting yourself
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    await db.delete(user)
    await db.commit()
    return {"status": "success", "message": f"User {user_id} removed"}

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

@router.get("/campaign-templates")
async def get_campaign_templates(
    admin: User = Depends(get_current_superuser)
):
    """Return the full mortgage + refi campaign message sequences for admin preview."""
    from app.config.mortgage_campaign import (
        MORTGAGE_INITIAL, REFI_INITIAL,
        NURTURE_CAMPAIGN, MORTGAGE_NURTURE_DAY6, REFI_NURTURE_DAY6,
    )

    INITIAL_TIMINGS = [
        "Day 1 — 1st contact",
        "Day 1 — +15 min",
        "Day 1 — +45 min",
        "Day 1 — +1 hr",
        "Day 2",
        "Day 3",
        "Day 5",
        "Day 6",
        "Day 7",
    ]
    NURTURE_TIMINGS = [
        "Day 2", "Day 4", "Day 6", "Day 10", "Day 13", "Day 17",
        "Day 21", "Day 24", "Day 28", "Day 34", "Day 43", "Day 55",
        "Day 69", "Day 80", "Day 97", "Day 110", "Day 125", "Day 140",
        "Day 153", "Day 168", "Day 180",
    ]

    messages = []
    for i, timing in enumerate(INITIAL_TIMINGS):
        messages.append({
            "attempt": i + 1,
            "phase": "Initial",
            "timing": timing,
            "mortgage": MORTGAGE_INITIAL[i],
            "refi": REFI_INITIAL[i],
        })
    for i, timing in enumerate(NURTURE_TIMINGS):
        mort_msg = NURTURE_CAMPAIGN[i] if NURTURE_CAMPAIGN[i] is not None else MORTGAGE_NURTURE_DAY6
        refi_msg = NURTURE_CAMPAIGN[i] if NURTURE_CAMPAIGN[i] is not None else REFI_NURTURE_DAY6
        messages.append({
            "attempt": len(INITIAL_TIMINGS) + i + 1,
            "phase": "Nurture",
            "timing": timing,
            "mortgage": mort_msg,
            "refi": refi_msg,
        })

    return {"messages": messages, "total": len(messages)}


@router.patch("/companies/{company_id}/ai-config")
async def update_company_ai_config(
    company_id: UUID,
    body: AiConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser),
):
    """Update a company's AI configuration (Platform Admin only)"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.ai_config = {**(company.ai_config or {}), **body.dict(exclude_none=True)}
    await db.commit()
    return {"status": "updated", "ai_config": company.ai_config}


@router.patch("/companies/{company_id}/call-config")
async def update_company_call_config(
    company_id: UUID,
    body: CallConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser),
):
    """Update a company's call retry configuration (Platform Admin only)"""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.call_config = {**(company.call_config or {}), **body.dict(exclude_none=True)}
    await db.commit()
    return {"status": "updated", "call_config": company.call_config}


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
