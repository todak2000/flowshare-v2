"""Authentication routes."""
from fastapi import APIRouter, HTTPException, Depends, Body
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel
import sys
import os
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id, get_current_user_email
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import User, UserCreate, UserRole
from shared.models.tenant import Tenant, TenantCreate, SubscriptionPlan, TenantSettings

router = APIRouter()


class RegisterRequest(BaseModel):
    """Registration request payload."""
    full_name: str
    tenant_name: str
    phone_number: str
    role: str = "coordinator"
    subscription_plan: str = "starter"
    payment_data: Optional[Dict[str, Any]] = None


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
    db = get_firestore()
    print(f"Firestore client project: {db.project}")
    print(f"Emulator host: {os.getenv('FIRESTORE_EMULATOR_HOST')}")
    # Check if user already exists
    users_ref = db.collection(FirestoreCollections.USERS)
    existing_user = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

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

    # Parse subscription plan
    try:
        sub_plan = SubscriptionPlan(request.subscription_plan)
    except ValueError:
        sub_plan = SubscriptionPlan.STARTER

    tenant_data = TenantCreate(
        name=request.tenant_name,
        owner_id=user_id,
        subscription_plan=sub_plan
    )

    tenant_doc = {
        **tenant_data.model_dump(),
        "settings": TenantSettings().model_dump(),
        "status": "active",
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
        email=email,
        full_name=request.full_name,
        phone_number=request.phone_number,
        firebase_uid=firebase_uid,
        role=UserRole(request.role),
        tenant_ids=[tenant_id]
    )

    user_doc = {
        **user_data.model_dump(),
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


@router.get("/me", response_model=User)
async def get_current_user(
    firebase_uid: str = Depends(get_current_user_id),
):
    """Get current authenticated user."""
    db = get_firestore()
    users_ref = db.collection(FirestoreCollections.USERS)

    # Find user by Firebase UID
    users = await users_ref.where("firebase_uid", "==", firebase_uid).limit(1).get()

    if len(users) == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = users[0].to_dict()
    return User(id=users[0].id, **user_data)
