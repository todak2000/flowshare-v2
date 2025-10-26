"""Terminal receipt routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone, timedelta
import sys
import uuid
from typing import Dict, Any, Optional

sys.path.append("../..")

from google.cloud.firestore import Query as FirestoreQueryDirection
from shared.auth import get_current_user_id, get_user_role
from shared.database import get_firestore, FirestoreCollections
from shared.models.terminal_receipt import TerminalReceipt, TerminalReceiptCreate
from shared.models.user import UserRole
from shared.models.reconciliation import ReconciliationStatus
from shared.models.production import ProductionEntryStatus
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

    # Validate terminal volume against approved production
    receipt_date = receipt_data.receipt_date
    period_start = receipt_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = receipt_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Query all approved production entries for the month
    production_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
    production_query = production_ref.where("tenant_id", "==", receipt_data.tenant_id)
    production_query = production_query.where("status", "==", ProductionEntryStatus.APPROVED.value)
    all_entries = await production_query.get()

    # Calculate total approved production for the month
    total_production = 0.0
    for doc in all_entries:
        entry_data = doc.to_dict()
        entry_date = entry_data.get("measurement_date")

        # Filter by date range
        if entry_date and period_start <= entry_date <= period_end:
            gross_volume = entry_data.get("gross_volume", 0)
            bsw_percent = entry_data.get("bsw_percent", 0)
            meter_factor = entry_data.get("meter_factor", 1.0)

            # Calculate net volume
            net_volume = gross_volume * (1 - bsw_percent / 100) * meter_factor
            total_production += net_volume

    # Check if terminal volume exceeds total production
    if receipt_data.terminal_volume > total_production:
        raise HTTPException(
            status_code=400,
            detail=f"Terminal volume ({receipt_data.terminal_volume:.2f} bbls) exceeds total approved production ({total_production:.2f} bbls) for this period. Please adjust the terminal volume to match or be less than the total production."
        )

    receipt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    receipt_doc = {
        **receipt_data.model_dump(),
        "created_by": user_id,
        "created_at": now,
        "updated_at": now,
    }

    await db.collection(FirestoreCollections.TERMINAL_RECEIPTS).document(receipt_id).set(receipt_doc)

    # Automatically trigger reconciliation (period already calculated above for validation)
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


@router.get("/filtered", response_model=Dict[str, Any])
async def list_terminal_receipts_filtered(
    tenant_id: str = Query(...),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),  # treat 'limit' as page_size for simplicity
    user_id: str = Depends(get_current_user_id),
):
    """
    List terminal receipts for a tenant within an optional date range.
    Dates must be in YYYY-MM-DD format.
    Returns up to 'limit' receipts (default: 100), newest first.
    """
    db = get_firestore()
    receipts_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS)

    # Start with tenant filter
    query = receipts_ref.where("tenant_id", "==", tenant_id)

    # Apply date filters if provided
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            # Firestore stores dates as datetime; we compare against date part
            # But Firestore doesn't support date-only queries easily, so assume receipt_date is stored as datetime at start of day
            start_datetime = datetime.combine(start_dt, datetime.min.time())
            query = query.where("receipt_date", ">=", start_datetime)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")

    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
            # Include entire end day → set time to 23:59:59.999999
            end_datetime = datetime.combine(end_dt, datetime.max.time())
            query = query.where("receipt_date", "<=", end_datetime)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")

    # Order by receipt_date descending
    query = query.order_by("receipt_date", direction=FirestoreQueryDirection.DESCENDING).limit(limit)

    # Execute query
    docs = await query.get()

    receipts = []
    for doc in docs:
        doc_dict = doc.to_dict()
        # Optional: validate or sanitize data before dumping
        receipts.append(TerminalReceipt(id=doc.id, **doc_dict).model_dump())

    return {
        "data": receipts,
        "pagination": {
            "current_page": 1,
            "page_size": limit,
            "total_count": len(receipts),
            "total_pages": 1,
            "has_next": False,
            "has_previous": False,
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
