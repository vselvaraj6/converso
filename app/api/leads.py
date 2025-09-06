"""
Lead management API endpoints.

Provides RESTful endpoints for retrieving and managing lead information.
"""

from typing import Dict, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.models import Lead, LeadStatus, Company

router = APIRouter()


class LeadListResponse(BaseModel):
    """Response model for lead listing."""
    leads: list[Dict[str, Any]]
    total: int
    page: int
    per_page: int
    total_pages: int


class CreateLeadRequest(BaseModel):
    """Request model for creating a lead."""
    name: str
    email: EmailStr
    phone: str
    title: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    source: Optional[str] = "manual"
    interest: Optional[str] = None
    company_id: Optional[UUID] = None  # If not provided, uses default company


class LeadResponse(BaseModel):
    """Response model for single lead."""
    id: str
    name: str
    email: str
    phone: str
    status: str
    created_at: str


@router.get("/", response_model=LeadListResponse)
async def list_leads(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    status: Optional[LeadStatus] = Query(None, description="Filter by lead status"),
    db: AsyncSession = Depends(get_db)
) -> LeadListResponse:
    """
    List leads with pagination and optional filtering.
    
    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return (max: 100)
        status: Optional filter by lead status
        db: Database session
        
    Returns:
        LeadListResponse with paginated lead data
    """
    # Build query with optional status filter
    query = select(Lead)
    if status:
        query = query.where(Lead.status == status)
    
    # Get total count for pagination
    count_query = select(func.count()).select_from(Lead)
    if status:
        count_query = count_query.where(Lead.status == status)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Lead.created_at.desc())
    result = await db.execute(query)
    leads = result.scalars().all()
    
    # Calculate pagination info
    page = (skip // limit) + 1
    total_pages = (total + limit - 1) // limit
    
    return LeadListResponse(
        leads=[{
            "id": str(lead.id),
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "company": lead.lead_company,
            "status": lead.status,
            "last_contacted": lead.last_contacted.isoformat() if lead.last_contacted else None,
            "sentiment": lead.sentiment_score.get("latest") if lead.sentiment_score else None,
            "created_at": lead.created_at.isoformat()
        } for lead in leads],
        total=total,
        page=page,
        per_page=limit,
        total_pages=total_pages
    )


@router.get("/{lead_id}")
async def get_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed information for a specific lead.
    
    Args:
        lead_id: UUID of the lead to retrieve
        db: Database session
        
    Returns:
        Complete lead information including relationships
        
    Raises:
        HTTPException: 404 if lead not found
    """
    # Query lead with relationships
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id)
    )
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(
            status_code=404,
            detail=f"Lead with ID {lead_id} not found"
        )
    
    # Return comprehensive lead data
    return {
        "id": str(lead.id),
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "title": lead.title,
        "company": lead.lead_company,
        "status": lead.status,
        "industry": lead.industry,
        "source": lead.source,
        "interest": lead.interest,
        "lead_owner": lead.lead_owner,
        "last_contacted": lead.last_contacted.isoformat() if lead.last_contacted else None,
        "last_contact_method": lead.last_contact_method,
        "call_attempts": lead.call_attempts,
        "sentiment_score": lead.sentiment_score,
        "lead_score": lead.lead_score,
        "days_since_contact": lead.days_since_contact,
        "is_qualified": lead.is_qualified,
        "created_at": lead.created_at.isoformat(),
        "updated_at": lead.updated_at.isoformat()
    }


@router.post("/", response_model=LeadResponse)
async def create_lead(
    lead_data: CreateLeadRequest,
    db: AsyncSession = Depends(get_db)
) -> LeadResponse:
    """
    Create a new lead.
    
    This endpoint allows you to manually add leads to the system.
    If no company_id is provided, it will use or create a default company.
    
    Args:
        lead_data: Lead information
        db: Database session
        
    Returns:
        Created lead information
        
    Raises:
        HTTPException: 400 if email already exists
    """
    try:
        # Check if email already exists
        existing = await db.execute(
            select(Lead).where(Lead.email == lead_data.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Lead with email {lead_data.email} already exists"
            )
        
        # Get or create default company if not provided
        if not lead_data.company_id:
            # Try to find default company
            company_result = await db.execute(
                select(Company).limit(1)
            )
            company = company_result.scalar_one_or_none()
            
            if not company:
                # Create default company
                company = Company(
                    name="Default Company",
                    ai_config={
                        "temperature": 0.7,
                        "tone": "friendly and professional",
                        "prompt_template": ""
                    }
                )
                db.add(company)
                await db.flush()
            
            company_id = company.id
        else:
            company_id = lead_data.company_id
        
        # Normalize phone number (remove +1 if present)
        phone = lead_data.phone.replace("+1", "").replace("-", "").replace(" ", "")
        
        # Create lead
        lead = Lead(
            company_id=company_id,
            name=lead_data.name,
            email=lead_data.email,
            phone=phone,
            title=lead_data.title,
            lead_company=lead_data.company,
            industry=lead_data.industry,
            source=lead_data.source,
            interest=lead_data.interest,
            status=LeadStatus.NEW
        )
        
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
        
        return LeadResponse(
            id=str(lead.id),
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            status=lead.status,
            created_at=lead.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))