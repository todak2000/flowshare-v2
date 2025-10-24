"""Production data entry routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
import sys
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.production import ProductionEntry, ProductionEntryCreate, ProductionEntryStatus
from shared.pubsub import publish_production_entry_created
from typing import List, Optional

router = APIRouter()


@router.post("/entries", response_model=ProductionEntry, status_code=201)
async def create_production_entry(
    entry_data: ProductionEntryCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new production entry."""
    db = get_firestore()
    entry_id = str(uuid.uuid4())
    now = datetime.utcnow()

    entry_doc = {
        **entry_data.model_dump(),
        "submitted_by": user_id,
        "status": ProductionEntryStatus.PENDING.value,
        "created_at": now,
        "updated_at": now,
    }

    await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).set(entry_doc)

    # Publish event for Auditor Agent to validate
    await publish_production_entry_created(
        entry_id=entry_id,
        tenant_id=entry_data.tenant_id,
        partner_id=entry_data.partner_id,
    )

    return ProductionEntry(id=entry_id, **entry_doc)


@router.get("/entries", response_model=List[ProductionEntry])
async def list_production_entries(
    tenant_id: str = Query(...),
    partner_id: Optional[str] = Query(None),
    status: Optional[ProductionEntryStatus] = Query(None),
    limit: int = Query(100, le=1000),
    user_id: str = Depends(get_current_user_id),
):
    """List production entries with optional filters."""
    db = get_firestore()
    entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

    # Build query
    query = entries_ref.where("tenant_id", "==", tenant_id)

    if partner_id:
        query = query.where("partner_id", "==", partner_id)

    if status:
        query = query.where("status", "==", status.value)

    # Execute query
    query = query.order_by("created_at", direction="DESCENDING").limit(limit)
    entries_query = await query.get()

    entries = []
    for doc in entries_query:
        entries.append(ProductionEntry(id=doc.id, **doc.to_dict()))

    return entries


@router.get("/entries/{entry_id}", response_model=ProductionEntry)
async def get_production_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get a specific production entry."""
    db = get_firestore()
    entry_doc = await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).get()

    if not entry_doc.exists:
        raise HTTPException(status_code=404, detail="Production entry not found")

    return ProductionEntry(id=entry_doc.id, **entry_doc.to_dict())


@router.delete("/entries/{entry_id}", status_code=204)
async def delete_production_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a production entry."""
    db = get_firestore()
    entry_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id)
    entry_doc = await entry_ref.get()

    if not entry_doc.exists:
        raise HTTPException(status_code=404, detail="Production entry not found")

    await entry_ref.delete()
    return None
