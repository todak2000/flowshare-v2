"""API Key authentication for SCADA integration."""
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from typing import Optional, Dict, Any
import logging
import secrets
import hashlib

logger = logging.getLogger(__name__)

# API Key header scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Import at module level to avoid circular imports
_db_client = None


def _get_db():
    """Get Firestore client lazily."""
    global _db_client
    if _db_client is None:
        from ..database import get_firestore
        _db_client = get_firestore()
    return _db_client


def generate_api_key() -> str:
    """
    Generate a secure API key.

    Returns:
        A secure random API key (64 characters)
    """
    return secrets.token_urlsafe(48)  # Generates ~64 char string


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key for secure storage.

    Args:
        api_key: The plain API key

    Returns:
        SHA256 hash of the API key
    """
    return hashlib.sha256(api_key.encode()).hexdigest()


async def verify_api_key(api_key: str = Security(api_key_header)) -> Dict[str, Any]:
    """
    Verify SCADA API key and return associated tenant/key info.

    Args:
        api_key: API key from X-API-Key header

    Returns:
        Dictionary containing tenant_id and api_key_id

    Raises:
        HTTPException: If API key is invalid or inactive
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide X-API-Key header.",
        )

    try:
        db = _get_db()
        from ..database import FirestoreCollections
        from google.cloud.firestore_v1 import FieldFilter
        from datetime import datetime, timezone

        # Hash the provided key to compare with stored hashes
        key_hash = hash_api_key(api_key)

        # Query API keys collection
        api_keys_ref = db.collection(FirestoreCollections.API_KEYS)
        key_query = await api_keys_ref.where(
            filter=FieldFilter("key_hash", "==", key_hash)
        ).where(
            filter=FieldFilter("is_active", "==", True)
        ).limit(1).get()

        if not key_query:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
            )

        key_doc = key_query[0]
        key_data = key_doc.to_dict()

        # Check if key has expired
        if key_data.get("expires_at"):
            expires_at = key_data["expires_at"]
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key has expired",
                )

        # Update last_used_at timestamp
        await key_doc.reference.update({
            "last_used_at": datetime.now(timezone.utc)
        })

        return {
            "tenant_id": key_data.get("tenant_id"),
            "api_key_id": key_doc.id,
            "key_name": key_data.get("name"),
            "environment": key_data.get("environment", "test"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API key verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key verification failed",
        )


async def get_tenant_from_api_key(api_key_info: Dict[str, Any] = Security(verify_api_key)) -> Dict[str, Any]:
    """
    Extract API key information from verified API key.

    Args:
        api_key_info: Verified API key information

    Returns:
        Dictionary with tenant_id and environment
    """
    return api_key_info
