"""Firebase Authentication middleware and utilities."""
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> Dict[str, Any]:
    """
    Verify Firebase ID token and return decoded token.

    Args:
        credentials: HTTP Bearer token from Authorization header

    Returns:
        Decoded token containing user info

    Raises:
        HTTPException: If token is invalid or expired
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )

    token = credentials.credentials

    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
        )
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )


async def get_current_user_id(token: Dict[str, Any] = Security(verify_firebase_token)) -> str:
    """Extract user ID from verified token."""
    return token.get("uid")


async def get_current_user_email(token: Dict[str, Any] = Security(verify_firebase_token)) -> str:
    """Extract user email from verified token."""
    email = token.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not found in token",
        )
    return email
