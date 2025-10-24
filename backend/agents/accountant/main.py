"""Accountant Agent - Performs reconciliation and allocation calculations."""
import asyncio
import json
import logging
import sys
from concurrent import futures
from datetime import datetime
from typing import List

sys.path.append("../..")

from google.cloud import pubsub_v1
from shared.config import settings
from shared.database import get_firestore, FirestoreCollections
from shared.pubsub import publish_reconciliation_complete
from shared.models.reconciliation import ReconciliationStatus, ReconciliationResult, PartnerAllocation
from shared.models.production import ProductionEntryStatus
from allocation_engine import AllocationEngine, ProductionData

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def perform_reconciliation(reconciliation_id: str, tenant_id: str):
    """
    Perform reconciliation calculation.

    Steps:
    1. Fetch reconciliation request
    2. Get tenant settings (allocation model)
    3. Fetch all validated production entries for the period
    4. Run allocation engine
    5. Save results
    6. Publish completion event
    """
    try:
        db = get_firestore()
        reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)
        reconciliation_doc = await reconciliations_ref.document(reconciliation_id).get()

        if not reconciliation_doc.exists:
            logger.error(f"Reconciliation {reconciliation_id} not found")
            return

        reconciliation_data = reconciliation_doc.to_dict()

        # Update status to PROCESSING
        await reconciliations_ref.document(reconciliation_id).update({
            "status": ReconciliationStatus.PROCESSING.value,
        })

        # Get tenant settings
        tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()
        if not tenant_doc.exists:
            raise Exception(f"Tenant {tenant_id} not found")

        tenant_data = tenant_doc.to_dict()
        tenant_settings = tenant_data.get("settings", {})
        allocation_model = tenant_settings.get("allocation_model", "api_mpms_11_1")

        logger.info(f"Using allocation model: {allocation_model}")

        # Fetch production entries for the period
        entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        entries_query = await entries_ref.where("tenant_id", "==", tenant_id).where(
            "status", "==", ProductionEntryStatus.VALIDATED.value
        ).where(
            "measurement_date", ">=", reconciliation_data["period_start"]
        ).where(
            "measurement_date", "<=", reconciliation_data["period_end"]
        ).get()

        if len(entries_query) == 0:
            raise Exception("No validated production entries found for the period")

        # Group entries by partner and sum volumes
        partner_data = {}
        for doc in entries_query:
            entry = doc.to_dict()
            partner_id = entry["partner_id"]

            if partner_id not in partner_data:
                partner_data[partner_id] = {
                    "partner_id": partner_id,
                    "partner_name": f"Partner {partner_id[-8:]}",  # Simplified partner name
                    "gross_volume": 0,
                    "bsw_sum": 0,
                    "temp_sum": 0,
                    "api_sum": 0,
                    "count": 0,
                }

            partner_data[partner_id]["gross_volume"] += entry["gross_volume"]
            partner_data[partner_id]["bsw_sum"] += entry["bsw_percent"]
            partner_data[partner_id]["temp_sum"] += entry["temperature"]
            partner_data[partner_id]["api_sum"] += entry["api_gravity"]
            partner_data[partner_id]["count"] += 1

        # Create ProductionData objects with averaged values
        production_inputs: List[ProductionData] = []
        for partner_id, data in partner_data.items():
            count = data["count"]
            production_inputs.append(
                ProductionData(
                    partner_id=partner_id,
                    partner_name=data["partner_name"],
                    gross_volume=data["gross_volume"],
                    bsw_percent=data["bsw_sum"] / count,
                    temperature=data["temp_sum"] / count,
                    api_gravity=data["api_sum"] / count,
                )
            )

        # Run allocation engine
        engine = AllocationEngine(
            temperature_standard=tenant_settings.get("default_temperature_standard", 60.0),
            pressure_standard=tenant_settings.get("default_pressure_standard", 14.696),
        )

        terminal_volume = reconciliation_data["terminal_volume"]
        allocation_results = engine.allocate_volumes(production_inputs, terminal_volume)

        # Calculate totals
        total_gross = sum(r.gross_volume for r in allocation_results)
        total_net_standard = sum(r.net_volume_standard for r in allocation_results)
        total_allocated = sum(r.allocated_volume for r in allocation_results)
        shrinkage = terminal_volume - total_allocated
        shrinkage_percent = (shrinkage / terminal_volume * 100) if terminal_volume > 0 else 0

        # Create partner allocations
        partner_allocations = []
        for result in allocation_results:
            partner_allocations.append(
                PartnerAllocation(
                    partner_id=result.partner_id,
                    partner_name=result.partner_name,
                    gross_volume=result.gross_volume,
                    bsw_percent=result.bsw_percent,
                    water_cut_factor=result.water_cut_factor,
                    net_volume_observed=result.net_volume_observed,
                    temperature_correction_factor=result.temperature_correction_factor,
                    api_correction_factor=result.api_correction_factor,
                    net_volume_standard=result.net_volume_standard,
                    ownership_percent=result.ownership_percent,
                    allocated_volume=result.allocated_volume,
                    intermediate_calculations=result.intermediate_calculations,
                ).model_dump()
            )

        # Create reconciliation result
        reconciliation_result = ReconciliationResult(
            total_gross_volume=total_gross,
            total_net_volume_standard=total_net_standard,
            total_allocated_volume=total_allocated,
            shrinkage_volume=shrinkage,
            shrinkage_percent=shrinkage_percent,
            partner_allocations=partner_allocations,
            allocation_model_used=allocation_model,
        )

        # Save results
        await reconciliations_ref.document(reconciliation_id).update({
            "status": ReconciliationStatus.COMPLETED.value,
            "result": reconciliation_result.model_dump(),
            "completed_at": datetime.utcnow(),
        })

        logger.info(f"Reconciliation {reconciliation_id} completed successfully")

        # Publish completion event
        await publish_reconciliation_complete(reconciliation_id, tenant_id)

    except Exception as e:
        logger.error(f"Error in reconciliation {reconciliation_id}: {str(e)}")

        # Update status to FAILED
        db = get_firestore()
        await db.collection(FirestoreCollections.RECONCILIATIONS).document(reconciliation_id).update({
            "status": ReconciliationStatus.FAILED.value,
            "error_message": str(e),
        })


def callback(message: pubsub_v1.subscriber.message.Message):
    """Callback for Pub/Sub messages."""
    try:
        data = json.loads(message.data.decode("utf-8"))
        logger.info(f"Received message: {data}")

        reconciliation_id = data.get("reconciliation_id")
        tenant_id = data.get("tenant_id")

        if not all([reconciliation_id, tenant_id]):
            logger.error("Missing required fields in message")
            message.ack()
            return

        # Run async reconciliation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(perform_reconciliation(reconciliation_id, tenant_id))
        loop.close()

        message.ack()
        logger.info(f"Message processed: {reconciliation_id}")

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        message.nack()


def main():
    """Start the Accountant Agent subscriber."""
    logger.info("Starting Accountant Agent...")

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        settings.gcp_project_id, f"{settings.pubsub_reconciliation_trigger_topic}-sub"
    )

    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    logger.info(f"Listening for messages on {subscription_path}")

    # Keep the subscriber running
    with futures.ThreadPoolExecutor() as executor:
        try:
            streaming_pull_future.result()
        except KeyboardInterrupt:
            streaming_pull_future.cancel()
            logger.info("Accountant Agent stopped")


if __name__ == "__main__":
    main()
