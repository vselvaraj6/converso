import asyncio
from datetime import datetime
from app.core.database import AsyncSessionLocal
from app.models import CalendarEvent, Lead, LeadStatus
from sqlalchemy import select, update
import uuid

async def fix_missed_booking():
    async with AsyncSessionLocal() as session:
        # Lead ID from logs: da6ef624-7acc-4126-bc99-789f62d86593
        lead_id = uuid.UUID('da6ef624-7acc-4126-bc99-789f62d86593')
        
        # Details from logs
        start_dt = datetime(2026, 3, 13, 13, 15)
        end_dt = datetime(2026, 3, 13, 13, 30)
        
        event = CalendarEvent(
            id=uuid.uuid4(),
            lead_id=lead_id,
            title='15 min meeting between Vignesh Selvaraj and Vignesh Selvaraj',
            description='',
            start_time=start_dt,
            end_time=end_dt,
            location='https://app.cal.com/video/vdBJvfn32mYyG2CxApZ59C',
            meeting_link='https://app.cal.com/video/vdBJvfn32mYyG2CxApZ59C',
            google_event_id='vdBJvfn32mYyG2CxApZ59C',
            status='confirmed',
            extra_metadata={}
        )
        
        session.add(event)
        
        # Also ensure lead is marked qualified
        await session.execute(
            update(Lead).where(Lead.id == lead_id).values(status=LeadStatus.QUALIFIED)
        )
        
        await session.commit()
        print(f"Manually added missed booking for lead {lead_id}")

if __name__ == "__main__":
    asyncio.run(fix_missed_booking())
