"""Firebase Authentication middleware and utilities."""
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Import at module level to avoid circular imports
_db_client = None

def _get_db():
    """Get Firestore client lazily."""
    global _db_client
    if _db_client is None:
        from ..database import get_firestore
        _db_client = get_firestore()
    return _db_client


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


async def get_user_role(token: Dict[str, Any] = Security(verify_firebase_token)) -> str:
    """
    Get user role from Firestore based on Firebase UID.

    Args:
        token: Verified Firebase token

    Returns:
        User role as string

    Raises:
        HTTPException: If user not found or role not available
    """
    user_id = token.get("uid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    try:
        db = _get_db()
        from ..database import FirestoreCollections
        from google.cloud.firestore_v1 import FieldFilter

        # Query users collection for this Firebase UID
        users_ref = db.collection(FirestoreCollections.USERS)
        user_query = await users_ref.where(filter=FieldFilter("firebase_uid", "==", user_id)).limit(1).get()

        if not user_query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user_data = user_query[0].to_dict()
        role = user_data.get("role")

        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User role not found",
            )

        return role

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user role: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user role",
        )
