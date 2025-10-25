"""Team invitation routes."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta, timezone
import sys
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.invitation import Invitation, InvitationCreate, InvitationStatus
from shared.models.user import NotificationSettings, UserRole
from shared.models.tenant import PLAN_LIMITS, SubscriptionPlan
from shared.pubsub.publisher import publish_invitation_created
from typing import List
import logging

logger = logging.getLogger(__name__)


router = APIRouter()


@router.post("", response_model=Invitation, status_code=201)
async def create_invitation(
    invitation_data: InvitationCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new team invitation with partner limit validation."""
    db = get_firestore()

    # Get tenant to check subscription plan and partner limits
    tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(invitation_data.tenant_id).get()
    if not tenant_doc.exists:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant_data = tenant_doc.to_dict()
    subscription_plan = SubscriptionPlan(tenant_data.get("subscription_plan", "starter"))
    plan_limits = PLAN_LIMITS.get(subscription_plan, PLAN_LIMITS[SubscriptionPlan.STARTER])
    max_partners = plan_limits["max_partners"]

    # Count current partners + pending invitations
    users_ref = db.collection(FirestoreCollections.USERS)
    current_partners_query = await users_ref.where("tenant_ids", "array_contains", invitation_data.tenant_id).get()
    current_partner_count = len(current_partners_query)

    # Count pending invitations
    invitations_ref = db.collection(FirestoreCollections.INVITATIONS)
    pending_invitations_query = await invitations_ref.where("tenant_id", "==", invitation_data.tenant_id).where("status", "==", InvitationStatus.PENDING.value).get()
    pending_count = len(pending_invitations_query)

    total_count = current_partner_count + pending_count

    # Check partner limit (unless unlimited)
    if max_partners != -1 and total_count >= max_partners:
        raise HTTPException(
            status_code=400,
            detail=f"Partner limit reached. Your {subscription_plan.value} plan allows {max_partners} partners. You currently have {current_partner_count} partners and {pending_count} pending invitations."
        )

    # Check for duplicate pending invitations
    duplicate_query = await invitations_ref.where("tenant_id", "==", invitation_data.tenant_id).where("email", "==", invitation_data.email).where("status", "==", InvitationStatus.PENDING.value).limit(1).get()
    if len(duplicate_query) > 0:
        raise HTTPException(status_code=400, detail="An invitation has already been sent to this email")

    # Check if user with this email already exists in tenant
    existing_user_query = await users_ref.where("email", "==", invitation_data.email).limit(1).get()
    if len(existing_user_query) > 0:
        user_data = existing_user_query[0].to_dict()
        if invitation_data.tenant_id in user_data.get("tenant_ids", []):
            raise HTTPException(status_code=400, detail="User with this email is already a member of this tenant")

    # Create invitation
    invitation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)  # 7-day expiration

    invitation_doc = {
        **invitation_data.model_dump(),
        "invited_by": user_id,
        "status": InvitationStatus.PENDING.value,
        "created_at": now,
        "updated_at": now,
        "expires_at": expires_at,
    }

    await db.collection(FirestoreCollections.INVITATIONS).document(invitation_id).set(invitation_doc)

    # TODO: Send invitation email via Communicator Agent
    # ✅ Publish event for email delivery
    try:
        logger.info(f"Attempting to publish invitation_created for {invitation_id}")
        await publish_invitation_created(
            invitation_id=invitation_id,
            tenant_id=invitation_data.tenant_id,
            email=invitation_data.email,
            partner_name=invitation_data.partner_name,
            invited_by_user_id=user_id,
            role=invitation_data.role,
            expires_at=expires_at.isoformat(), 
        )
        logger.info(f"Publish call completed for {invitation_id}")
    except Exception as e:
        logger.warning(f"Failed to publish invitation email event: {e}")
        # Don't fail the whole request — invitation was saved

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
    if invitation_data["expires_at"] < datetime.now(timezone.utc):
        await invitation_ref.update({"status": InvitationStatus.EXPIRED.value})
        raise HTTPException(status_code=400, detail="Invitation has expired")

    # Update invitation status
    await invitation_ref.update({
        "status": InvitationStatus.ACCEPTED.value,
        "updated_at": datetime.now(timezone.utc),
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


@router.post("/{invitation_id}/resend", response_model=Invitation)
async def resend_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Resend an invitation email."""
    db = get_firestore()
    invitation_ref = db.collection(FirestoreCollections.INVITATIONS).document(invitation_id)
    invitation_doc = await invitation_ref.get()

    if not invitation_doc.exists:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation_data = invitation_doc.to_dict()

    # Only allow resending pending invitations
    if invitation_data["status"] != InvitationStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Can only resend pending invitations")

    # Update expiry and updated_at
    now = datetime.now(timezone.utc)
    new_expires_at = now + timedelta(days=7)

    await invitation_ref.update({
        "updated_at": now,
        "expires_at": new_expires_at,
    })

    # TODO: Resend invitation email via Communicator Agent


    updated_doc = await invitation_ref.get()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)  # 7-day expiration
    # ✅ Publish event for email delivery
    try:
        logger.info(f"Attempting to publish invitation_created for {invitation_id}")
        await publish_invitation_created(
            invitation_id=invitation_id,
            tenant_id=invitation_data["tenant_id"],          # ✅ dict access
            email=invitation_data["email"],
            partner_name=invitation_data["partner_name"],
            invited_by_user_id=user_id,
            role=invitation_data["role"],
            expires_at=expires_at.isoformat(), 
        )
        logger.info(f"Publish call completed for {invitation_id}")
    except Exception as e:
        logger.warning(f"Failed to publish invitation email event: {e}")
        # Don't fail the whole request — invitation was saved

    return Invitation(id=updated_doc.id, **updated_doc.to_dict())


@router.post("/{invitation_id}/cancel", response_model=Invitation)
async def cancel_invitation(
    invitation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Cancel a pending invitation."""
    db = get_firestore()
    invitation_ref = db.collection(FirestoreCollections.INVITATIONS).document(invitation_id)
    invitation_doc = await invitation_ref.get()

    if not invitation_doc.exists:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation_data = invitation_doc.to_dict()

    # Only allow cancelling pending invitations
    if invitation_data["status"] != InvitationStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Can only cancel pending invitations")

    # Verify user is the one who sent the invitation
    if invitation_data["invited_by"] != user_id:
        raise HTTPException(status_code=403, detail="Only the user who sent the invitation can cancel it")

    # Update status to cancelled
    await invitation_ref.update({
        "status": InvitationStatus.CANCELLED.value,
        "updated_at": datetime.now(timezone.utc),
    })

    updated_doc = await invitation_ref.get()
    return Invitation(id=updated_doc.id, **updated_doc.to_dict())
