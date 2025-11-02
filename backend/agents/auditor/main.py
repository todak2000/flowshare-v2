"""Auditor Agent - Validates production data and detects anomalies."""
import asyncio
import json
import logging
import sys
import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager
sys.path.append("../..")
from google.cloud.firestore_v1 import FieldFilter
from google.cloud.pubsub_v1 import SubscriberClient
from google.cloud import pubsub_v1
from shared.config import settings
from shared.database import get_firestore, FirestoreCollections
from shared.pubsub import publish_entry_flagged
from shared.models.production import ProductionEntryStatus
from shared.ai import GeminiService
from fastapi import FastAPI
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini service
gemini_service = GeminiService()


async def validate_entry(entry_id: str, tenant_id: str, partner_id: str, entry_data: dict = None):
    """
    Validate a production entry for anomalies.

    This function:
    1. Uses entry data from Pub/Sub message (avoid race condition)
    2. Fetches historical data for the partner
    3. Performs anomaly detection (statistical z-score approach)
    4. Updates entry status
    5. Publishes alert if flagged
    """
    try:
        db = get_firestore()  # Must return AsyncClient
        entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

        # Use entry_data from message if provided (avoids race condition)
        if not entry_data:
            entry_doc = await entries_ref.document(entry_id).get()
            if not entry_doc.exists:
                logger.error(f"Entry {entry_id} not found")
                return
            entry_data = entry_doc.to_dict()

        # Get historical data for anomaly detection (approved entries only)
        historical_query = await entries_ref.where(filter=FieldFilter("tenant_id", "==", tenant_id)) \
            .where(filter=FieldFilter("partner_id", "==", partner_id)) \
            .where(filter=FieldFilter("status", "==", ProductionEntryStatus.APPROVED.value)) \
            .limit(20) \
            .get()

        # Calculate anomaly score
        anomaly_flags = []
        z_scores = []

        # Current entry values
        current_volume = entry_data.get("gross_volume", 0)
        current_bsw = entry_data.get("bsw_percent", 0)
        current_temp = entry_data.get("temperature", 0)
        current_api = entry_data.get("api_gravity", 0)
        current_meter_factor = entry_data.get("meter_factor", 1.0)

        # Basic range checks (always apply)
        if current_bsw > 50:
            anomaly_flags.append(f"Extremely high BSW% ({current_bsw}%)")
        elif current_bsw > 30:
            anomaly_flags.append(f"High water content (BSW {current_bsw}%)")

        if current_temp < 32 or current_temp > 200:
            anomaly_flags.append(f"Temperature out of range ({current_temp}°F)")

        if current_meter_factor < 0.8 or current_meter_factor > 1.2:
            anomaly_flags.append(f"Unusual meter factor ({current_meter_factor})")

        if current_volume > 100000:
            anomaly_flags.append(f"Extremely large volume ({current_volume} BBL)")

        # Statistical analysis if we have historical data
        if len(historical_query) > 3:
            volumes = [doc.to_dict().get("gross_volume", 0) for doc in historical_query]
            bsw_values = [doc.to_dict().get("bsw_percent", 0) for doc in historical_query]
            temps = [doc.to_dict().get("temperature", 0) for doc in historical_query]
            api_values = [doc.to_dict().get("api_gravity", 0) for doc in historical_query]

            def calc_stats(values):
                if not values:
                    return 0, 0
                mean = sum(values) / len(values)
                variance = sum((x - mean) ** 2 for x in values) / len(values)
                return mean, variance ** 0.5

            def get_z_score(value, mean, std_dev):
                if std_dev == 0:
                    return 0
                return abs((value - mean) / std_dev)

            # Volume
            vol_mean, vol_std = calc_stats(volumes)
            if vol_std > 0:
                vol_z = get_z_score(current_volume, vol_mean, vol_std)
                z_scores.append(vol_z)
                if vol_z > 3:
                    anomaly_flags.append(f"Volume deviation: {vol_z:.1f}σ from normal")

            # BSW
            bsw_mean, bsw_std = calc_stats(bsw_values)
            if bsw_std > 0:
                bsw_z = get_z_score(current_bsw, bsw_mean, bsw_std)
                z_scores.append(bsw_z)
                if bsw_z > 2.5:
                    anomaly_flags.append(f"BSW% deviation: {bsw_z:.1f}σ from normal")

            # Temperature
            temp_mean, temp_std = calc_stats(temps)
            if temp_std > 0:
                temp_z = get_z_score(current_temp, temp_mean, temp_std)
                z_scores.append(temp_z)
                if temp_z > 2:
                    anomaly_flags.append(f"Temperature deviation: {temp_z:.1f}σ from normal")

            # API gravity
            api_mean, api_std = calc_stats(api_values)
            if api_std > 0:
                api_z = get_z_score(current_api, api_mean, api_std)
                z_scores.append(api_z)
                if api_z > 2:
                    anomaly_flags.append(f"API gravity deviation: {api_z:.1f}σ from normal")

        # Final anomaly score
        max_z = max(z_scores) if z_scores else 0
        base_score = min(max_z * 20, 100)
        flag_score = len(anomaly_flags) * 10
        anomaly_score = min(base_score + flag_score, 100)

        is_anomaly = len(anomaly_flags) > 0 or anomaly_score > 60

        # Generate AI analysis if flagged
        ai_analysis = None
        if is_anomaly:
            logger.warning(
                f"Entry {entry_id} flagged: score={anomaly_score:.1f}, "
                f"flags={len(anomaly_flags)}, reasons={anomaly_flags[:3]}"
            )

            # Prepare acceptable ranges for AI context
            acceptable_ranges = {
                "bsw_percent": (0, 30),
                "temperature": (32, 200),
                "api_gravity": (10, 50),
                "meter_factor": (0.8, 1.2),
                "gross_volume": (0, 100000)
            }

            # Determine which fields were flagged
            flagged_fields = []
            if current_bsw > 30:
                flagged_fields.append("BSW%")
            if current_temp < 32 or current_temp > 200:
                flagged_fields.append("Temperature")
            if current_meter_factor < 0.8 or current_meter_factor > 1.2:
                flagged_fields.append("Meter Factor")
            if current_volume > 100000:
                flagged_fields.append("Gross Volume")
            if any("API gravity" in flag for flag in anomaly_flags):
                flagged_fields.append("API Gravity")

            # Get partner name for context
            try:
                users_ref = db.collection(FirestoreCollections.USERS)
                partner_doc = await users_ref.document(partner_id).get()
                partner_name = "Unknown Partner"
                if partner_doc.exists:
                    partner_data = partner_doc.to_dict()
                    partner_name = partner_data.get("organization") or partner_data.get("full_name", "Unknown Partner")

                # Add partner name to entry data for AI analysis
                entry_data_with_name = {**entry_data, "partner_name": partner_name}

                # Generate AI analysis
                logger.info(f"Generating AI analysis for flagged entry {entry_id}")
                ai_analysis = await gemini_service.analyze_flagged_production(
                    entry_data=entry_data_with_name,
                    acceptable_ranges=acceptable_ranges,
                    flagged_fields=flagged_fields or ["General anomaly"]
                )
                logger.info(f"AI analysis generated for entry {entry_id}")
            except Exception as e:
                logger.error(f"Failed to generate AI analysis for entry {entry_id}: {e}")
                ai_analysis = None

        # Update entry
        update_data = {
            "status": ProductionEntryStatus.FLAGGED.value if is_anomaly else ProductionEntryStatus.APPROVED.value,
            "anomaly_score": round(anomaly_score, 2),
            "validation_notes": " | ".join(anomaly_flags) if anomaly_flags else "Validated - no anomalies detected",
            "updated_at": datetime.now(timezone.utc),
        }

        # Add AI analysis if generated
        if ai_analysis:
            update_data["ai_analysis"] = ai_analysis

        await entries_ref.document(entry_id).update(update_data)
        logger.info(f"Entry {entry_id} validated: status={update_data['status']}, score={anomaly_score:.1f}")

        # Publish alert if flagged
        if is_anomaly:
            await publish_entry_flagged(
                entry_id=entry_id,
                tenant_id=tenant_id,
                anomaly_score=round(anomaly_score, 2),
                flags=anomaly_flags,
                user_id=entry_data.get("submitted_by"),
            )

    except Exception as e:
        logger.error(f"Error validating entry {entry_id}: {str(e)}", exc_info=True)


async def async_callback(message: pubsub_v1.subscriber.message.Message):
    """Async callback for Pub/Sub messages."""
    try:
        data = json.loads(message.data.decode("utf-8"))
        logger.info(f"Received message: {data.get('event_type')}")

        # 1. Get the event type from the message payload
        event_type = data.get("event_type")

        # 2. Route the message based on its type
        # The Auditor's job is to validate, so it can run for created and edited events.
        if event_type == "production_entry_created" or event_type == "production_entry_edited":
            
            entry_id = data.get("entry_id")
            tenant_id = data.get("tenant_id")
            partner_id = data.get("partner_id")
            entry_data = data.get("entry_data") # Used to avoid race conditions

            if not all([entry_id, tenant_id, partner_id]):
                logger.error("Missing required fields (entry_id, tenant_id, partner_id), acking.")
                message.ack()
                return

            # Run the validation logic
            await validate_entry(entry_id, tenant_id, partner_id, entry_data)
            
            message.ack()
            logger.info(f"Message processed: {entry_id} for event {event_type}")

        else:
            # If it's an event this agent doesn't care about
            logger.warning(f"Unknown or unhandled event type: {event_type}, acking.")
            message.ack()

    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from message: {e}", exc_info=True)
        message.ack() # Ack because we can't retry a badly formed message
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}", exc_info=True)
        message.nack() # Nack for all other errors to allow retry

async def run_subscriber_worker():
    """Start the Auditor Agent subscriber asynchronously."""
    logger.info("Starting Auditor Agent (async worker)...")

    subscriber = SubscriberClient()

    # 1. Define all topics this agent should listen to
    topics = [
        settings.pubsub_production_entry_topic,     # For 'production_entry_created'
        settings.publish_production_entry_edited    # For 'production_entry_edited'
    ]

    # Get the running event loop
    loop = asyncio.get_running_loop()

    # 2. Your synchronous wrapper (no changes needed)
    def sync_callback(message: pubsub_v1.subscriber.message.Message):
        """
        Synchronous wrapper to schedule the async callback on the main event loop.
        """
        logger.debug(f"Sync callback received, scheduling {message.message_id} on main loop.")
        asyncio.run_coroutine_threadsafe(async_callback(message), loop)

    # 3. Create a list to hold all subscription futures
    streaming_pull_futures = []

    logger.info(f"Setting up {len(topics)} subscriptions...")
    for topic in topics:
        if not topic:  # Skip if a setting is empty
            continue
        
        # Create the subscription path (e.g., "production-entry-created-sub")
        subscription_name = f"{topic}-sub"
        subscription_path = subscriber.subscription_path(
            settings.gcp_project_id, subscription_name
        )

        # 4. Subscribe to each one and add its future to the list
        future = subscriber.subscribe(subscription_path, callback=sync_callback)
        streaming_pull_futures.append(future)
        logger.info(f"Listening for messages on {subscription_path}")

    # 5. Keep the script running
    stop_event = asyncio.Event()
    try:
        await stop_event.wait()
    except asyncio.CancelledError:  # ✅ Handle CancelledError gracefully
        logger.info("Worker shutdown initiated...")
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, stopping...")
    except Exception as e:
        logger.error(f"An unexpected error occurred in worker: {e}", exc_info=True)
    finally:
        # 6. Cancel ALL futures on shutdown
        logger.info(f"Cancelling {len(streaming_pull_futures)} subscription futures...")
        for future in streaming_pull_futures:
            future.cancel()
            future.result()  # Wait for cancellation to complete
        logger.info("Auditor Agent worker stopped")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On server startup, create a background task
    to run our Pub/Sub worker. On shutdown, cancel it.
    """
    logger.info("Server startup: Creating background Pub/Sub worker task.")
    # Create the task
    worker_task = asyncio.create_task(run_subscriber_worker())
    
    yield  # This is where the application runs
    
    # After the application shuts down, cancel the worker task
    logger.info("Server shutdown: Cancelling background worker task...")
    worker_task.cancel()
    try:
        # Wait for the task to finish cancelling
        await worker_task
    except asyncio.CancelledError:
        logger.info("Background worker task successfully cancelled.")

# Create the FastAPI app and attach the lifespan event handler
app = FastAPI(lifespan=lifespan)  # ✅ --- ATTACH LIFESPAN HERE ---

@app.get("/")
async def health_check():
    """
    A simple health check endpoint that Cloud Run can ping.
    If this responds 200 OK, Cloud Run knows the container is alive.
    """
    return {"status": "healthy", "worker": "auditor-agent"}

# ✅ --- THIS IS THE NEW ENTRY POINT (no changes here) ---

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    logger.info(f"Starting web server on host 0.0.0.0 and port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)