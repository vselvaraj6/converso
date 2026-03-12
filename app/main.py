"""
Converso API - Main Application Entry Point

This module initializes and configures the FastAPI application for the Converso
lead nurturing platform. It sets up middleware, routers, and lifecycle management.
"""

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, health, webhooks, leads, messages, meetings

# Configure logging with appropriate level and format
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifecycle manager.
    
    Handles startup and shutdown events:
    - Startup: Creates database tables if they don't exist
    - Shutdown: Cleanup operations
    
    Args:
        app: FastAPI application instance
        
    Yields:
        None
    """
    # Startup
    logger.info("Starting up Converso application...")
    
    # Create database tables if they don't exist
    # Skip this in testing as conftest.py handles it
    if settings.app_env != "testing":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Converso application...")


# Initialize FastAPI application with metadata
app = FastAPI(
    title=settings.app_name,
    description="AI-powered lead nurturing and conversion platform",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers with proper prefixes and tags
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["auth"],
)

app.include_router(
    health.router,
    prefix="/api/health",
    tags=["health"],
)

app.include_router(
    webhooks.router,
    prefix="/api/webhooks",
    tags=["webhooks"],
)

app.include_router(
    leads.router,
    prefix="/api/leads",
    tags=["leads"],
)

app.include_router(
    messages.router,
    prefix="/api/messages",
    tags=["messages"],
)

app.include_router(
    meetings.router,
    prefix="/api/meetings",
    tags=["meetings"],
)


@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint providing API information.
    
    Returns:
        dict: API welcome message with useful links
    """
    return {
        "message": "Welcome to Converso API",
        "version": "0.1.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/health",
        "openapi": "/openapi.json"
    }


# Run the application directly with uvicorn when executed as a script
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development",
        log_level=settings.log_level.lower()
    )