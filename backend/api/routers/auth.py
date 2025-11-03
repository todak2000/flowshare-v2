"""Authentication routes."""
from fastapi import APIRouter, HTTPException, Depends, Body
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel
from google.cloud import firestore
import sys
import os
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id, get_current_user_email
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import User, UserCreate, UserRole
from shared.models.tenant import Tenant, TenantCreate, SubscriptionPlan, TenantSettings
from shared.validation import (
    normalize_email,
    ValidatedRegisterRequest,
    ValidatedInviteeRegisterRequest
)

router = APIRouter()


class RegisterRequest(BaseModel):
    """Registration request payload (for backwards compatibility)."""
    full_name: str
    tenant_name: str
    phone_number: str
    role: str = "coordinator"
    subscription_plan: str = "starter"
    payment_data: Optional[Dict[str, Any]] = None


class RegisterInviteeRequest(BaseModel):
    """Invitee registration request payload (for backwards compatibility)."""
    full_name: str
    phone_number: str
    invitation_id: str


@router.post("/register", response_model=Dict[str, Any])
async def register_user(
    request: RegisterRequest = Body(...),
    firebase_uid: str = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email),
):
    """
    Register a new user and create tenant after Firebase authentication.
    This is called after the user signs up via Firebase Auth and completes payment on the frontend.
    """
    # Validate and sanitize inputs
    try:
        validated_request = ValidatedRegisterRequest(**request.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Normalize email for case-insensitive matching
    normalized_email = normalize_email(email)

    db = get_firestore()
    

    # Check if user already exists by firebase_uid OR normalized email
    users_ref = db.collection(FirestoreCollections.USERS)
    existing_user = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

    # Also check by normalized email
    if len(existing_user) == 0:
        existing_by_email = await users_ref.where("normalized_email", "==", normalized_email).limit(1).get()
        if len(existing_by_email) > 0:
            existing_user = existing_by_email

    if len(existing_user) > 0:
        # User already registered, return existing user and tenant
        user_data = existing_user[0].to_dict()
        user = User(id=existing_user[0].id, **user_data)

        # Get user's tenant(s)
        tenant_ids = user_data.get("tenant_ids", [])
        tenant_data = None
        if tenant_ids:
            tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_ids[0]).get()
            if tenant_doc.exists:
                tenant_data = Tenant(id=tenant_doc.id, **tenant_doc.to_dict())

        return {
            "user": user.model_dump(),
            "tenant": tenant_data.model_dump() if tenant_data else None
        }

    # Create new tenant first
    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Parse subscription plan (already validated)
    sub_plan = SubscriptionPlan(validated_request.subscription_plan)

    tenant_data = TenantCreate(
        name=validated_request.tenant_name,
        owner_id=user_id,
        subscription_plan=sub_plan
    )

    tenant_doc = {
        **tenant_data.model_dump(),
        "settings": TenantSettings().model_dump(),
        "status": "active",
        "partner_ids": [],  # Track all partner user IDs
        "field_operator_ids": [],  # Track all field operator user IDs
        "created_at": now,
        "updated_at": now,
    }

    # Store payment data if provided
    if request.payment_data:
        tenant_doc["payment_info"] = {
            "last_payment": request.payment_data,
            "payment_history": [request.payment_data]
        }

    print(f"📝 Creating tenant in Firestore:")
    print(f"   Collection: {FirestoreCollections.TENANTS}")
    print(f"   Tenant ID: {tenant_id}")
    print(f"   Tenant Name: {request.tenant_name}")
    print(f"   Owner ID: {user_id}")
    print(f"   Subscription Plan: {sub_plan.value}")

    try:
        await db.collection(FirestoreCollections.TENANTS).document(tenant_id).set(tenant_doc)
        print(f"✅ Tenant document created successfully in '{FirestoreCollections.TENANTS}' collection")

        # Verify the tenant was saved
        verify_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()
        if verify_doc.exists:
            print(f"✅ Tenant document verified in Firestore: {tenant_id}")
        else:
            print(f"❌ WARNING: Tenant document not found after creation: {tenant_id}")
    except Exception as e:
        print(f"❌ ERROR saving tenant to Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create tenant: {str(e)}")

    # Create new user and link to tenant
    user_data = UserCreate(
        email=normalized_email,  # Use normalized email
        full_name=validated_request.full_name,
        phone_number=validated_request.phone_number,
        firebase_uid=firebase_uid,
        role=UserRole(validated_request.role),
        tenant_ids=[tenant_id]
    )

    user_doc = {
        **user_data.model_dump(),
        "normalized_email": normalized_email,  # Store normalized email for queries
        "organization": validated_request.tenant_name,  # Store tenant/company name as organization
        "created_at": now,
        "updated_at": now,
    }

    print(f"📝 Creating user in Firestore:")
    print(f"   Collection: {FirestoreCollections.USERS}")
    print(f"   User ID: {user_id}")
    print(f"   Email: {email}")
    print(f"   Tenant IDs: {[tenant_id]}")

    try:
        await users_ref.document(user_id).set(user_doc)
        print(f"✅ User document created successfully in '{FirestoreCollections.USERS}' collection")

        # Verify the user was saved
        verify_user = await users_ref.document(user_id).get()
        if verify_user.exists:
            print(f"✅ User document verified in Firestore: {user_id}")
        else:
            print(f"❌ WARNING: User document not found after creation: {user_id}")
    except Exception as e:
        print(f"❌ ERROR saving user to Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    # Return both user and tenant
    created_user = User(id=user_id, **user_doc)
    created_tenant = Tenant(id=tenant_id, **tenant_doc)

    return {
        "user": created_user.model_dump(),
        "tenant": created_tenant.model_dump()
    }


@router.post("/register-invitee", response_model=Dict[str, Any])
async def register_invitee(
    request: RegisterInviteeRequest = Body(...),
    firebase_uid: str = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email),
):
    """
    Register a new user as an invitee (partner, field operator, auditor).
    This is called after the user accepts an invitation and completes Firebase authentication.
    No payment required, no tenant creation. User joins existing tenant.
    """
    # Validate and sanitize inputs
    try:
        validated_request = ValidatedInviteeRegisterRequest(**request.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Normalize email for case-insensitive matching
    normalized_email = normalize_email(email)

    db = get_firestore()

    # Check if user already exists
    users_ref = db.collection(FirestoreCollections.USERS)
    existing_user = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

    # Also check by normalized email
    if len(existing_user) == 0:
        existing_by_email = await users_ref.where("normalized_email", "==", normalized_email).limit(1).get()
        if len(existing_by_email) > 0:
            existing_user = existing_by_email

    if len(existing_user) > 0:
        raise HTTPException(status_code=400, detail="User already registered")

    # Get invitation
    invitation_ref = db.collection(FirestoreCollections.INVITATIONS).document(request.invitation_id)
    invitation_doc = await invitation_ref.get()

    if not invitation_doc.exists:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation_data = invitation_doc.to_dict()

    # Verify invitation status
    if invitation_data["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invitation is not pending")

    # Verify email matches (case-insensitive)
    invitation_email_normalized = normalize_email(invitation_data["email"])
    if invitation_email_normalized != normalized_email:
        raise HTTPException(status_code=400, detail="Email does not match invitation")

    # Check if expired
    if invitation_data["expires_at"] < datetime.now(timezone.utc):
        await invitation_ref.update({"status": "expired"})
        raise HTTPException(status_code=400, detail="Invitation has expired")

    # Create new user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Determine partner_id and organization based on role
    role = UserRole(invitation_data["role"])
    partner_id = None
    organization = invitation_data.get("partner_name")  # Company name from invitation

    if role == UserRole.PARTNER:
        # Partners: their partner_id is their own user_id (they ARE the partner)
        partner_id = user_id
        # Organization is the company name provided in invitation
    elif role == UserRole.FIELD_OPERATOR:
        # Field operators: partner_id is from invitation (the partner who invited them)
        partner_id = invitation_data.get("partner_id")
        # Organization is inherited from their partner

    user_data = UserCreate(
        email=normalized_email,  # Use normalized email
        full_name=validated_request.full_name,
        phone_number=validated_request.phone_number,
        firebase_uid=firebase_uid,
        role=role,
        tenant_ids=[invitation_data["tenant_id"]],
        partner_id=partner_id
    )

    user_doc = {
        **user_data.model_dump(),
        "normalized_email": normalized_email,  # Store normalized email for queries
        "organization": organization,  # Store company/organization name
        "notification_settings": invitation_data.get("notification_settings", {}),
        "created_at": now,
        "updated_at": now,
    }

    # Add field_operator_ids array for partners
    if role == UserRole.PARTNER:
        user_doc["field_operator_ids"] = []  # Track field operators for this partner

    print(f"📝 Creating invitee user in Firestore:")
    print(f"   User ID: {user_id}")
    print(f"   Email: {email}")
    print(f"   Role: {invitation_data['role']}")
    print(f"   Partner ID: {partner_id}")
    print(f"   Organization: {organization}")
    print(f"   Tenant ID: {invitation_data['tenant_id']}")

    try:
        await users_ref.document(user_id).set(user_doc)
        print(f"✅ Invitee user created successfully")

        # Update invitation status to accepted
        await invitation_ref.update({
            "status": "accepted",
            "updated_at": now,
        })
        print(f"✅ Invitation marked as accepted")

        # Update tenant document with new partner or field operator
        tenant_ref = db.collection(FirestoreCollections.TENANTS).document(invitation_data["tenant_id"])

        if role == UserRole.PARTNER:
            # Add partner ID to tenant's partner_ids array
            await tenant_ref.update({
                "partner_ids": firestore.ArrayUnion([user_id]),
                "updated_at": now,
            })
            print(f"✅ Added partner {user_id} to tenant partner_ids")

        elif role == UserRole.FIELD_OPERATOR:
            # Add field operator ID to tenant's field_operator_ids array
            await tenant_ref.update({
                "field_operator_ids": firestore.ArrayUnion([user_id]),
                "updated_at": now,
            })
            print(f"✅ Added field operator {user_id} to tenant field_operator_ids")

            # Also add to the partner's field_operator_ids array
            if partner_id:
                partner_ref = users_ref.document(partner_id)
                await partner_ref.update({
                    "field_operator_ids": firestore.ArrayUnion([user_id]),
                    "updated_at": now,
                })
                print(f"✅ Added field operator {user_id} to partner {partner_id} field_operator_ids")

        # Get tenant info
        tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(invitation_data["tenant_id"]).get()
        tenant_data = None
        if tenant_doc.exists:
            tenant_data = Tenant(id=tenant_doc.id, **tenant_doc.to_dict())

        created_user = User(id=user_id, **user_doc)

        return {
            "user": created_user.model_dump(),
            "tenant": tenant_data.model_dump() if tenant_data else None
        }
    except Exception as e:
        print(f"❌ ERROR creating invitee user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to register invitee: {str(e)}")


@router.get("/me", response_model=User)
async def get_current_user(
    firebase_uid: str = Depends(get_current_user_id),
):
    """Get current authenticated user and update last login timestamp."""
    db = get_firestore()
    users_ref = db.collection(FirestoreCollections.USERS)

    # Find user by Firebase UID
    users = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

    if len(users) == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc_ref = users[0].reference
    user_data = users[0].to_dict()

    # Update last login timestamp
    now = datetime.now(timezone.utc)
    await user_doc_ref.update({
        "last_login_at": now,
        "updated_at": now,
    })

    # Add last_login_at to response
    user_data["last_login_at"] = now

    # Fetch tenant's subscription plan
    tenant_ids = user_data.get("tenant_ids", [])
    if tenant_ids:
        try:
            tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_ids[0]).get()
            if tenant_doc.exists:
                tenant_data = tenant_doc.to_dict()
                user_data["subscription_plan"] = tenant_data.get("subscription_plan", "starter")
        except Exception as e:
            print(f"Warning: Failed to fetch tenant subscription plan: {e}")
            user_data["subscription_plan"] = "starter"
    else:
        user_data["subscription_plan"] = "starter"

    return User(id=users[0].id, **user_data)


@router.get("/users/by-email")
async def get_user_by_email(email: str):
    """
    Get user by email (for demo/admin purposes).
    WARNING: This endpoint bypasses authentication - use only for demo/testing.
    """
    # Normalize email for case-insensitive lookup
    normalized_email = normalize_email(email)

    db = get_firestore()
    users_ref = db.collection(FirestoreCollections.USERS)

    # Find user by normalized email
    users = await users_ref.where("normalized_email", "==", normalized_email).limit(1).get()

    if len(users) == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = users[0].to_dict()
    return {
        "id": users[0].id,
        **user_data
    }
