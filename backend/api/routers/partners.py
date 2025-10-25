# routes/partners.py
"""Partner (tenant user) management routes."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import sys

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import User

router = APIRouter()


@router.get("", response_model=List[User])
async def list_partners(
    user_id: str = Depends(get_current_user_id),
):
    """
    List all partners (users) in the current user's primary tenant.
    """
    db = get_firestore()

    # Get current user to find their tenant_ids
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_query[0].to_dict()
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        return []  # No tenant, no partners

    # Get primary tenant (first one)
    primary_tenant_id = tenant_ids[0]

    # Find all users in the same tenant
    partners_query = await users_ref.where("tenant_ids", "array_contains", primary_tenant_id).get()

    partners = []
    for doc in partners_query:
        # Exclude the current user if desired (optional)
        partners.append(User(id=doc.id, **doc.to_dict()))

    return partners