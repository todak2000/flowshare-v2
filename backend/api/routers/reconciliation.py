"""Reconciliation routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse, Response
from datetime import datetime
import sys
import uuid
import io
import csv
from typing import List
import calendar
sys.path.append("../..")

from shared.auth import get_current_user_id, get_user_role
from shared.database import get_firestore, FirestoreCollections
from shared.models.reconciliation import Reconciliation, ReconciliationCreate, ReconciliationStatus
from shared.models.user import UserRole
from shared.pubsub import publish_reconciliation_triggered

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


@router.get("/{reconciliation_id}/export/excel")
async def export_reconciliation_excel(
    reconciliation_id: str,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """Export reconciliation as Excel file with 3 sheets: Summary, Allocations, Calculations."""
    # Only coordinators and partners can export
    if user_role not in [UserRole.COORDINATOR, UserRole.PARTNER]:
        raise HTTPException(
            status_code=403,
            detail="Only coordinators and partners can export reconciliation data"
        )

    db = get_firestore()
    reconciliation_doc = await db.collection(FirestoreCollections.RECONCILIATIONS).document(reconciliation_id).get()

    if not reconciliation_doc.exists:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    reconciliation_data = reconciliation_doc.to_dict()
    result = reconciliation_data.get("result")

    if not result:
        raise HTTPException(status_code=400, detail="Reconciliation has no results")

    try:
        from utils.report_generator import generate_excel_report

        excel_content = generate_excel_report(reconciliation_id, reconciliation_data, result)

        # Return as downloadable file
        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=reconciliation_report_{reconciliation_id}.xlsx"
            }
        )
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Excel generation not available: {str(e)}. Install openpyxl package."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel report: {str(e)}")


@router.get("/{reconciliation_id}/export/pdf")
async def export_reconciliation_pdf(
    reconciliation_id: str,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """Export reconciliation summary report as PDF matching sample design."""
    # Only coordinators and partners can export
    if user_role not in [UserRole.COORDINATOR, UserRole.PARTNER]:
        raise HTTPException(
            status_code=403,
            detail="Only coordinators and partners can export reconciliation data"
        )

    db = get_firestore()
    reconciliation_doc = await db.collection(FirestoreCollections.RECONCILIATIONS).document(reconciliation_id).get()

    if not reconciliation_doc.exists:
        raise HTTPException(status_code=404, detail="Reconciliation not found")

    reconciliation_data = reconciliation_doc.to_dict()
    result = reconciliation_data.get("result")

    if not result:
        raise HTTPException(status_code=400, detail="Reconciliation has no results")

    try:
        from utils.report_generator import generate_pdf_report
        from shared.config import settings

        pdf_content = generate_pdf_report(
            reconciliation_id,
            reconciliation_data,
            result,
            logo_url=settings.logo_url
        )

        # Return as downloadable file
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=reconciliation_report_{reconciliation_id}.pdf"
            }
        )
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation not available: {str(e)}. Install reportlab package."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")
