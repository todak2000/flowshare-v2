"""API Key management routes for SCADA integration."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import sys
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.auth.api_key_auth import generate_api_key, hash_api_key
from shared.database import get_firestore, FirestoreCollections
from shared.models.api_key import APIKey, APIKeyCreate, APIKeyInfo
from typing import List

router = APIRouter()


@router.post("", response_model=APIKey, status_code=201)
async def create_api_key(
    tenant_id: str,
    api_key_data: APIKeyCreate,
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a new API key for SCADA integration.

    **Important**: The actual API key is only returned once at creation.
    Store it securely - you won't be able to retrieve it again.
    """
    db = get_firestore()

    # Generate a new API key
    api_key = generate_api_key()
    key_hash = hash_api_key(api_key)
    key_prefix = api_key[:8]

    # Create API key document
    api_key_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    api_key_doc = {
        "tenant_id": tenant_id,
        "name": api_key_data.name,
        "description": api_key_data.description,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "environment": api_key_data.environment,
        "is_active": True,
        "created_by": user_id,
        "created_at": now,
        "last_used_at": None,
        "expires_at": None,  # No expiration by default
    }

    await db.collection(FirestoreCollections.API_KEYS).document(api_key_id).set(api_key_doc)

    # Return the key WITH the actual key value (only time it's exposed)
    return APIKey(
        id=api_key_id,
        key=api_key,  # ONLY returned at creation
        **api_key_doc
    )


@router.get("", response_model=List[APIKeyInfo])
async def list_api_keys(
    tenant_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    List all API keys for a tenant (without exposing the actual keys).
    """
    db = get_firestore()

    api_keys_ref = db.collection(FirestoreCollections.API_KEYS)
    query = await api_keys_ref.where("tenant_id", "==", tenant_id).order_by("created_at", direction="DESCENDING").get()

    api_keys = []
    for doc in query:
        api_keys.append(APIKeyInfo(id=doc.id, **doc.to_dict()))

    return api_keys


@router.delete("/{api_key_id}")
async def revoke_api_key(
    api_key_id: str,
    tenant_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Revoke (deactivate) an API key.
    """
    db = get_firestore()

    api_key_ref = db.collection(FirestoreCollections.API_KEYS).document(api_key_id)
    api_key_doc = await api_key_ref.get()

    if not api_key_doc.exists:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key_data = api_key_doc.to_dict()

    # Verify tenant ownership
    if api_key_data.get("tenant_id") != tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this API key")

    # Deactivate the key
    await api_key_ref.update({
        "is_active": False,
        "revoked_at": datetime.now(timezone.utc),
        "revoked_by": user_id,
    })

    return {"message": "API key revoked successfully"}


@router.patch("/{api_key_id}/activate")
async def activate_api_key(
    api_key_id: str,
    tenant_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Reactivate a previously revoked API key.
    """
    db = get_firestore()

    api_key_ref = db.collection(FirestoreCollections.API_KEYS).document(api_key_id)
    api_key_doc = await api_key_ref.get()

    if not api_key_doc.exists:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key_data = api_key_doc.to_dict()

    # Verify tenant ownership
    if api_key_data.get("tenant_id") != tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized to activate this API key")

    # Activate the key
    await api_key_ref.update({
        "is_active": True,
        "reactivated_at": datetime.now(timezone.utc),
        "reactivated_by": user_id,
    })

    return {"message": "API key activated successfully"}
