"""Team invitation routes."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
import sys
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.invitation import Invitation, InvitationCreate, InvitationStatus
from shared.models.user import NotificationSettings
from typing import List

router = APIRouter()


@router.post("", response_model=Invitation, status_code=201)
async def create_invitation(
    invitation_data: InvitationCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new team invitation."""
    db = get_firestore()
    invitation_id = str(uuid.uuid4())
    now = datetime.utcnow()
    expires_at = now + timedelta(days=7)  # 7-day expiration

    invitation_doc = {
        **invitation_data.model_dump(),
        "invited_by": user_id,
        "status": InvitationStatus.PENDING.value,
        "created_at": now,
        "expires_at": expires_at,
    }

    await db.collection(FirestoreCollections.INVITATIONS).document(invitation_id).set(invitation_doc)

    # TODO: Send invitation email via Communicator Agent

    return Invitation(id=invitation_id, **invitation_doc)


@router.get("", response_model=List[Invitation])
async def list_invitations(
    tenant_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """List all invitations for a tenant."""
    db = get_firestore()
    invitations_ref = db.collection(FirestoreCollections.INVITATIONS)

    invitations_query = await invitations_ref.where("tenant_id", "==", tenant_id).get()

    invitations = []
    for doc in invitations_query:
        invitations.append(Invitation(id=doc.id, **doc.to_dict()))

    return invitations


@router.get("/{invitation_id}", response_model=Invitation)
async def get_invitation(invitation_id: str):
    """Get invitation by ID."""
    db = get_firestore()
    invitation_doc = await db.collection(FirestoreCollections.INVITATIONS).document(invitation_id).get()

    if not invitation_doc.exists:
        raise HTTPException(status_code=404, detail="Invitation not found")

    return Invitation(id=invitation_doc.id, **invitation_doc.to_dict())


@router.post("/{invitation_id}/accept", response_model=Invitation)
async def accept_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Accept an invitation."""
    db = get_firestore()
    invitation_ref = db.collection(FirestoreCollections.INVITATIONS).document(invitation_id)
    invitation_doc = await invitation_ref.get()

    if not invitation_doc.exists:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation_data = invitation_doc.to_dict()

    # Check if expired
    if invitation_data["expires_at"] < datetime.utcnow():
        await invitation_ref.update({"status": InvitationStatus.EXPIRED.value})
        raise HTTPException(status_code=400, detail="Invitation has expired")

    # Update invitation status
    await invitation_ref.update({
        "status": InvitationStatus.ACCEPTED.value,
        "updated_at": datetime.utcnow(),
    })

    # Add user to tenant
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()

    if user_query:
        user_doc_ref = user_query[0].reference
        user_data = user_query[0].to_dict()
        tenant_ids = user_data.get("tenant_ids", [])
        if invitation_data["tenant_id"] not in tenant_ids:
            tenant_ids.append(invitation_data["tenant_id"])
            await user_doc_ref.update({
                "tenant_ids": tenant_ids,
                "role": invitation_data["role"],
                "partner_id": invitation_data.get("partner_id"),
                "notification_settings": invitation_data.get("notification_settings", NotificationSettings().model_dump()),
            })

    # Return updated invitation
    updated_doc = await invitation_ref.get()
    return Invitation(id=updated_doc.id, **updated_doc.to_dict())
