"""Dashboard statistics routes."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from google.cloud.firestore_v1 import FieldFilter
import sys

sys.path.append("../..")

from shared.auth import get_current_user_id, get_user_role
from shared.database import get_firestore, FirestoreCollections
from shared.models.user import UserRole
from shared.models.production import ProductionEntryStatus
from shared.utils.cache import query_cache

router = APIRouter()


class DashboardStats(BaseModel):
    """Dashboard statistics response model."""

    total_production: float
    production_trend: float  # Percentage change from last month
    active_reconciliations: int
    pending_reconciliations: int
    anomalies_detected: int
    anomalies_trend: float  # Percentage change from last month
    total_entries_this_month: int
    total_entries_last_month: int


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """
    Get dashboard statistics with real-time calculations.

    Returns:
        - Total production this month
        - Production trend (% change from last month)
        - Active reconciliations count
        - Anomalies detected this month
        - Anomalies trend (% change from last month)

    Uses cache with 1-minute TTL to reduce computation on frequent page refreshes.
    """
    # OPTIMIZATION: Check cache first (5 minute TTL for better performance)
    # Dashboard stats don't need real-time accuracy
    cache_key = f"dashboard_stats:{user_id}:{user_role}"
    cached_result = query_cache.get(cache_key)
    if cached_result is not None:
        return cached_result

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

    # Calculate date ranges
    now = datetime.utcnow()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Get production entries
    entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

    # PERFORMANCE OPTIMIZATION: Only fetch required fields and limit results
    # This month's production
    this_month_query = entries_ref.where(
        filter=FieldFilter("tenant_id", "==", tenant_id)
    ).where(filter=FieldFilter("measurement_date", ">=", this_month_start))

    # Add partner filter for partners
    if user_role == UserRole.PARTNER:
        this_month_query = this_month_query.where(
            filter=FieldFilter("partner_id", "==", actual_user_id)
        )

    # OPTIMIZATION: Select only required fields (gross_volume, status)
    # This reduces document size by ~80% (only 2 fields instead of all 10+)
    this_month_query = this_month_query.select(["gross_volume", "status"])

    # OPTIMIZATION: Add reasonable limit to prevent unbounded queries
    # Most tenants have < 500 entries/month, cap at 1000 for safety
    this_month_query = this_month_query.limit(1000)

    this_month_entries = await this_month_query.get()

    # Calculate this month's stats
    total_production_this_month = 0
    anomalies_this_month = 0

    for doc in this_month_entries:
        data = doc.to_dict()
        total_production_this_month += data.get("gross_volume", 0)
        if data.get("status") == ProductionEntryStatus.FLAGGED.value:
            anomalies_this_month += 1

    # Last month's production
    last_month_query = entries_ref.where(
        filter=FieldFilter("tenant_id", "==", tenant_id)
    ).where(
        filter=FieldFilter("measurement_date", ">=", last_month_start)
    ).where(
        filter=FieldFilter("measurement_date", "<", this_month_start)
    )

    # Add partner filter for partners
    if user_role == UserRole.PARTNER:
        last_month_query = last_month_query.where(
            filter=FieldFilter("partner_id", "==", actual_user_id)
        )

    # OPTIMIZATION: Select only required fields and add limit
    last_month_query = last_month_query.select(["gross_volume", "status"]).limit(1000)

    last_month_entries = await last_month_query.get()

    # Calculate last month's stats
    total_production_last_month = 0
    anomalies_last_month = 0

    for doc in last_month_entries:
        data = doc.to_dict()
        total_production_last_month += data.get("gross_volume", 0)
        if data.get("status") == ProductionEntryStatus.FLAGGED.value:
            anomalies_last_month += 1

    # Calculate trends
    production_trend = 0
    if total_production_last_month > 0:
        production_trend = (
            (total_production_this_month - total_production_last_month)
            / total_production_last_month
        ) * 100

    anomalies_trend = 0
    if anomalies_last_month > 0:
        anomalies_trend = (
            (anomalies_this_month - anomalies_last_month) / anomalies_last_month
        ) * 100

    # Get reconciliation stats (coordinators only)
    active_reconciliations = 0
    pending_reconciliations = 0

    if user_role in [UserRole.COORDINATOR, UserRole.FIELD_OPERATOR]:
        reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)
        reconciliations_query = await reconciliations_ref.where(
            filter=FieldFilter("tenant_id", "==", tenant_id)
        ).get()

        for doc in reconciliations_query:
            data = doc.to_dict()
            status = data.get("status", "").lower()
            if status in ["in_progress", "pending"]:
                active_reconciliations += 1
            if status == "pending_review":
                pending_reconciliations += 1

    result = DashboardStats(
        total_production=round(total_production_this_month, 2),
        production_trend=round(production_trend, 2),
        active_reconciliations=active_reconciliations,
        pending_reconciliations=pending_reconciliations,
        anomalies_detected=anomalies_this_month,
        anomalies_trend=round(anomalies_trend, 2),
        total_entries_this_month=len(this_month_entries),
        total_entries_last_month=len(last_month_entries),
    )

    # OPTIMIZATION: Cache result for 5 minutes to reduce database load
    # Dashboard stats don't need real-time accuracy
    query_cache.set(cache_key, result, ttl_seconds=300)

    return result


class TeamMember(BaseModel):
    """Team member model."""

    id: str
    name: str
    email: str
    role: str
    status: str


@router.get("/dashboard/team-members")
async def get_team_members(
    limit: int = 2,
    user_id: str = Depends(get_current_user_id),
    user_role: str = Depends(get_user_role),
):
    """
    Get team members for the dashboard.

    Returns the first `limit` active team members.
    """
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

    # Get team members (don't filter by status as it may not be set in all documents)
    team_query = await users_ref.where(
        filter=FieldFilter("tenant_ids", "array_contains", tenant_id)
    ).limit(limit * 2).get()  # Get more and filter in code

    team_members = []
    for doc in team_query:
        data = doc.to_dict()
        # Skip users without status or with inactive status, but include if status is not set
        status = data.get("status", "active")
        if status == "inactive":
            continue

        team_members.append(
            TeamMember(
                id=doc.id,
                name=data.get("full_name", data.get("email", "Unknown")),
                email=data.get("email", ""),
                role=data.get("role", "unknown"),
                status=status,
            )
        )

        # Stop once we have enough
        if len(team_members) >= limit:
            break

    return team_members
