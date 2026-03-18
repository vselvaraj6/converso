"""
Campaign CRUD API endpoints.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user, require_write_access
from app.core.database import get_db
from app.models import Lead, User
from app.models.campaign import Campaign

router = APIRouter()


class CreateCampaignRequest(BaseModel):
    name: str
    type: str
    status: Optional[str] = "draft"
    description: Optional[str] = None


class UpdateCampaignRequest(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


def _serialize(campaign: Campaign, leads_count: int = 0) -> Dict[str, Any]:
    return {
        "id": str(campaign.id),
        "name": campaign.name,
        "type": campaign.type,
        "status": campaign.status,
        "description": campaign.description,
        "leads": leads_count,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None,
    }


@router.get("/")
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List all campaigns for the company with per-campaign lead counts."""
    cid = current_user.company_id

    result = await db.execute(
        select(Campaign).where(Campaign.company_id == cid).order_by(Campaign.created_at.desc())
    )
    campaigns = result.scalars().all()

    if not campaigns:
        return {"campaigns": [], "total": 0, "active_count": 0}

    # Count leads created after each campaign's created_at (rough "reached" metric)
    total_leads_r = await db.execute(
        select(func.count(Lead.id)).where(Lead.company_id == cid)
    )
    total_leads = total_leads_r.scalar() or 0

    serialized = [_serialize(c, total_leads if c.status == "active" else 0) for c in campaigns]
    active_count = sum(1 for c in campaigns if c.status == "active")

    return {"campaigns": serialized, "total": len(campaigns), "active_count": active_count}


@router.post("/")
async def create_campaign(
    data: CreateCampaignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access),
) -> Dict[str, Any]:
    campaign = Campaign(
        company_id=current_user.company_id,
        name=data.name,
        type=data.type,
        status=data.status or "draft",
        description=data.description,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return _serialize(campaign)


@router.patch("/{campaign_id}")
async def update_campaign(
    campaign_id: UUID,
    data: UpdateCampaignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access),
) -> Dict[str, Any]:
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.company_id == current_user.company_id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(campaign, field, value)

    await db.commit()
    await db.refresh(campaign)
    return _serialize(campaign)


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_access),
) -> Dict[str, str]:
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.company_id == current_user.company_id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    await db.delete(campaign)
    await db.commit()
    return {"status": "success"}
