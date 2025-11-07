"""Tenant management routes."""
from fastapi import APIRouter, HTTPException, Depends, Body
from datetime import datetime, timezone
import sys
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.tenant import Tenant, TenantCreate, TenantUpdate, TenantSettings
from typing import List

router = APIRouter()


@router.get("/me", response_model=Tenant)
async def get_my_tenant(
    user_id: str = Depends(get_current_user_id),
):
    """Get the current user's primary tenant."""
    db = get_firestore()

    # Get user's tenant_ids
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_query[0].to_dict()
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        raise HTTPException(status_code=404, detail="User has no tenant")

    # Get the first (primary) tenant
    tenant_id = tenant_ids[0]
    tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()

    if not tenant_doc.exists:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = tenant_doc.to_dict()
    tenant.pop('id', None)
    return Tenant(id=tenant_doc.id, **tenant)


@router.patch("/me", response_model=Tenant)
async def update_my_tenant(
    tenant_update: TenantUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Update the current user's primary tenant."""
    db = get_firestore()

    # Get user's tenant_ids
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_query[0].to_dict()
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        raise HTTPException(status_code=404, detail="User has no tenant")

    # Update the first (primary) tenant
    tenant_id = tenant_ids[0]
    tenant_ref = db.collection(FirestoreCollections.TENANTS).document(tenant_id)
    tenant_doc = await tenant_ref.get()

    if not tenant_doc.exists:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Update only provided fields
    update_data = tenant_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)

    await tenant_ref.update(update_data)

    # Fetch updated tenant
    updated_doc = await tenant_ref.get()
    return Tenant(id=updated_doc.id, **updated_doc.to_dict())


@router.post("", response_model=Tenant, status_code=201)
async def create_tenant(
    tenant_data: TenantCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new tenant."""
    db = get_firestore()
    tenant_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    tenant_doc = {
        **tenant_data.model_dump(),
        "owner_id": user_id,
        "settings": TenantSettings().model_dump(),
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }

    await db.collection(FirestoreCollections.TENANTS).document(tenant_id).set(tenant_doc)

    # Update user's tenant_ids
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()
    if user_query:
        user_doc_ref = user_query[0].reference
        user_data = user_query[0].to_dict()
        tenant_ids = user_data.get("tenant_ids", [])
        tenant_ids.append(tenant_id)
        await user_doc_ref.update({"tenant_ids": tenant_ids})

    return Tenant(id=tenant_id, **tenant_doc)


@router.get("", response_model=List[Tenant])
async def list_tenants(
    user_id: str = Depends(get_current_user_id),
):
    """List all tenants for the current user."""
    db = get_firestore()

    # Get user's tenant_ids
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()

    if not user_query:
        return []

    user_data = user_query[0].to_dict()
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        return []

    # Fetch all tenants
    tenants = []
    tenants_ref = db.collection(FirestoreCollections.TENANTS)
    for tenant_id in tenant_ids:
        tenant_doc = await tenants_ref.document(tenant_id).get()
        if tenant_doc.exists:
            tenant = tenant_doc.to_dict()
            tenant.pop('id', None)
            tenants.append(Tenant(id=tenant_doc.id, **tenant))

    return tenants


@router.get("/{tenant_id}", response_model=Tenant)
async def get_tenant(
    tenant_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get a specific tenant."""
    db = get_firestore()
    tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()

    if not tenant_doc.exists:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = tenant_doc.to_dict()
    tenant.pop('id', None)
    return Tenant(id=tenant_doc.id, **tenant)


@router.patch("/{tenant_id}", response_model=Tenant)
async def update_tenant(
    tenant_id: str,
    tenant_update: TenantUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Update tenant details."""
    db = get_firestore()
    tenant_ref = db.collection(FirestoreCollections.TENANTS).document(tenant_id)
    tenant_doc = await tenant_ref.get()

    if not tenant_doc.exists:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Update only provided fields
    update_data = tenant_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)

    await tenant_ref.update(update_data)

    # Fetch updated tenant
    updated_doc = await tenant_ref.get()
    return Tenant(id=updated_doc.id, **updated_doc.to_dict())


@router.get("/{tenant_id}/settings", response_model=TenantSettings)
async def get_tenant_settings(
    tenant_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get tenant settings."""
    db = get_firestore()
    tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()

    if not tenant_doc.exists:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant_data = tenant_doc.to_dict()
    return TenantSettings(**tenant_data.get("settings", {}))


@router.patch("/{tenant_id}/settings", response_model=TenantSettings)
async def update_tenant_settings(
    tenant_id: str,
    settings: TenantSettings,
    user_id: str = Depends(get_current_user_id),
):
    """Update tenant settings."""
    db = get_firestore()
    tenant_ref = db.collection(FirestoreCollections.TENANTS).document(tenant_id)
    tenant_doc = await tenant_ref.get()

    if not tenant_doc.exists:
        raise HTTPException(status_code=404, detail="Tenant not found")

    await tenant_ref.update({
        "settings": settings.model_dump(),
        "updated_at": datetime.now(timezone.utc),
    })

    return settings
