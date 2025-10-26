"""Reconciliation routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse, Response
from datetime import datetime
import sys
import uuid
import io
import csv
from typing import List

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


@router.get("/{reconciliation_id}/export/csv")
async def export_reconciliation_csv(
    reconciliation_id: str,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """Export detailed reconciliation allocation table as CSV."""
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

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header rows
    writer.writerow(["FlowShare V2 - Reconciliation Allocation Report"])
    writer.writerow([])
    writer.writerow(["Reconciliation ID:", reconciliation_id])
    writer.writerow(["Period Start:", str(reconciliation_data.get("period_start", ""))])
    writer.writerow(["Period End:", str(reconciliation_data.get("period_end", ""))])
    writer.writerow(["Terminal Volume (bbls):", reconciliation_data.get("terminal_volume", 0)])
    writer.writerow(["Allocation Model:", result.get("allocation_model_used", "N/A")])
    writer.writerow([])

    # Write summary
    writer.writerow(["Summary"])
    writer.writerow(["Total Gross Volume (bbls):", result.get("total_gross_volume", 0)])
    writer.writerow(["Total Net Volume Standard (bbls):", result.get("total_net_volume_standard", 0)])
    writer.writerow(["Total Allocated Volume (bbls):", result.get("total_allocated_volume", 0)])
    writer.writerow(["Shrinkage Volume (bbls):", result.get("shrinkage_volume", 0)])
    writer.writerow(["Shrinkage Percent (%):", result.get("shrinkage_percent", 0)])
    writer.writerow([])

    # Write detailed allocation table
    writer.writerow(["Partner Allocation Details"])
    writer.writerow([
        "Partner ID",
        "Partner Name",
        "Gross Volume (bbls)",
        "BSW %",
        "Water Cut Factor",
        "Net Volume Observed (bbls)",
        "Temperature Correction Factor",
        "API Correction Factor",
        "Net Volume Standard (bbls)",
        "Ownership %",
        "Allocated Volume (bbls)"
    ])

    partner_allocations = result.get("partner_allocations", [])
    for allocation in partner_allocations:
        writer.writerow([
            allocation.get("partner_id", ""),
            allocation.get("partner_name", ""),
            f"{allocation.get('gross_volume', 0):.2f}",
            f"{allocation.get('bsw_percent', 0):.4f}",
            f"{allocation.get('water_cut_factor', 0):.6f}",
            f"{allocation.get('net_volume_observed', 0):.2f}",
            f"{allocation.get('temperature_correction_factor', 0):.6f}",
            f"{allocation.get('api_correction_factor', 0):.6f}",
            f"{allocation.get('net_volume_standard', 0):.2f}",
            f"{allocation.get('ownership_percent', 0):.4f}",
            f"{allocation.get('allocated_volume', 0):.2f}",
        ])

    # Write intermediate calculations section
    writer.writerow([])
    writer.writerow(["Intermediate Calculations"])
    for allocation in partner_allocations:
        writer.writerow([])
        writer.writerow([f"Partner: {allocation.get('partner_name', 'N/A')} ({allocation.get('partner_id', 'N/A')})"])
        intermediate = allocation.get("intermediate_calculations", {})
        if intermediate:
            for key, value in intermediate.items():
                writer.writerow([f"  {key}:", value])

    # Get CSV content
    csv_content = output.getvalue()
    output.close()

    # Return as downloadable file
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=reconciliation_{reconciliation_id}.csv"
        }
    )


@router.get("/{reconciliation_id}/export/pdf")
async def export_reconciliation_pdf(
    reconciliation_id: str,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """Export reconciliation summary report as PDF."""
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
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF generation not available. Install reportlab package."
        )

    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)

    # Container for the 'Flowable' objects
    elements = []

    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12
    )

    # Title
    elements.append(Paragraph("FlowShare V2", title_style))
    elements.append(Paragraph("Reconciliation Summary Report", styles['Heading2']))
    elements.append(Spacer(1, 0.2*inch))

    # Reconciliation Info
    info_data = [
        ["Reconciliation ID:", reconciliation_id],
        ["Period Start:", str(reconciliation_data.get("period_start", ""))[:10]],
        ["Period End:", str(reconciliation_data.get("period_end", ""))[:10]],
        ["Terminal Volume:", f"{reconciliation_data.get('terminal_volume', 0):,.2f} bbls"],
        ["Status:", reconciliation_data.get("status", "").upper()],
        ["Allocation Model:", result.get("allocation_model_used", "N/A")],
    ]

    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))

    # Summary Section
    elements.append(Paragraph("Summary", heading_style))
    summary_data = [
        ["Metric", "Value"],
        ["Total Gross Volume", f"{result.get('total_gross_volume', 0):,.2f} bbls"],
        ["Total Net Volume Standard", f"{result.get('total_net_volume_standard', 0):,.2f} bbls"],
        ["Total Allocated Volume", f"{result.get('total_allocated_volume', 0):,.2f} bbls"],
        ["Shrinkage Volume", f"{result.get('shrinkage_volume', 0):,.2f} bbls"],
        ["Shrinkage Percent", f"{result.get('shrinkage_percent', 0):.2f}%"],
    ]

    summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.3*inch))

    # Partner Allocations
    elements.append(Paragraph("Partner Allocations", heading_style))

    allocation_data = [["Partner", "Gross Vol. (bbls)", "Net Vol. Std. (bbls)", "Ownership %", "Allocated Vol. (bbls)"]]

    partner_allocations = result.get("partner_allocations", [])
    for allocation in partner_allocations:
        allocation_data.append([
            allocation.get("partner_name", "N/A"),
            f"{allocation.get('gross_volume', 0):,.2f}",
            f"{allocation.get('net_volume_standard', 0):,.2f}",
            f"{allocation.get('ownership_percent', 0):.2f}%",
            f"{allocation.get('allocated_volume', 0):,.2f}",
        ])

    allocation_table = Table(allocation_data, colWidths=[1.5*inch, 1.3*inch, 1.3*inch, 1.2*inch, 1.3*inch])
    allocation_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    elements.append(allocation_table)

    # Footer
    elements.append(Spacer(1, 0.5*inch))
    footer_text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | FlowShare V2 - AI-Powered Hydrocarbon Allocation Platform"
    elements.append(Paragraph(footer_text, styles['Normal']))

    # Build PDF
    doc.build(elements)

    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()

    # Return as downloadable file
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reconciliation_report_{reconciliation_id}.pdf"
        }
    )
