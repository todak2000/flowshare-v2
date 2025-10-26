"""Demo/Admin routes - bypasses authentication for testing."""
from fastapi import APIRouter, HTTPException, Body
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import sys
import uuid
import logging

sys.path.append("../..")

from shared.database import get_firestore, FirestoreCollections
from shared.models.production import ProductionEntry, ProductionEntryCreate, ProductionEntryStatus

router = APIRouter()
logger = logging.getLogger(__name__)


class DemoProductionEntryCreate(BaseModel):
    """Production entry without authentication."""
    tenant_id: str
    partner_id: str
    measurement_date: str
    gross_volume: float
    bsw_percent: float
    temperature: float
    api_gravity: float
    pressure: Optional[float] = None
    meter_factor: float = 1.0


@router.post("/demo/production/entries")
async def create_demo_production_entry(entry: DemoProductionEntryCreate = Body(...)):
    """
    Create production entry without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    db = get_firestore()
    entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    entry_doc = {
        "tenant_id": entry.tenant_id,
        "partner_id": entry.partner_id,
        "submitted_by": entry.partner_id,  # Use partner_id as submitter
        "measurement_date": datetime.fromisoformat(entry.measurement_date.replace('Z', '+00:00')),
        "gross_volume": entry.gross_volume,
        "bsw_percent": entry.bsw_percent,
        "temperature": entry.temperature,
        "api_gravity": entry.api_gravity,
        "pressure": entry.pressure,
        "meter_factor": entry.meter_factor,
        "status": ProductionEntryStatus.APPROVED.value,  # Auto-approve demo data
        "approved_by": entry.partner_id,  # Auto-approve by partner
        "approved_at": now,
        "created_at": now,
        "updated_at": now,
    }

    await entries_ref.document(entry_id).set(entry_doc)

    return {"id": entry_id, **entry_doc}


@router.delete("/demo/production/entries/{entry_id}")
async def delete_demo_production_entry(entry_id: str):
    """
    Delete production entry without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    db = get_firestore()
    entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

    entry_doc = await entries_ref.document(entry_id).get()

    if not entry_doc.exists:
        raise HTTPException(status_code=404, detail="Entry not found")

    await entries_ref.document(entry_id).delete()

    return {"message": "Entry deleted successfully"}


@router.delete("/demo/terminal-receipts/{receipt_id}")
async def delete_demo_terminal_receipt(receipt_id: str):
    """
    Delete terminal receipt without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    db = get_firestore()
    receipts_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS)

    receipt_doc = await receipts_ref.document(receipt_id).get()

    if not receipt_doc.exists:
        raise HTTPException(status_code=404, detail="Receipt not found")

    await receipts_ref.document(receipt_id).delete()

    return {"message": "Receipt deleted successfully"}


@router.delete("/demo/reconciliation/{reconciliation_id}")
async def delete_demo_reconciliation(reconciliation_id: str):
    """
    Delete reconciliation without authentication (for demo/testing only).
    WARNING: This bypasses all auth checks - use only in development.
    """
    db = get_firestore()
    reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)

    reconciliation_doc = await reconciliations_ref.document(reconciliation_id).get()

    if not reconciliation_doc.exists:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    await reconciliations_ref.document(reconciliation_id).delete()

    return {"message": "Reconciliation deleted successfully"}


class BulkDeleteRequest(BaseModel):
    """Request to delete all data for a tenant."""
    tenant_id: str
    password: str


@router.post("/demo/delete-all-data")
async def delete_all_demo_data(request: BulkDeleteRequest = Body(...)):
    """
    Delete all production entries, terminal receipts, and reconciliations for a tenant.
    WARNING: This bypasses all auth checks - use only in development.
    Requires password: FlowShare@Demo2025
    """
    # Verify password
    if request.password != "FlowShare@Demo2025":
        raise HTTPException(status_code=403, detail="Invalid password")

    db = get_firestore()

    deleted_counts = {
        "production_entries": 0,
        "terminal_receipts": 0,
        "reconciliations": 0
    }

    try:
        # Delete production entries
        logger.info(f"Deleting production entries for tenant: {request.tenant_id}")
        production_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        production_query = production_ref.where("tenant_id", "==", request.tenant_id)
        production_docs = await production_query.get()

        for doc in production_docs:
            await doc.reference.delete()
            deleted_counts["production_entries"] += 1

        logger.info(f"Deleted {deleted_counts['production_entries']} production entries")

        # Delete terminal receipts
        logger.info(f"Deleting terminal receipts for tenant: {request.tenant_id}")
        receipts_ref = db.collection(FirestoreCollections.TERMINAL_RECEIPTS)
        receipts_query = receipts_ref.where("tenant_id", "==", request.tenant_id)
        receipts_docs = await receipts_query.get()

        for doc in receipts_docs:
            await doc.reference.delete()
            deleted_counts["terminal_receipts"] += 1

        logger.info(f"Deleted {deleted_counts['terminal_receipts']} terminal receipts")

        # Delete reconciliations
        logger.info(f"Deleting reconciliations for tenant: {request.tenant_id}")
        reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)
        reconciliations_query = reconciliations_ref.where("tenant_id", "==", request.tenant_id)
        reconciliations_docs = await reconciliations_query.get()

        for doc in reconciliations_docs:
            await doc.reference.delete()
            deleted_counts["reconciliations"] += 1

        logger.info(f"Deleted {deleted_counts['reconciliations']} reconciliations")

        return {
            "message": "All demo data deleted successfully",
            "deleted_counts": deleted_counts
        }

    except Exception as e:
        logger.error(f"Error deleting demo data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete data: {str(e)}")
