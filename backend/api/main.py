"""Main FastAPI application for FlowShare V2 API Service."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

# Add parent directory to path for shared imports
sys.path.append("..")

from shared.config import settings
from shared.database import initialize_firestore
from routers import (
    auth,
    users,
    tenants,
    invitations,
    production,
    reconciliation,
    terminal_receipts,
    analytics,
    forecasts,
    partners
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting FlowShare V2 API Service...")
    try:
        initialize_firestore()
        logger.info("Firestore initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Firestore: {str(e)}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down FlowShare V2 API Service...")


# Create FastAPI app with lifespan
app = FastAPI(
    title="FlowShare V2 API",
    description="AI-Powered Hydrocarbon Allocation Platform API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

print(settings.cors_origins_list, 'settings.cors_origins_listgfhjkljhg')
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "api",
        "version": "2.0.0",
        "environment": settings.environment,
    }


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(tenants.router, prefix="/api/tenants", tags=["Tenants"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["Invitations"])
app.include_router(production.router, prefix="/api/production", tags=["Production"])
app.include_router(reconciliation.router, prefix="/api/reconciliation", tags=["Reconciliation"])
app.include_router(terminal_receipts.router, prefix="/api/terminal-receipts", tags=["Terminal Receipts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(forecasts.router, prefix="/api/forecasts", tags=["Forecasts"])
app.include_router(partners.router, prefix="/api/partners", tags=["Partners"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
