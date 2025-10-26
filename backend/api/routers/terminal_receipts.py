"""Terminal receipt routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone, timedelta
import sys
import uuid
from typing import Dict, Any

sys.path.append("../..")

from shared.auth import get_current_user_id, get_user_role
from shared.database import get_firestore, FirestoreCollections
from shared.models.terminal_receipt import TerminalReceipt, TerminalReceiptCreate
from shared.models.user import UserRole
from shared.models.reconciliation import ReconciliationStatus
from shared.pubsub import publish_reconciliation_triggered

router = APIRouter()


@router.post("", response_model=TerminalReceipt, status_code=201)
async def create_terminal_receipt(
    receipt_data: TerminalReceiptCreate,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """Create a new terminal receipt (coordinator only)."""
    if user_role != UserRole.COORDINATOR:
        raise HTTPException(
            status_code=403,
            detail="Only coordinators can create terminal receipts"
        )

    db = get_firestore()
    receipt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    receipt_doc = {
        **receipt_data.model_dump(),
        "created_by": user_id,
        "created_at": now,
        "updated_at": now,
    }

    await db.collection(FirestoreCollections.TERMINAL_RECEIPTS).document(receipt_id).set(receipt_doc)

    # Automatically trigger reconciliation
    # Calculate period (e.g., from start of month to receipt date)
    receipt_date = receipt_data.receipt_date
    period_start = receipt_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = receipt_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    reconciliation_id = str(uuid.uuid4())
    reconciliation_doc = {
        "tenant_id": receipt_data.tenant_id,
        "triggered_by": user_id,
        "period_start": period_start,
        "period_end": period_end,
        "terminal_volume": receipt_data.terminal_volume,
        "status": ReconciliationStatus.PENDING.value,
        "created_at": now,
        "terminal_receipt_id": receipt_id,
    }

    await db.collection(FirestoreCollections.RECONCILIATIONS).document(reconciliation_id).set(reconciliation_doc)

    # Publish event for Accountant Agent to process
    await publish_reconciliation_triggered(
        reconciliation_id=reconciliation_id,
        tenant_id=receipt_data.tenant_id,
    )

    return TerminalReceipt(id=receipt_id, **receipt_doc)


@router.get("", response_model=Dict[str, Any])
async def list_terminal_receipts(
    tenant_id: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=50),
    user_id: str = Depends(get_current_user_id),
):
    """List terminal receipts for a tenant with pagination."""
    db = get_firestore()
    receipts_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS)

    # Build base query
    query = receipts_ref.where("tenant_id", "==", tenant_id)
    query = query.order_by("receipt_date", direction="DESCENDING")

    # Get total count (for pagination metadata)
    all_receipts = await query.get()
    total_count = len(all_receipts)

    # Calculate pagination
    total_pages = (total_count + page_size - 1) // page_size
    offset = (page - 1) * page_size

    # Get paginated results
    paginated_receipts = all_receipts[offset:offset + page_size]

    receipts = []
    for doc in paginated_receipts:
        receipts.append(TerminalReceipt(id=doc.id, **doc.to_dict()).model_dump())

    return {
        "data": receipts,
        "pagination": {
            "current_page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    }


@router.get("/{receipt_id}", response_model=TerminalReceipt)
async def get_terminal_receipt(
    receipt_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get a specific terminal receipt."""
    db = get_firestore()
    receipt_doc = await db.collection(FirestoreCollections.TERMINAL_RECEIPTS).document(receipt_id).get()

    if not receipt_doc.exists:
        raise HTTPException(status_code=404, detail="Terminal receipt not found")

    return TerminalReceipt(id=receipt_doc.id, **receipt_doc.to_dict())


@router.delete("/{receipt_id}", status_code=204)
async def delete_terminal_receipt(
    receipt_id: str,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """Delete a terminal receipt (coordinator only)."""
    if user_role != UserRole.COORDINATOR:
        raise HTTPException(
            status_code=403,
            detail="Only coordinators can delete terminal receipts"
        )

    db = get_firestore()
    receipt_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS).document(receipt_id)
    receipt_doc = await receipt_ref.get()

    if not receipt_doc.exists:
        raise HTTPException(status_code=404, detail="Terminal receipt not found")

    await receipt_ref.delete()
    return None
