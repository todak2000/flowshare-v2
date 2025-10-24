"""Analytics routes."""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
import sys
from typing import List, Dict, Any

sys.path.append("../..")

from shared.auth import get_current_user_id
from google.cloud import bigquery

router = APIRouter()


@router.get("/trends")
async def get_production_trends(
    tenant_id: str = Query(...),
    partner_id: str = Query(None),
    days: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """
    Get production trends from BigQuery.

    Returns time-series data for production volumes.
    """
    try:
        client = bigquery.Client()

        # Build query based on filters
        query = f"""
        SELECT
            DATE(measurement_date) as date,
            partner_id,
            SUM(gross_volume) as total_gross_volume,
            AVG(bsw_percent) as avg_bsw,
            AVG(api_gravity) as avg_api_gravity
        FROM `flowshare-v2.flowshare_analytics.production_data`
        WHERE tenant_id = @tenant_id
        AND measurement_date >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
        """

        if partner_id:
            query += " AND partner_id = @partner_id"

        query += """
        GROUP BY date, partner_id
        ORDER BY date DESC
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("tenant_id", "STRING", tenant_id),
                bigquery.ScalarQueryParameter("days", "INT64", days),
            ]
        )

        if partner_id:
            job_config.query_parameters.append(
                bigquery.ScalarQueryParameter("partner_id", "STRING", partner_id)
            )

        query_job = client.query(query, job_config=job_config)
        results = query_job.result()

        # Format results
        trends = []
        for row in results:
            trends.append({
                "date": row.date.isoformat() if row.date else None,
                "partner_id": row.partner_id,
                "total_gross_volume": float(row.total_gross_volume) if row.total_gross_volume else 0,
                "avg_bsw": float(row.avg_bsw) if row.avg_bsw else 0,
                "avg_api_gravity": float(row.avg_api_gravity) if row.avg_api_gravity else 0,
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
) -> Dict[str, Any]:
    """
    Get summary analytics for a tenant or partner.
    """
    try:
        client = bigquery.Client()

        query = """
        SELECT
            COUNT(DISTINCT partner_id) as total_partners,
            COUNT(*) as total_entries,
            SUM(gross_volume) as total_production,
            AVG(bsw_percent) as avg_bsw
        FROM `flowshare-v2.flowshare_analytics.production_data`
        WHERE tenant_id = @tenant_id
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("tenant_id", "STRING", tenant_id),
            ]
        )

        if partner_id:
            query += " AND partner_id = @partner_id"
            job_config.query_parameters.append(
                bigquery.ScalarQueryParameter("partner_id", "STRING", partner_id)
            )

        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())

        if not results:
            return {
                "total_partners": 0,
                "total_entries": 0,
                "total_production": 0,
                "avg_bsw": 0,
            }

        row = results[0]
        return {
            "total_partners": row.total_partners,
            "total_entries": row.total_entries,
            "total_production": float(row.total_production) if row.total_production else 0,
            "avg_bsw": float(row.avg_bsw) if row.avg_bsw else 0,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")
