"""Production data entry routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
import sys
import uuid
from collections import defaultdict

sys.path.append("../..")

from shared.auth import get_current_user_id
from shared.database import get_firestore, FirestoreCollections
from shared.pubsub.publisher import publish_production_entry_created, publish_production_entry_edited
from shared.models.production import (
    ProductionEntry,
    ProductionEntryCreate,
    ProductionEntryUpdate,
    ProductionEntryStatus,
    ProductionStats
)
from shared.models.audit_log import AuditAction
from shared.utils.audit_logger import log_audit_event
from typing import List, Optional, Dict
from pydantic import BaseModel

router = APIRouter()


class ProductionEntriesResponse(BaseModel):
    """Response model for paginated production entries."""
    entries: List[ProductionEntry]
    allEntries: List[ProductionEntry]
    total: int
    page: int
    page_size: int


async def get_user_role_and_partner(user_id: str) -> tuple[str, Optional[str], str]:
    """Get user's role, partner_id for the tenant, and user document ID.
    Returns: (role, partner_id_for_filtering, user_doc_id)
    - For partners: partner_id_for_filtering is their user_doc_id (they own their data)
    - For field_operators: partner_id_for_filtering is their partner_id field (they work for a partner)
    """
    db = get_firestore()
    users_ref = db.collection(FirestoreCollections.USERS)

    user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()
    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc = user_query[0]
    user_data = user_doc.to_dict()
    role = user_data.get("role", "partner")

    # For partners, their "partner_id" for filtering is their own user document ID
    # For field operators, it's the partner_id field from their user document
    if role == "partner":
        partner_id_for_filtering = user_doc.id
    else:
        partner_id_for_filtering = user_data.get("partner_id")

    return role, partner_id_for_filtering, user_doc.id


@router.post("/entries", response_model=ProductionEntry, status_code=201)
async def create_production_entry(
    entry_data: ProductionEntryCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new production entry. Field operators and coordinators can create entries."""
    db = get_firestore()
    role, user_partner_id, _ = await get_user_role_and_partner(user_id)

    # Field operators can only create entries for their own partner
    if role == "field_operator" and entry_data.partner_id != user_partner_id:
        raise HTTPException(status_code=403, detail="Field operators can only create entries for their own partner")

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    entry_doc = {
        **entry_data.model_dump(),
        "submitted_by": user_id,
        "status": ProductionEntryStatus.PENDING.value,
        "created_at": now,
        "updated_at": now,
    }

    # Save to Firestore
    await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).set(entry_doc)

    # Log audit event
    try:
        # Get user info for audit log
        users_ref = db.collection(FirestoreCollections.USERS)
        user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()
        user_data = user_query[0].to_dict() if user_query else {}
        user_email = user_data.get("email")
        user_name = user_data.get("full_name")

        await log_audit_event(
            tenant_id=entry_data.tenant_id,
            user_id=user_id,
            action=AuditAction.PRODUCTION_ENTRY_CREATED,
            resource_type="production_entry",
            resource_id=entry_id,
            user_email=user_email,
            user_name=user_name,
            details={
                "gross_volume": entry_data.gross_volume,
                "measurement_date": entry_data.measurement_date.isoformat() if hasattr(entry_data.measurement_date, 'isoformat') else str(entry_data.measurement_date),
                "status": ProductionEntryStatus.PENDING.value,
            }
        )
    except Exception as e:
        print(f"⚠️  Failed to log audit event: {e}")

    # Publish event to Pub/Sub for auditor agent processing
    try:
        # Serialize entry_doc for JSON (convert datetime to ISO string)
        serializable_doc = {
            key: value.isoformat() if isinstance(value, datetime) else value
            for key, value in entry_doc.items()
        }
        await publish_production_entry_created(
            entry_id,
            entry_data.tenant_id,
            entry_data.partner_id,
            serializable_doc
        )
        print(f"✅ Published production-entry-created event for {entry_id}")
    except Exception as e:
        print(f"⚠️  Failed to publish event: {e}")
        # Don't fail the request if pub/sub fails

    return ProductionEntry(id=entry_id, **entry_doc)


@router.get("/entries", response_model=ProductionEntriesResponse)
async def list_production_entries(
    tenant_id: str = Query(...),
    partner_id: Optional[str] = Query(None),
    status: Optional[ProductionEntryStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(31, ge=1, le=100),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    min_temperature: Optional[float] = Query(None),
    max_temperature: Optional[float] = Query(None),
    min_bsw: Optional[float] = Query(None),
    max_bsw: Optional[float] = Query(None),
    environment: Optional[str] = Query("production", description="Environment: 'test' or 'production'"),
    user_id: str = Depends(get_current_user_id),
):
    """List production entries with filters and pagination. Role-based access control applied."""
    db = get_firestore()
    role, user_partner_id, _ = await get_user_role_and_partner(user_id)

    # Determine collection based on environment
    collection_name = (
        FirestoreCollections.PRODUCTION_ENTRIES_TEST
        if environment == "test"
        else FirestoreCollections.PRODUCTION_ENTRIES
    )
    entries_ref = db.collection(collection_name)

    # Build base query
    query = entries_ref.where("tenant_id", "==", tenant_id)

    # Role-based filtering: Partners and field operators see only their own data
    if role in ["partner", "field_operator"]:
        if not user_partner_id:
            raise HTTPException(status_code=403, detail="Partner ID not found for user")
        query = query.where("partner_id", "==", user_partner_id)
    elif partner_id:
        # Coordinators can filter by partner
        query = query.where("partner_id", "==", partner_id)

    if status:
        query = query.where("status", "==", status.value)

    # Execute query to get all matching entries (we'll filter in memory for complex conditions)
    query = query.order_by("measurement_date", direction="DESCENDING")
    entries_query = await query.get()

    # Convert to list and apply additional filters in memory
    all_entries = []
    for doc in entries_query:
        entry_data = doc.to_dict()
        entry = ProductionEntry(id=doc.id, **entry_data)

        # Date filter
        if start_date or end_date:
            entry_date = entry.measurement_date  # already aware (from Firestore)

            if start_date:
                start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
                if entry_date < start_dt:
                    continue

            if end_date:
                end_dt = datetime.fromisoformat(end_date).replace(
                    hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc
                )
                if entry_date > end_dt:
                    continue
        # Temperature filter
        if min_temperature is not None and entry.temperature < min_temperature:
            continue
        if max_temperature is not None and entry.temperature > max_temperature:
            continue

        # BSW filter
        if min_bsw is not None and entry.bsw_percent < min_bsw:
            continue
        if max_bsw is not None and entry.bsw_percent > max_bsw:
            continue

        all_entries.append(entry)

    # Get total count before pagination
    total_count = len(all_entries)

    # Apply pagination
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_entries = all_entries[start_idx:end_idx]

    return ProductionEntriesResponse(
        entries=paginated_entries,
        allEntries=all_entries,
        total=total_count,
        page=page,
        page_size=page_size
    )


@router.get("/entries/{entry_id}", response_model=ProductionEntry)
async def get_production_entry(
    entry_id: str,
):
    """Get a specific production entry."""
    db = get_firestore()
    entry_doc = await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).get()

    if not entry_doc.exists:
        raise HTTPException(status_code=404, detail="Production entry not found")

    return ProductionEntry(id=entry_doc.id, **entry_doc.to_dict())


@router.patch("/entries/{entry_id}", response_model=ProductionEntry)
async def update_production_entry(
    entry_id: str,
    entry_update: ProductionEntryUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Update production entry. Coordinators can edit all entries, partners can approve changes to their own."""
    db = get_firestore()
    entry_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id)
    entry_doc = await entry_ref.get()

    if not entry_doc.exists:
        raise HTTPException(status_code=404, detail="Production entry not found")

    entry_data = entry_doc.to_dict()
    entry_partner_id = entry_data.get("partner_id")

    role, user_partner_id, _ = await get_user_role_and_partner(user_id)

    # Role-based update permissions
    if role == "field_operator":
        # field Operators can edit all entries

        # Require edit_reason for field Operators edits
        if not entry_update.edit_reason:
            raise HTTPException(status_code=400, detail="Edit reason is required for coordinator edits")
    elif role == "partner":
        # Partners can only approve/reject their own entries
        if entry_partner_id != user_partner_id:
            raise HTTPException(status_code=403, detail="Partners can only update their own entries")
        # Partners can only change status to approved/rejected
        if entry_update.status not in [ProductionEntryStatus.APPROVED, ProductionEntryStatus.REJECTED, None]:
            raise HTTPException(status_code=403, detail="Partners can only approve or reject entries")
    else:
        # Field operators cannot update entries
        raise HTTPException(status_code=403, detail="Field operators cannot update entries")

    # Build update dict with only non-None values
    update_dict = {k: v for k, v in entry_update.model_dump(exclude_unset=True).items() if v is not None}

    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    # Add metadata
    update_dict["updated_at"] = datetime.now(timezone.utc)

    # If field Operators is editing, set status to pending_approval and track editor
    if role == "field_operator":
        update_dict["edited_by"] = user_id
        update_dict["edited_at"] = datetime.now(timezone.utc)
        update_dict["status"] = ProductionEntryStatus.PENDING_APPROVAL.value

    # If status changed to approved, record who approved it
    if entry_update.status == ProductionEntryStatus.APPROVED:
        update_dict["approved_by"] = user_id
        update_dict["approved_at"] = datetime.now(timezone.utc)

    await entry_ref.update(update_dict)

    # Fetch updated document
    updated_doc = await entry_ref.get()
    updated_entry = ProductionEntry(id=entry_id, **updated_doc.to_dict())

    # If field operator edited, trigger auditor agent for re-validation
    if role == "field_operator":
        try:
            tenant_id = entry_data.get("tenant_id")

            # First, publish to auditor agent for re-validation
            # Serialize updated entry for JSON
            serializable_entry = {
                key: value.isoformat() if isinstance(value, datetime) else value
                for key, value in updated_entry.model_dump().items()
            }
            await publish_production_entry_created(
                entry_id,
                tenant_id,
                entry_partner_id,
                serializable_entry
            )
            print(f"✅ Published production-entry-created event for auditor re-validation: {entry_id}")

            # Then publish edit notification event
            await publish_production_entry_edited(
                entry_id=entry_id,
                tenant_id=tenant_id,
                partner_id=entry_partner_id,
                edited_by_user_id=user_id,
                edit_reason=entry_update.edit_reason or "Entry updated"
            )
            print(f"✅ Published production-entry-edited event for {entry_id}")
        except Exception as e:
            print(f"⚠️  Failed to publish events: {e}")

    return updated_entry


@router.get("/stats", response_model=List[ProductionStats])
async def get_production_stats(
    tenant_id: str = Query(...),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    environment: Optional[str] = Query("production", description="Environment: 'test' or 'production'"),
    user_id: str = Depends(get_current_user_id),
):
    """Get production statistics by partner with percentage calculations. Role-based views."""
    db = get_firestore()
    role, user_partner_id, _ = await get_user_role_and_partner(user_id)

    # Determine collection based on environment
    collection_name = (
        FirestoreCollections.PRODUCTION_ENTRIES_TEST
        if environment == "test"
        else FirestoreCollections.PRODUCTION_ENTRIES
    )
    entries_ref = db.collection(collection_name)

    # Build query
    query = entries_ref.where("tenant_id", "==", tenant_id)
    query = query.where("status", "==", ProductionEntryStatus.APPROVED.value)

    # Get all approved entries
    entries_query = await query.get()

    # Calculate volumes by partner
    partner_volumes: Dict[str, float] = defaultdict(float)
    partner_counts: Dict[str, int] = defaultdict(int)

    start_dt = None
    end_dt = None

    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)

    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
    for doc in entries_query:
        entry_data = doc.to_dict()
        entry = ProductionEntry(id=doc.id, **entry_data)
        entry_date = entry.measurement_date

        # Apply date filters
        if start_dt and entry_date < start_dt:
            continue
        if end_dt and entry_date > end_dt:
            continue
        # Calculate net volume (gross - BSW)
        net_volume = entry.gross_volume * (1 - entry.bsw_percent / 100) * entry.meter_factor
        partner_volumes[entry.partner_id] += net_volume
        partner_counts[entry.partner_id] += 1

    # Calculate total volume
    total_volume = sum(partner_volumes.values())

    if total_volume == 0:
        return []

    # Get partner names
    partners_ref = db.collection(FirestoreCollections.USERS)
    partners_query = await partners_ref.where("tenant_ids", "array_contains", tenant_id).get()
    partner_names = {doc.id: doc.to_dict().get("organization", "Unknown") for doc in partners_query}

    # Build statistics
    stats: List[ProductionStats] = []

    if role == "coordinator":
        # Coordinators see all partners' individual percentages
        for partner_id, volume in partner_volumes.items():
            percentage = (volume / total_volume) * 100 if total_volume > 0 else 0
            stats.append(ProductionStats(
                partner_id=partner_id,
                partner_name=partner_names.get(partner_id, "Unknown"),
                total_volume=volume,
                percentage=round(percentage, 2),
                entry_count=partner_counts[partner_id]
            ))
    else:
        # Partners and field operators see only their own percentage vs rest
        if not user_partner_id:
            raise HTTPException(status_code=403, detail="Partner ID not found for user")

        user_volume = partner_volumes.get(user_partner_id, 0)
        user_percentage = (user_volume / total_volume) * 100 if total_volume > 0 else 0

        # User's own data
        stats.append(ProductionStats(
            partner_id=user_partner_id,
            partner_name=partner_names.get(user_partner_id, "Your Company"),
            total_volume=user_volume,
            percentage=round(user_percentage, 2),
            entry_count=partner_counts.get(user_partner_id, 0)
        ))

        # Rest of production
        rest_volume = total_volume - user_volume
        rest_percentage = 100 - user_percentage
        rest_count = sum(partner_counts.values()) - partner_counts.get(user_partner_id, 0)

        stats.append(ProductionStats(
            partner_id="others",
            partner_name="Other Partners",
            total_volume=rest_volume,
            percentage=round(rest_percentage, 2),
            entry_count=rest_count
        ))

    return sorted(stats, key=lambda x: x.percentage, reverse=True)


@router.delete("/entries/{entry_id}", status_code=204)
async def delete_production_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a production entry. Only coordinators can delete entries."""
    db = get_firestore()
    entry_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id)
    entry_doc = await entry_ref.get()

    if not entry_doc.exists:
        raise HTTPException(status_code=404, detail="Production entry not found")

    role, _, _ = await get_user_role_and_partner(user_id)

    # Only coordinators can delete
    if role != "coordinator":
        raise HTTPException(status_code=403, detail="Only coordinators can delete production entries")

    await entry_ref.delete()
    return None
