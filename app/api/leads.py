"""
Lead management API endpoints.

Provides RESTful endpoints for retrieving and managing lead information.
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
import io

from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
import pandas as pd

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models import Lead, LeadStatus, Company, User

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


class UpdateLeadRequest(BaseModel):
    """Request model for updating a lead."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[LeadStatus] = None
    interest: Optional[str] = None


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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LeadListResponse:
    """
    List leads with pagination and optional filtering.
    """
    # Build query with optional status filter
    query = select(Lead).where(Lead.company_id == current_user.company_id)
    if status:
        query = query.where(Lead.status == status)
    
    # Get total count for pagination
    count_query = select(func.count()).select_from(Lead).where(Lead.company_id == current_user.company_id)
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get detailed information for a specific lead.
    """
    # Query lead with relationships
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.company_id == current_user.company_id)
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


@router.post("/import")
async def import_leads(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import leads from an Excel or CSV file.
    """
    contents = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format. Please upload a CSV or Excel file."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    required_cols = {'name', 'email', 'phone'}
    cols = {str(c).lower().strip() for c in df.columns}
    missing = required_cols - cols
    if missing:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required columns: {', '.join(missing)}. "
                   f"Expected: name, email, phone"
        )

    df.columns = [str(c).lower().strip() for c in df.columns]
    success_count = 0
    errors = []
    
    for i, row in df.iterrows():
        try:
            name = str(row['name']).strip()
            email = str(row['email']).strip()
            phone = str(row['phone']).strip().replace("+1", "").replace("-", "").replace(" ", "")
            
            if not name or name == 'nan' or not email or email == 'nan' or not phone or phone == 'nan':
                errors.append(f"Row {i+2}: Name, email, and phone are required")
                continue

            existing = await db.execute(
                select(Lead).where(Lead.email == email)
            )
            if existing.scalar_one_or_none():
                errors.append(f"Row {i+2}: Email {email} already exists")
                continue

            # Create lead
            lead = Lead(
                company_id=current_user.company_id,
                assigned_agent_id=current_user.id,
                name=name,
                email=email,
                phone=phone,
                title=str(row.get('title', '')).strip() if pd.notna(row.get('title')) else None,
                lead_company=str(row.get('company', '')).strip() if pd.notna(row.get('company')) else None,
                industry=str(row.get('industry', '')).strip() if pd.notna(row.get('industry')) else None,
                source="import",
                interest=str(row.get('interest', '')).strip() if pd.notna(row.get('interest')) else None,
                status=LeadStatus.NEW,
                nudge_interval_days=int(row.get('nudge_interval_days', 2)) if pd.notna(row.get('nudge_interval_days')) else 2
            )
            db.add(lead)
            success_count += 1
        except Exception as e:
            errors.append(f"Row {i+2}: {str(e)}")

    if success_count > 0:
        await db.commit()
    
    return {"success_count": success_count, "error_count": len(errors), "errors": errors[:10]}


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    data: UpdateLeadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LeadResponse:
    """
    Update an existing lead.
    """
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.company_id == current_user.company_id)
    )
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if data.name is not None:
        lead.name = data.name
    if data.email is not None:
        lead.email = data.email
    if data.phone is not None:
        lead.phone = data.phone.replace("+1", "").replace("-", "").replace(" ", "")
    if data.title is not None:
        lead.title = data.title
    if data.company is not None:
        lead.lead_company = data.company
    if data.industry is not None:
        lead.industry = data.industry
    if data.status is not None:
        lead.status = data.status
    if data.interest is not None:
        lead.interest = data.interest
        
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


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a lead.
    """
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.company_id == current_user.company_id)
    )
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await db.delete(lead)
    await db.commit()
    
    return {"status": "success", "message": "Lead deleted"}


@router.post("/", response_model=LeadResponse)
async def create_lead(
    lead_data: CreateLeadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LeadResponse:
    """
    Create a new lead.
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
        
        # Normalize phone number (remove +1 if present)
        phone = lead_data.phone.replace("+1", "").replace("-", "").replace(" ", "")
        
        # Create lead
        lead = Lead(
            company_id=current_user.company_id,
            assigned_agent_id=current_user.id,
            name=lead_data.name,
            email=lead_data.email,
            phone=phone,
            title=lead_data.title,
            lead_company=lead_data.company,
            industry=lead_data.industry,
            source=lead_data.source,
            interest=lead_data.interest,
            status=LeadStatus.NEW,
            nudge_interval_days=lead_data.nudge_interval_days or 2
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
