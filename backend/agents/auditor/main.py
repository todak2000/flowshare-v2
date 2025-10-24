"""Auditor Agent - Validates production data and detects anomalies."""
import asyncio
import json
import logging
import sys
from concurrent import futures
from datetime import datetime

sys.path.append("../..")

from google.cloud import pubsub_v1
from shared.config import settings
from shared.database import get_firestore, FirestoreCollections
from shared.pubsub import publish_entry_flagged
from shared.models.production import ProductionEntryStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def validate_entry(entry_id: str, tenant_id: str, partner_id: str):
    """
    Validate a production entry for anomalies.

    This function:
    1. Fetches the entry from Firestore
    2. Fetches historical data for the partner
    3. Performs anomaly detection (simple statistical approach)
    4. Updates entry status
    5. Publishes alert if flagged
    """
    try:
        db = get_firestore()
        entries_ref = db.collection(FirestoreCollections.PRODUCTION_ENTRIES)

        # Get the entry
        entry_doc = await entries_ref.document(entry_id).get()
        if not entry_doc.exists:
            logger.error(f"Entry {entry_id} not found")
            return

        entry_data = entry_doc.to_dict()

        # Get historical data for anomaly detection
        historical_query = await entries_ref.where("tenant_id", "==", tenant_id).where(
            "partner_id", "==", partner_id
        ).where("status", "==", ProductionEntryStatus.VALIDATED.value).limit(10).get()

        # Calculate anomaly score
        anomaly_score = 0.0
        is_anomaly = False

        if len(historical_query) > 0:
            # Calculate average gross volume from historical data
            volumes = [doc.to_dict().get("gross_volume", 0) for doc in historical_query]
            avg_volume = sum(volumes) / len(volumes)
            std_dev = (sum((x - avg_volume) ** 2 for x in volumes) / len(volumes)) ** 0.5

            # Simple z-score anomaly detection
            current_volume = entry_data.get("gross_volume", 0)
            if std_dev > 0:
                z_score = abs((current_volume - avg_volume) / std_dev)
                anomaly_score = min(z_score / 3.0, 1.0)  # Normalize to 0-1

                # Flag if z-score > 2 (more than 2 standard deviations)
                if z_score > 2:
                    is_anomaly = True
                    logger.warning(
                        f"Entry {entry_id} flagged as anomaly: "
                        f"volume={current_volume}, avg={avg_volume}, z-score={z_score}"
                    )

        # Update entry status
        update_data = {
            "status": ProductionEntryStatus.FLAGGED.value
            if is_anomaly
            else ProductionEntryStatus.VALIDATED.value,
            "anomaly_score": anomaly_score,
            "validation_notes": f"Anomaly detected (z-score > 2)" if is_anomaly else "Validated",
            "updated_at": datetime.utcnow(),
        }

        await entries_ref.document(entry_id).update(update_data)
        logger.info(f"Entry {entry_id} validated: status={update_data['status']}")

        # If flagged, publish alert event
        if is_anomaly:
            # Get the user who submitted
            await publish_entry_flagged(
                entry_id=entry_id,
                tenant_id=tenant_id,
                user_id=entry_data.get("submitted_by", ""),
                anomaly_score=anomaly_score,
            )

    except Exception as e:
        logger.error(f"Error validating entry {entry_id}: {str(e)}")


def callback(message: pubsub_v1.subscriber.message.Message):
    """Callback for Pub/Sub messages."""
    try:
        data = json.loads(message.data.decode("utf-8"))
        logger.info(f"Received message: {data}")

        entry_id = data.get("entry_id")
        tenant_id = data.get("tenant_id")
        partner_id = data.get("partner_id")

        if not all([entry_id, tenant_id, partner_id]):
            logger.error("Missing required fields in message")
            message.ack()
            return

        # Run async validation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(validate_entry(entry_id, tenant_id, partner_id))
        loop.close()

        message.ack()
        logger.info(f"Message processed: {entry_id}")

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        message.nack()


def main():
    """Start the Auditor Agent subscriber."""
    logger.info("Starting Auditor Agent...")

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        settings.gcp_project_id, f"{settings.pubsub_production_entry_topic}-sub"
    )

    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    logger.info(f"Listening for messages on {subscription_path}")

    # Keep the subscriber running
    with futures.ThreadPoolExecutor() as executor:
        try:
            streaming_pull_future.result()
        except KeyboardInterrupt:
            streaming_pull_future.cancel()
            logger.info("Auditor Agent stopped")


if __name__ == "__main__":
    main()
