"""SCADA API routes for external data submission (FR 3.2, FR 3.3)."""
from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
import sys
import uuid

sys.path.append("../..")

from shared.auth.api_key_auth import get_tenant_from_api_key
from shared.database import get_firestore, FirestoreCollections
from shared.pubsub.publisher import publish_production_entry_created
from shared.models.production import ProductionEntryBase, ProductionEntryCreate, ProductionEntry
from shared.models.audit_log import AuditAction
from shared.utils.audit_logger import log_audit_event

router = APIRouter()


@router.post("/production", response_model=ProductionEntry, status_code=status.HTTP_201_CREATED)
async def submit_production_data(
    entry_data: ProductionEntryBase,
    api_key_info: dict = Depends(get_tenant_from_api_key),
):
    """
    Submit production data via SCADA API.

    **Authentication**: Requires valid API key in `X-API-Key` header.

    **Environment**:
    - Test API keys submit to a separate test collection for safe testing
    - Production API keys submit to the live production collection

    **Note**: This endpoint is intended for automated SCADA systems to submit
    production data without user authentication.

    Example:
    ```bash
    curl -X POST "http://localhost:8000/api/scada/production" \\
      -H "X-API-Key: YOUR_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d '{
        "partner_id": "partner-123",
        "gross_volume": 1000.5,
        "bsw_percent": 2.5,
        "temperature": 60.0,
        "api_gravity": 35.0,
        "measurement_date": "2025-10-27T12:00:00Z"
      }'
    ```
    """
    db = get_firestore()
    tenant_id = api_key_info["tenant_id"]
    environment = api_key_info.get("environment", "test")

    # Override tenant_id from entry_data with the one from API key
    entry_data_dict = entry_data.model_dump()
    entry_data_dict["tenant_id"] = tenant_id

    # Validate that partner exists in the tenant
    partner_ref = db.collection(FirestoreCollections.USERS).document(entry_data.partner_id)
    partner_doc = await partner_ref.get()

    if not partner_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Partner {entry_data.partner_id} not found"
        )

    partner_data = partner_doc.to_dict()
    tenant_ids = partner_data.get("tenant_ids")

    if not isinstance(tenant_ids, list) or tenant_id not in tenant_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Partner does not belong to this tenant"
        )

    # Create production entry
    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    production_entry = {
        **entry_data_dict,
        "status": "pending",  # Will be validated by Auditor Agent
        "validation_status": None,
        "validation_message": None,
        "submitted_by": entry_data.partner_id,
        "created_at": now,
        "updated_at": now,
        "created_by": "scada_api",  # Mark as API submission
        "environment": environment or 'test',  # Track test vs production
    }

    # Save to appropriate collection based on environment
    collection_name = (
        FirestoreCollections.PRODUCTION_ENTRIES_TEST
        if environment == "test"
        else FirestoreCollections.PRODUCTION_ENTRIES
    )

    await db.collection(collection_name).document(entry_id).set(production_entry)

    # Publish event for AI validation
    try:
        await publish_production_entry_created(entry_id, tenant_id, entry_data.partner_id)
    except Exception as e:
        # Log but don't fail the request if pub/sub fails
        print(f"Warning: Failed to publish production entry event: {e}")

    # Log audit event
    await log_audit_event(
        tenant_id=tenant_id,
        user_id="scada_api",
        action=AuditAction.PRODUCTION_ENTRY_CREATED,
        resource_type="production_entry",
        resource_id=entry_id,
        details={"partner_id": entry_data.partner_id, "source": "scada_api"}
    )

    return ProductionEntry(id=entry_id, **production_entry)


@router.get("/health")
async def scada_health_check():
    """
    Health check endpoint for SCADA API.

    Does not require authentication - used to verify API connectivity.
    """
    return {
        "status": "healthy",
        "service": "scada_api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "SCADA API is operational"
    }
