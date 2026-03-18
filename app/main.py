from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, health, webhooks, leads, messages, meetings, platform, analytics, campaigns, users

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Converso API",
    description="AI-driven lead nurturing platform API",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # This will create tables if they don't exist
        # In a real production app, we use Alembic for migrations
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified successfully")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(platform.router, prefix="/api/platform", tags=["platform"])
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Welcome to Converso API", "version": "1.0.0"}
