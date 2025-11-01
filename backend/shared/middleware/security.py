"""Security middleware for FlowShare V2 API."""
import secrets
from typing import Callable
from fastapi import Request, HTTPException, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from shared.config import settings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking (allow SAMEORIGIN for docs)
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

        # Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Enforce HTTPS (only in production)
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Content Security Policy
        # More permissive for /docs, /redoc, /openapi.json to allow Swagger UI
        is_docs_route = request.url.path in ["/docs", "/redoc", "/openapi.json"]

        if is_docs_route:
            # Relaxed CSP for API documentation (Swagger UI needs CDN resources)
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
                "img-src 'self' data: https:; "
                "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; "
                "connect-src 'self' https://cdn.jsdelivr.net"  # Allow source maps
            )
        else:
            # Strict CSP for API endpoints
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'"
            )

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware.
    For production, use Redis-backed rate limiting with slowapi or similar.
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}  # IP -> (timestamp, count)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Rate limit requests per IP address."""
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health"]:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Check rate limit
        import time
        current_time = time.time()

        if client_ip in self.request_counts:
            last_time, count = self.request_counts[client_ip]

            # Reset counter if minute has passed
            if current_time - last_time > 60:
                self.request_counts[client_ip] = (current_time, 1)
            else:
                # Increment counter
                self.request_counts[client_ip] = (last_time, count + 1)

                # Check if rate limit exceeded
                if count + 1 > self.requests_per_minute:
                    logger.warning(
                        f"Rate limit exceeded for IP: {client_ip} "
                        f"({count + 1} requests in last minute)"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "error": "Rate limit exceeded",
                            "message": f"Maximum {self.requests_per_minute} requests per minute allowed",
                            "retry_after": int(60 - (current_time - last_time))
                        }
                    )
        else:
            self.request_counts[client_ip] = (current_time, 1)

        # Clean up old entries (optional, prevents memory growth)
        if len(self.request_counts) > 10000:
            self.request_counts = {
                ip: (ts, cnt)
                for ip, (ts, cnt) in self.request_counts.items()
                if current_time - ts < 60
            }

        return await call_next(request)


def verify_swagger_credentials(username: str, password: str) -> bool:
    """
    Verify Swagger documentation credentials.
    Uses constant-time comparison to prevent timing attacks.
    """
    expected_username = settings.swagger_username
    expected_password = settings.swagger_password

    # Constant-time comparison
    username_match = secrets.compare_digest(username, expected_username)
    password_match = secrets.compare_digest(password, expected_password)

    return username_match and password_match
