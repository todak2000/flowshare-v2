"""Analytics routes using Firebase (plan-restricted)."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta, timezone
import sys
from typing import List, Dict, Any
from collections import defaultdict

sys.path.append("../..")

from shared.auth import get_current_user_id, require_plan
from shared.database import get_firestore, FirestoreCollections

router = APIRouter()


@router.get("/trends")
async def get_production_trends(
    tenant_id: str = Query(...),
    partner_id: str = Query(None),
    days: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user_id),
    _plan_check: str = Depends(require_plan(['professional', 'enterprise'])),
) -> Dict[str, Any]:
    """
    Get production trends from Firebase.

    Returns time-series data for production volumes.

    **Requires Professional or Enterprise plan.**
    """
    try:
        db = get_firestore()

        # Calculate date range
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Build query
        entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        query = entries_ref.where("tenant_id", "==", tenant_id)\
                          .where("measurement_date", ">=", start_date)\
                          .order_by("measurement_date", direction="DESCENDING")

        if partner_id:
            query = query.where("partner_id", "==", partner_id)

        # OPTIMIZATION: Use select() to fetch only required fields
        query = query.select(["measurement_date", "partner_id", "gross_volume", "bsw_percent", "api_gravity"])

        # Execute query
        entries = await query.get()

        # Aggregate data by date and partner
        daily_data = defaultdict(lambda: defaultdict(lambda: {
            "total_gross_volume": 0,
            "bsw_sum": 0,
            "api_sum": 0,
            "count": 0
        }))

        for entry in entries:
            data = entry.to_dict()
            date_key = data["measurement_date"].date().isoformat()
            pid = data.get("partner_id", "unknown")

            daily_data[date_key][pid]["total_gross_volume"] += data.get("gross_volume", 0)
            daily_data[date_key][pid]["bsw_sum"] += data.get("bsw_percent", 0)
            daily_data[date_key][pid]["api_sum"] += data.get("api_gravity", 0)
            daily_data[date_key][pid]["count"] += 1

        # Format results
        trends = []
        for date_key, partners in sorted(daily_data.items(), reverse=True):
            for pid, values in partners.items():
                count = values["count"]
                trends.append({
                    "date": date_key,
                    "partner_id": pid,
                    "total_gross_volume": round(values["total_gross_volume"], 2),
                    "avg_bsw": round(values["bsw_sum"] / count, 2) if count > 0 else 0,
                    "avg_api_gravity": round(values["api_sum"] / count, 2) if count > 0 else 0,
                })

        return {
            "tenant_id": tenant_id,
            "partner_id": partner_id,
            "period_days": days,
            "data": trends,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/summary")
async def get_analytics_summary(
    tenant_id: str = Query(...),
    partner_id: str = Query(None),
    user_id: str = Depends(get_current_user_id),
    _plan_check: str = Depends(require_plan(['professional', 'enterprise'])),
) -> Dict[str, Any]:
    """
    Get summary analytics for a tenant or partner.

    **Requires Professional or Enterprise plan.**
    """
    try:
        db = get_firestore()

        # Build query
        entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        query = entries_ref.where("tenant_id", "==", tenant_id)

        if partner_id:
            query = query.where("partner_id", "==", partner_id)

        # OPTIMIZATION: Use select() to fetch only required fields, reducing data transfer
        # Note: Firestore Python SDK uses .select() for field masking
        query = query.select(["partner_id", "gross_volume", "bsw_percent"])

        # Execute query
        entries = await query.get()

        # Calculate summary
        total_entries = 0
        total_production = 0
        bsw_sum = 0
        partners = set()

        for entry in entries:
            data = entry.to_dict()
            total_entries += 1
            total_production += data.get("gross_volume", 0)
            bsw_sum += data.get("bsw_percent", 0)
            partners.add(data.get("partner_id"))

        return {
            "total_partners": len(partners),
            "total_entries": total_entries,
            "total_production": round(total_production, 2),
            "avg_bsw": round(bsw_sum / total_entries, 2) if total_entries > 0 else 0,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")
