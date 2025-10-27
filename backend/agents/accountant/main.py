"""Accountant Agent - Performs reconciliation and allocation calculations."""
import asyncio
import json
import logging
import sys
from datetime import datetime, timezone  # ✅ Import timezone
from typing import List

sys.path.append("../..")

from google.cloud import pubsub_v1
from shared.config import settings
from shared.database import get_firestore, FirestoreCollections
from shared.pubsub import publish_reconciliation_complete
from shared.models.reconciliation import ReconciliationStatus, ReconciliationResult, PartnerAllocation
from shared.models.production import ProductionEntryStatus
from allocation_engine import AllocationEngine, ProductionData
from shared.ai import GeminiService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini service
gemini_service = GeminiService()


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
    # ✅ Define db and ref here to be available in try/except
    db = get_firestore()
    reconciliations_ref = db.collection(FirestoreCollections.RECONCILIATIONS)
    try:
        reconciliation_doc = await reconciliations_ref.document(reconciliation_id).get()

        if not reconciliation_doc.exists:
            logger.error(f"Reconciliation {reconciliation_id} not found")
            return  # This is not an error to retry, so we don't raise

        reconciliation_data = reconciliation_doc.to_dict()

        # Update status to PROCESSING
        await reconciliations_ref.document(reconciliation_id).update({
            "status": ReconciliationStatus.PROCESSING.value,
        })

        # Get tenant settings
        tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()
        if not tenant_doc.exists:
            # This is a fatal error for this run
            raise Exception(f"Tenant {tenant_id} not found")

        tenant_data = tenant_doc.to_dict()
        tenant_settings = tenant_data.get("settings", {})
        allocation_model = tenant_settings.get("allocation_model", "api_mpms_11_1")

        logger.info(f"Using allocation model: {allocation_model}")

        # Fetch ALL production entries for the period to check approval percentage
        entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)
        all_entries_query = await entries_ref.where("tenant_id", "==", tenant_id).where(
            "measurement_date", ">=", reconciliation_data["period_start"]
        ).where(
            "measurement_date", "<=", reconciliation_data["period_end"]
        ).get()

        total_entries_count = len(all_entries_query)

        # Check if there are any entries at all
        if total_entries_count == 0:
            logger.warning(f"No production entries found for period. Marking as failed.")
            await reconciliations_ref.document(reconciliation_id).update({
                "status": ReconciliationStatus.FAILED.value,
                "error_message": "No production entries found for the period.",
            })
            return

        # Fetch APPROVED production entries for the period
        approved_entries_query = await entries_ref.where("tenant_id", "==", tenant_id).where(
            "status", "==", ProductionEntryStatus.APPROVED.value
        ).where(
            "measurement_date", ">=", reconciliation_data["period_start"]
        ).where(
            "measurement_date", "<=", reconciliation_data["period_end"]
        ).get()

        approved_entries_count = len(approved_entries_query)

        # Calculate approval percentage
        approval_percentage = (approved_entries_count / total_entries_count) * 100 if total_entries_count > 0 else 0

        logger.info(f"Reconciliation {reconciliation_id}: {approved_entries_count}/{total_entries_count} entries approved ({approval_percentage:.1f}%)")

        # Check if at least 90% of entries are approved
        if approval_percentage < 90.0:
            error_msg = (
                f"Insufficient approved production data for reconciliation. "
                f"Only {approved_entries_count} out of {total_entries_count} entries ({approval_percentage:.1f}%) are approved. "
                f"At least 90% of production data must be approved before reconciliation can proceed."
            )
            logger.warning(f"Reconciliation {reconciliation_id} failed: {error_msg}")
            await reconciliations_ref.document(reconciliation_id).update({
                "status": ReconciliationStatus.FAILED.value,
                "error_message": error_msg,
            })
            return

        if approved_entries_count == 0:
            # This is not an error, but a valid state. Update status and return.
            logger.warning(f"No approved production entries found for {reconciliation_id}. Marking as failed.")
            await reconciliations_ref.document(reconciliation_id).update({
                "status": ReconciliationStatus.FAILED.value,
                "error_message": "No approved production entries found for the period.",
            })
            return # Don't raise, no retry needed.

        # Group entries by partner and sum volumes
        partner_data = {}
        partner_names_cache = {}  # Cache partner organization names

        for doc in approved_entries_query:
            entry = doc.to_dict()
            partner_id = entry["partner_id"]

            if partner_id not in partner_data:
                # Fetch partner organization name from users collection
                partner_name = f"Partner {partner_id[-6:]}"  # Fallback
                if partner_id not in partner_names_cache:
                    try:
                        partner_doc = await db.collection(FirestoreCollections.USERS).document(partner_id).get()
                        if partner_doc.exists:
                            partner_user_data = partner_doc.to_dict()
                            partner_name = partner_user_data.get("organization") or partner_user_data.get("full_name", partner_name)
                            partner_names_cache[partner_id] = partner_name
                    except Exception as e:
                        logger.warning(f"Failed to fetch partner name for {partner_id}: {e}")
                else:
                    partner_name = partner_names_cache[partner_id]

                partner_data[partner_id] = {
                    "partner_id": partner_id,
                    "partner_name": partner_name,
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
        # Shrinkage = (Total Production Volume - Total Allocated) / Total Production Volume * 100
        shrinkage = total_gross - total_allocated
        shrinkage_percent = (shrinkage / total_gross * 100) if total_gross > 0 else 0

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

        # Generate AI analysis for reconciliation
        ai_analysis = None
        try:
            logger.info(f"Generating AI analysis for reconciliation {reconciliation_id}")
            result_dict = reconciliation_result.model_dump()
            ai_analysis = await gemini_service.analyze_reconciliation(
                reconciliation_data=reconciliation_data,
                result=result_dict
            )
            logger.info(f"AI analysis generated for reconciliation {reconciliation_id}")
        except Exception as e:
            logger.error(f"Failed to generate AI analysis for reconciliation {reconciliation_id}: {e}")
            ai_analysis = None

        # Save results
        update_payload = {
            "status": ReconciliationStatus.COMPLETED.value,
            "result": reconciliation_result.model_dump(),
            "completed_at": datetime.now(timezone.utc), # ✅ Use timezone-aware datetime
        }

        # Add AI analysis if generated
        if ai_analysis:
            update_payload["ai_analysis"] = ai_analysis

        await reconciliations_ref.document(reconciliation_id).update(update_payload)

        logger.info(f"Reconciliation {reconciliation_id} completed successfully")

        # Publish completion event
        await publish_reconciliation_complete(reconciliation_id, tenant_id)

    except Exception as e:
        logger.error(f"Error in reconciliation {reconciliation_id}: {str(e)}", exc_info=True)
        try:
            # Update status to FAILED
            await reconciliations_ref.document(reconciliation_id).update({
                "status": ReconciliationStatus.FAILED.value,
                "error_message": str(e),
            })
        except Exception as update_e:
            # Log if we can't even update the status
            logger.error(f"CRITICAL: Failed to update status to FAILED for {reconciliation_id}: {update_e}")

        # ✅ CRITICAL: Re-raise the exception so the callback will nack() it
        raise e


# ✅ Renamed to async_callback and made async
async def async_callback(message: pubsub_v1.subscriber.message.Message):
    """Async callback for Pub/Sub messages."""
    reconciliation_id = None
    try:
        data = json.loads(message.data.decode("utf-8"))
        logger.info(f"Received message: {data}")

        reconciliation_id = data.get("reconciliation_id")
        tenant_id = data.get("tenant_id")

        if not all([reconciliation_id, tenant_id]):
            logger.error("Missing required fields in message, acking.")
            message.ack() # Can't retry this
            return

        # ✅ Run async reconciliation directly
        await perform_reconciliation(reconciliation_id, tenant_id)

        # ✅ Ack on success
        message.ack()
        logger.info(f"Message processed and acked: {reconciliation_id}")

    except Exception as e:
        # ✅ Nack on failure for retry
        logger.error(f"Error processing message {reconciliation_id}: {str(e)}", exc_info=True)
        message.nack()
        logger.warning(f"Message nacked for retry: {reconciliation_id}")


# ✅ Renamed to main_async and made async
async def main_async():
    """Start the Accountant Agent subscriber."""
    logger.info("Starting Accountant Agent (async)...")

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        settings.gcp_project_id, f"{settings.pubsub_reconciliation_trigger_topic}-sub"
    )

    # Get the running event loop
    loop = asyncio.get_running_loop()

    # --- THIS IS THE NEW SYNCHRONOUS WRAPPER ---
    def sync_callback(message: pubsub_v1.subscriber.message.Message):
        """
        Synchronous wrapper to schedule the async callback on the main event loop.
        This function is called by the Pub/Sub background thread.
        """
        logger.debug(f"Sync callback received, scheduling {message.message_id} on main loop.")
        
        # Safely schedule the *real* async callback to run on the main loop
        asyncio.run_coroutine_threadsafe(async_callback(message), loop)
    # --- END OF NEW WRAPPER ---

    # Subscribe using the *synchronous* wrapper
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=sync_callback)
    logger.info(f"Listening for messages on {subscription_path}")

    # Keep the script alive
    stop_event = asyncio.Event()
    try:
        await stop_event.wait()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, stopping...")
        streaming_pull_future.cancel()
        streaming_pull_future.result()
        logger.info("Accountant Agent stopped")
    except Exception as e:
        logger.error(f"An unexpected error occurred in main_async: {e}", exc_info=True)
        streaming_pull_future.cancel()
        streaming_pull_future.result()


if __name__ == "__main__":
    # ✅ Run the async main function
    asyncio.run(main_async())