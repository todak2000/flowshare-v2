"""Reconciliation routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
import sys
import uuid

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.models.reconciliation import Reconciliation, ReconciliationCreate, ReconciliationStatus
from shared.pubsub import publish_reconciliation_triggered
from typing import List

router = APIRouter()


@router.post("", response_model=Reconciliation, status_code=201)
async def trigger_reconciliation(
    reconciliation_data: ReconciliationCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Trigger a new reconciliation run."""
    db = get_firestore()
    reconciliation_id = str(uuid.uuid4())
    now = datetime.utcnow()

    reconciliation_doc = {
        **reconciliation_data.model_dump(),
        "triggered_by": user_id,
        "status": ReconciliationStatus.PENDING.value,
        "created_at": now,
    }

    await db.collection(FirestoreCollections.RECONCILIATIONS).document(reconciliation_id).set(reconciliation_doc)

    # Publish event for Accountant Agent to process
    await publish_reconciliation_triggered(
        reconciliation_id=reconciliation_id,
        tenant_id=reconciliation_data.tenant_id,
    )

    return Reconciliation(id=reconciliation_id, **reconciliation_doc)


@router.get("", response_model=List[Reconciliation])
async def list_reconciliations(
    tenant_id: str = Query(...),
    status: ReconciliationStatus = Query(None),
    limit: int = Query(50, le=500),
    user_id: str = Depends(get_current_user_id),
):
    """List reconciliations for a tenant."""
    db = get_firestore()
    reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)

    # Build query
    query = reconciliations_ref.where("tenant_id", "==", tenant_id)

    if status:
        query = query.where("status", "==", status.value)

    # Execute query
    query = query.order_by("created_at", direction="DESCENDING").limit(limit)
    reconciliations_query = await query.get()

    reconciliations = []
    for doc in reconciliations_query:
        reconciliations.append(Reconciliation(id=doc.id, **doc.to_dict()))

    return reconciliations


@router.get("/{reconciliation_id}", response_model=Reconciliation)
async def get_reconciliation(
    reconciliation_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get a specific reconciliation."""
    db = get_firestore()
    reconciliation_doc = await db.collection(FirestoreCollections.RECONCILIATIONS).document(reconciliation_id).get()

    if not reconciliation_doc.exists:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    return Reconciliation(id=reconciliation_doc.id, **reconciliation_doc.to_dict())
