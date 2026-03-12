import asyncio
from app.core.database import AsyncSessionLocal
from app.models import Lead, User
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Lead))
        leads = result.scalars().all()
        for l in leads:
            print(f"Lead: {l.name}, Agent ID: {l.assigned_agent_id}")
            
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.name}, ID: {u.id}")

if __name__ == "__main__":
    asyncio.run(check())
