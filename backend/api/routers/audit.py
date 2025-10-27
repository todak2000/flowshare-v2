"""Audit log routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from google.cloud.firestore_v1 import FieldFilter
import sys

sys.path.append("../..")

from shared.auth import get_current_user_id, get_user_role
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import UserRole

router = APIRouter()


class AuditLogResponse(BaseModel):
    """Audit log entry response model."""

    id: str
    tenant_id: str
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """
    Get audit logs for the tenant.

    Only coordinators can access audit logs.
    """
    # Only coordinators can view audit logs
    if user_role not in [UserRole.COORDINATOR, UserRole.FIELD_OPERATOR]:
        raise HTTPException(
            status_code=403, detail="Only coordinators can access audit logs"
        )

    db = get_firestore()

    # Get user's tenant
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where(
        filter=FieldFilter("firebase_uid", "==", user_id)
    ).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_query[0].to_dict()
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        raise HTTPException(status_code=400, detail="User has no associated tenant")

    tenant_id = tenant_ids[0]

    # Build query
    audit_ref = db.collection(FirestoreCollections.AUDIT_LOGS)
    query = audit_ref.where(filter=FieldFilter("tenant_id", "==", tenant_id))

    # Apply filters
    if action:
        query = query.where(filter=FieldFilter("action", "==", action))

    if resource_type:
        query = query.where(filter=FieldFilter("resource_type", "==", resource_type))

    # Order by created_at descending and apply limit
    query = query.order_by("created_at", direction="DESCENDING").limit(limit).offset(offset)

    # Execute query
    results = await query.get()

    # Convert to response model
    audit_logs = []
    for doc in results:
        data = doc.to_dict()
        audit_logs.append(
            AuditLogResponse(id=doc.id, **data)
        )

    return audit_logs


@router.get("/audit-logs/recent", response_model=List[AuditLogResponse])
async def get_recent_audit_logs(
    limit: int = Query(default=4, le=20),
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """
    Get recent audit logs for the dashboard.

    Partners see only their own activities.
    Coordinators see all activities in their tenant.
    """
    db = get_firestore()

    # Get user's tenant
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where(
        filter=FieldFilter("firebase_uid", "==", user_id)
    ).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc = user_query[0]
    user_data = user_doc.to_dict()
    actual_user_id = user_doc.id
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        raise HTTPException(status_code=400, detail="User has no associated tenant")

    tenant_id = tenant_ids[0]

    # Build query
    audit_ref = db.collection(FirestoreCollections.AUDIT_LOGS)
    query = audit_ref.where(filter=FieldFilter("tenant_id", "==", tenant_id))

    # Partners see only their own activities
    if user_role == UserRole.PARTNER:
        query = query.where(filter=FieldFilter("user_id", "==", actual_user_id))

    # Order by created_at descending and apply limit
    query = query.order_by("created_at", direction="DESCENDING").limit(limit)

    # Execute query
    results = await query.get()

    # Convert to response model
    audit_logs = []
    for doc in results:
        data = doc.to_dict()
        audit_logs.append(
            AuditLogResponse(id=doc.id, **data)
        )

    return audit_logs


@router.get("/audit-logs/stats")
async def get_audit_log_stats(
    days: int = Query(default=30, le=90),
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """
    Get audit log statistics for the specified time period.

    Only coordinators can access audit log stats.
    """
    # Only coordinators can view audit log stats
    if user_role not in [UserRole.COORDINATOR, UserRole.FIELD_OPERATOR]:
        raise HTTPException(
            status_code=403, detail="Only coordinators can access audit log stats"
        )

    db = get_firestore()

    # Get user's tenant
    users_ref = db.collection(FirestoreCollections.USERS)
    user_query = await users_ref.where(
        filter=FieldFilter("firebase_uid", "==", user_id)
    ).limit(1).get()

    if not user_query:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_query[0].to_dict()
    tenant_ids = user_data.get("tenant_ids", [])

    if not tenant_ids:
        raise HTTPException(status_code=400, detail="User has no associated tenant")

    tenant_id = tenant_ids[0]

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Build query
    audit_ref = db.collection(FirestoreCollections.AUDIT_LOGS)
    query = (
        audit_ref.where(filter=FieldFilter("tenant_id", "==", tenant_id))
        .where(filter=FieldFilter("created_at", ">=", start_date))
        .where(filter=FieldFilter("created_at", "<=", end_date))
    )

    # Execute query
    results = await query.get()

    # Calculate statistics
    total_activities = len(results)
    actions_by_type = {}
    actions_by_user = {}

    for doc in results:
        data = doc.to_dict()
        action = data.get("action")
        user_id_from_log = data.get("user_id")

        # Count by action type
        if action:
            actions_by_type[action] = actions_by_type.get(action, 0) + 1

        # Count by user
        if user_id_from_log:
            actions_by_user[user_id_from_log] = (
                actions_by_user.get(user_id_from_log, 0) + 1
            )

    return {
        "total_activities": total_activities,
        "period_days": days,
        "actions_by_type": actions_by_type,
        "actions_by_user": actions_by_user,
        "start_date": start_date,
        "end_date": end_date,
    }
