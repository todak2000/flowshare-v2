"""Main FastAPI application for FlowShare V2 API Service."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
import logging
import sys

# Add parent directory to path for shared imports
sys.path.append("..")

from shared.config import settings
from shared.database import initialize_firestore
from shared.middleware import SecurityHeadersMiddleware, RateLimitMiddleware, verify_swagger_credentials
from api.routers import (
    auth,
    users,
    tenants,
    invitations,
    production,
    reconciliation,
    terminal_receipts,
    analytics,
    forecasts,
    partners,
    demo,
    flowsharegpt,
    audit,
    dashboard,
    scada,
    api_keys,
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
# Disable default docs in production, will create custom protected endpoints
app = FastAPI(
    title="FlowShare V2 API",
    description="AI-Powered Hydrocarbon Allocation Platform API",
    version="2.0.0",
    docs_url=None,  # Disabled - using custom protected endpoint
    redoc_url=None,  # Disabled - using custom protected endpoint
    openapi_url=None if settings.environment == "production" else "/openapi.json",
    lifespan=lifespan,
)

# HTTP Basic Auth for Swagger docs
security = HTTPBasic()


def get_current_docs_user(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify Swagger documentation credentials."""
    if not verify_swagger_credentials(credentials.username, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid documentation credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# Protected Swagger UI endpoint
@app.get("/docs", include_in_schema=False)
async def get_documentation(username: str = Depends(get_current_docs_user)):
    """Protected Swagger UI documentation (requires authentication)."""
    if not settings.swagger_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Documentation is not configured. Set SWAGGER_PASSWORD environment variable."
        )

    # Custom Swagger UI HTML with requestInterceptor to preserve auth credentials
    from fastapi.responses import HTMLResponse

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css">
        <link rel="shortcut icon" href="https://fastapi.tiangolo.com/img/favicon.png">
        <title>{app.title} - Documentation</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
            }}
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {{
                window.ui = SwaggerUIBundle({{
                    url: '/openapi.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    layout: "StandaloneLayout",
                    // Preserve HTTP Basic Auth credentials for all requests
                    requestInterceptor: (req) => {{
                        req.credentials = 'include';
                        return req;
                    }}
                }});
            }};
        </script>
    </body>
    </html>
    """

    return HTMLResponse(content=html_content)


# Protected ReDoc endpoint
@app.get("/redoc", include_in_schema=False)
async def get_redocumentation(username: str = Depends(get_current_docs_user)):
    """Protected ReDoc documentation (requires authentication)."""
    if not settings.swagger_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Documentation is not configured. Set SWAGGER_PASSWORD environment variable."
        )

    # Custom ReDoc HTML with credentials handling
    from fastapi.responses import HTMLResponse

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{app.title} - Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
            body {{
                margin: 0;
                padding: 0;
            }}
        </style>
    </head>
    <body>
        <redoc spec-url='/openapi.json'></redoc>
        <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
    </body>
    </html>
    """

    return HTMLResponse(content=html_content)


# Protected OpenAPI schema endpoint
@app.get("/openapi.json", include_in_schema=False)
async def get_open_api_endpoint(username: str = Depends(get_current_docs_user)):
    """Protected OpenAPI schema (requires authentication)."""
    if not settings.swagger_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Documentation is not configured. Set SWAGGER_PASSWORD environment variable."
        )
    return get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )


# Configure CORS (FIRST - must be first to handle preflight requests and add headers to all responses)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    # Restrict to specific HTTP methods
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    # Restrict to necessary headers
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        "X-Requested-With",
        "X-API-Key",  # For SCADA API
    ],
    # Expose necessary headers to frontend
    expose_headers=["Content-Disposition"],  # For file downloads
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add Rate Limiting Middleware (SECOND - after CORS)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.rate_limit_per_minute
)

# Add Security Headers Middleware (THIRD - applies to all responses)
app.add_middleware(SecurityHeadersMiddleware)


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
app.include_router(flowsharegpt.router, prefix="/api/flowsharegpt", tags=["FlowshareGPT"])
app.include_router(audit.router, prefix="/api", tags=["Audit Logs"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(demo.router, prefix="/api", tags=["Demo/Admin - No Auth"])
app.include_router(scada.router, prefix="/api/scada", tags=["SCADA API (External)"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["API Key Management"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
