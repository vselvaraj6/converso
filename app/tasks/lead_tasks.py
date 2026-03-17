import asyncio
import logging

from celery import shared_task
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)


def _make_session() -> sessionmaker:
    engine = create_async_engine(settings.database_url, echo=False)
    return sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@shared_task(bind=True, max_retries=3)
def process_new_lead(self, lead_id: str):
    """Trigger cold outreach SMS for a newly created lead."""
    logger.info(f"Processing new lead: {lead_id}")

    async def _run():
        from app.models import Lead
        from app.services.workflow_service import WorkflowService

        AsyncSessionLocal = _make_session()
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Lead).where(Lead.id == lead_id))
            lead = result.scalar_one_or_none()
            if not lead:
                logger.warning(f"Lead {lead_id} not found")
                return {"status": "not_found"}

            service = WorkflowService(db)
            send_result = await service._send_outbound_sms(lead)
            if not send_result.get("success"):
                raise Exception(f"SMS failed: {send_result.get('error', 'unknown')}")
            await db.commit()
            return send_result

    try:
        result = asyncio.run(_run())
        logger.info(f"New lead {lead_id} processed: {result}")
        return {"status": "processed", "lead_id": lead_id, "result": result}
    except Exception as exc:
        logger.error(f"Error processing lead {lead_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=2)
def send_scheduled_messages(self):
    """Run outbound campaign — contacts leads not reached in the last 48 hours."""
    logger.info("Running scheduled outbound campaign")

    async def _run():
        from app.services.workflow_service import WorkflowService

        AsyncSessionLocal = _make_session()
        async with AsyncSessionLocal() as db:
            service = WorkflowService(db)
            result = await service.process_outbound_campaign()
            return result

    try:
        result = asyncio.run(_run())
        logger.info(f"Campaign finished: {result}")
        return result
    except Exception as exc:
        logger.error(f"Scheduled campaign error: {exc}")
        raise self.retry(exc=exc, countdown=120)


@shared_task(bind=True, max_retries=2)
def process_new_leads(self):
    """Find all NEW leads and fire cold outreach for each."""
    logger.info("Scanning for new leads to contact")

    async def _run():
        from app.models import Lead, LeadStatus
        from app.services.workflow_service import WorkflowService

        AsyncSessionLocal = _make_session()
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Lead)
                .where(Lead.status == LeadStatus.NEW, Lead.call_attempts == 0)
                .limit(30)
            )
            leads = result.scalars().all()

            service = WorkflowService(db)
            processed, errors = 0, 0
            for lead in leads:
                try:
                    await service._send_outbound_sms(lead)
                    processed += 1
                except Exception as e:
                    logger.error(f"Error contacting lead {lead.id}: {e}")
                    errors += 1

            await db.commit()
            return {"processed": processed, "errors": errors, "total": len(leads)}

    try:
        result = asyncio.run(_run())
        logger.info(f"New leads scan done: {result}")
        return result
    except Exception as exc:
        logger.error(f"process_new_leads error: {exc}")
        raise self.retry(exc=exc, countdown=60)
