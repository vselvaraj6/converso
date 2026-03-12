from datetime import timedelta
from typing import Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, decode_token, get_password_hash, verify_password
from app.models import Company, User

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── Industry Templates ────────────────────────────────────────────────────────

INDUSTRY_TEMPLATES = {
    "Mortgage": {
        "industry_lingo": "Use terms like 'Pre-approval', 'HELOC', 'Amortization', 'LTV ratio', 'Fixed vs Variable', 'Closing costs'.",
        "company_memory": "We are a top-rated mortgage brokerage. We help clients find the best rates by comparing 30+ lenders. We specialize in first-time home buyers, refinances, and debt consolidation."
    },
    "Real Estate": {
        "industry_lingo": "Use terms like 'MLS listing', 'Buyer representation', 'Seller's market', 'Open house', 'Comparables (Comps)', 'Escrow'.",
        "company_memory": "We are a full-service real estate team. We help buyers find their dream homes and sellers get top dollar for their property. We know every neighborhood in the city."
    },
    "Insurance": {
        "industry_lingo": "Use terms like 'Premium', 'Deductible', 'Liability coverage', 'Policy limit', 'Underwriting', 'Claim process'.",
        "company_memory": "We provide comprehensive insurance solutions for home, auto, and life. Our goal is to protect what matters most to you with personalized coverage at competitive rates."
    },
    "SaaS / Software": {
        "industry_lingo": "Use terms like 'ROI', 'Implementation', 'Scalability', 'API integration', 'User adoption', 'SLA', 'Cloud-native'.",
        "company_memory": "We provide a cutting-edge software platform that automates complex business workflows. Our solution helps teams increase productivity by 40% and reduces manual errors."
    },
    "Solar Energy": {
        "industry_lingo": "Use terms like 'Photovoltaic (PV)', 'Net metering', 'Grid-tied', 'Inverter efficiency', 'Tax credits', 'Energy independence'.",
        "company_memory": "We are a leading solar installation company. We help homeowners transition to clean, renewable energy while significantly reducing their monthly electricity bills."
    }
}


# ── Schemas ──────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    ai_config: Optional[dict] = None
    twilio_phone_number: Optional[str] = None
    cal_booking_url: Optional[str] = None
    cal_event_type_id: Optional[int] = None
    vapi_assistant_id: Optional[str] = None


# ── Dependency ────────────────────────────────────────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload:
        raise exc
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise exc
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise exc
    return user


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")

    token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(days=7))
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "name": user.name,
              "role": user.role, "company_id": str(user.company_id)},
    )


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    company = Company(
        name=data.company_name,
        ai_config={"temperature": 0.7, "tone": "friendly and professional", "prompt_template": ""},
    )
    db.add(company)
    await db.flush()

    user = User(
        company_id=company.id,
        email=data.email,
        name=data.name,
        hashed_password=get_password_hash(data.password),
        role="admin",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(days=7))
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "name": user.name,
              "role": user.role, "company_id": str(user.company_id)},
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "company_id": str(current_user.company_id),
    }


@router.get("/company/industry-templates")
async def get_industry_templates(current_user: User = Depends(get_current_user)):
    return INDUSTRY_TEMPLATES


@router.get("/company")
async def get_company(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == current_user.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": str(company.id),
        "name": company.name,
        "industry": company.industry,
        "ai_config": company.ai_config,
        "twilio_phone_number": company.twilio_phone_number,
        "cal_booking_url": company.cal_booking_url,
        "cal_event_type_id": company.cal_event_type_id,
        "vapi_assistant_id": company.vapi_assistant_id
    }


@router.patch("/company")
async def update_company(
    data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == current_user.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if data.name is not None:
        company.name = data.name
    if data.industry is not None:
        company.industry = data.industry
    if data.twilio_phone_number is not None:
        company.twilio_phone_number = data.twilio_phone_number
    if data.cal_booking_url is not None:
        company.cal_booking_url = data.cal_booking_url
    if data.cal_event_type_id is not None:
        company.cal_event_type_id = data.cal_event_type_id
    if data.vapi_assistant_id is not None:
        company.vapi_assistant_id = data.vapi_assistant_id
    if data.ai_config is not None:
        current_config = company.ai_config or {}
        company.ai_config = {**current_config, **data.ai_config}
    
    await db.commit()
    await db.refresh(company)
    return {
        "id": str(company.id),
        "name": company.name,
        "industry": company.industry,
        "ai_config": company.ai_config,
        "twilio_phone_number": company.twilio_phone_number,
        "cal_booking_url": company.cal_booking_url,
        "cal_event_type_id": company.cal_event_type_id,
        "vapi_assistant_id": company.vapi_assistant_id
    }
