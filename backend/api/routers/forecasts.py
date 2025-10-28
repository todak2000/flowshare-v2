"""Forecasting routes using statistical methods (plan-restricted)."""
from fastapi import APIRouter, HTTPException, Depends, Query
import sys
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import numpy as np

sys.path.append("../..")

from shared.auth import get_current_user_id, require_plan
from shared.database import get_firestore, FirestoreCollections

router = APIRouter()


def calculate_linear_trend(values: List[float]) -> tuple[float, float]:
    """
    Calculate linear trend (slope and intercept) from historical data.

    Args:
        values: List of historical values

    Returns:
        Tuple of (slope, intercept)
    """
    if len(values) < 2:
        return 0.0, values[0] if values else 0.0

    x = np.arange(len(values))
    y = np.array(values)

    # Calculate linear regression
    n = len(x)
    sum_x = np.sum(x)
    sum_y = np.sum(y)
    sum_xy = np.sum(x * y)
    sum_x2 = np.sum(x ** 2)

    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
    intercept = (sum_y - slope * sum_x) / n

    return slope, intercept


def calculate_moving_average(values: List[float], window: int = 3) -> float:
    """
    Calculate simple moving average.

    Args:
        values: List of historical values
        window: Number of periods to average

    Returns:
        Moving average value
    """
    if not values:
        return 0.0

    window = min(window, len(values))
    recent_values = values[-window:]
    return sum(recent_values) / len(recent_values)


@router.get("")
async def get_production_forecast(
    tenant_id: str = Query(...),
    partner_id: str = Query(...),
    periods: int = Query(6, ge=1, le=12, description="Number of periods (months) to forecast"),
    user_id: str = Depends(get_current_user_id),
    _plan_check: str = Depends(require_plan(['professional', 'enterprise'])),
) -> Dict[str, Any]:
    """
    Get statistical production forecast based on historical data.

    Uses linear regression and moving averages to predict future production.

    **Requires Professional or Enterprise plan.**
    """
    try:
        db = get_firestore()

        # Fetch historical data (last 12 months)
        start_date = datetime.now(timezone.utc) - timedelta(days=365)

        entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        query = entries_ref.where("tenant_id", "==", tenant_id)\
                          .where("partner_id", "==", partner_id)\
                          .where("measurement_date", ">=", start_date)\
                          .order_by("measurement_date", direction="ASCENDING")

        entries = await query.get()

        if not entries:
            raise HTTPException(
                status_code=400,
                detail="Insufficient historical data. Need at least 3 months of production data for forecasting."
            )

        # Aggregate monthly data
        monthly_data = {}
        for entry in entries:
            data = entry.to_dict()
            month_key = data["measurement_date"].strftime("%Y-%m")

            if month_key not in monthly_data:
                monthly_data[month_key] = {"total_volume": 0, "count": 0}

            monthly_data[month_key]["total_volume"] += data.get("gross_volume", 0)
            monthly_data[month_key]["count"] += 1

        # Calculate average monthly production
        monthly_volumes = [
            data["total_volume"] / data["count"]
            for data in sorted(monthly_data.values())
        ]

        if len(monthly_volumes) < 3:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data points. Found {len(monthly_volumes)} months, need at least 3."
            )

        # Calculate trend using linear regression
        slope, intercept = calculate_linear_trend(monthly_volumes)

        # Calculate baseline using moving average
        baseline = calculate_moving_average(monthly_volumes, window=3)

        # Calculate standard deviation for confidence intervals
        std_dev = np.std(monthly_volumes)
        confidence_margin = 1.96 * std_dev  # 95% confidence interval

        # Generate forecasts
        forecasts = []
        last_index = len(monthly_volumes) - 1

        for i in range(periods):
            # Predict using linear trend
            future_index = last_index + i + 1
            predicted_volume = slope * future_index + intercept

            # Add some weight to moving average to smooth predictions
            forecasted_volume = 0.7 * predicted_volume + 0.3 * baseline

            # Ensure non-negative
            forecasted_volume = max(forecasted_volume, 0)

            forecasts.append({
                "period": i + 1,
                "month": (datetime.now() + timedelta(days=30 * (i + 1))).strftime("%Y-%m"),
                "forecasted_volume": round(float(forecasted_volume), 2),
                "confidence_lower": round(max(float(forecasted_volume - confidence_margin), 0), 2),
                "confidence_upper": round(float(forecasted_volume + confidence_margin), 2),
            })

        return {
            "tenant_id": tenant_id,
            "partner_id": partner_id,
            "forecast_periods": periods,
            "forecasts": forecasts,
            "model": "statistical-linear-regression",
            "historical_months": len(monthly_volumes),
            "baseline_avg": round(float(baseline), 2),
            "trend_slope": round(float(slope), 4),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate forecast: {str(e)}")
