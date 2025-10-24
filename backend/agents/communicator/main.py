"""Communicator Agent - Sends notifications and generates reports."""
import asyncio
import json
import logging
import sys
from concurrent import futures

sys.path.append("../..")

from google.cloud import pubsub_v1
from shared.config import settings
from shared.database import get_firestore, FirestoreCollections
from shared.email import (
    send_email,
    render_anomaly_alert_email,
    render_reconciliation_complete_email,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def handle_entry_flagged(entry_id: str, tenant_id: str, user_id: str, anomaly_score: float):
    """
    Handle entry flagged event.

    Sends anomaly alert email to user if they have email_anomaly_alerts enabled.
    """
    try:
        db = get_firestore()

        # Get user
        users_ref = db.collection(FirestoreCollections.USERS)
        user_query = await users_ref.where("firebase_uid", "==", user_id).limit(1).get()

        if not user_query:
            logger.warning(f"User {user_id} not found")
            return

        user_data = user_query[0].to_dict()
        notification_settings = user_data.get("notification_settings", {})

        # Check if user wants anomaly alerts
        if not notification_settings.get("email_anomaly_alerts", True):
            logger.info(f"User {user_id} has anomaly alerts disabled")
            return

        # Get entry details
        entry_doc = await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).get()
        if not entry_doc.exists:
            logger.warning(f"Entry {entry_id} not found")
            return

        entry_data = entry_doc.to_dict()

        # Render email using template
        html_body = render_anomaly_alert_email(
            user_name=user_data.get('full_name', 'User'),
            entry_id=entry_id,
            partner_id=entry_data.get('partner_id', 'N/A'),
            gross_volume=entry_data.get('gross_volume', 0),
            anomaly_score=anomaly_score,
            validation_notes=entry_data.get('validation_notes', ''),
        )

        # Send email
        subject = "⚠️ FlowShare: Anomaly Detected in Production Data"
        await send_email(
            to_email=user_data.get("email"),
            to_name=user_data.get('full_name', 'User'),
            subject=subject,
            html_body=html_body,
        )
        logger.info(f"Anomaly alert sent to {user_data.get('email')}")

    except Exception as e:
        logger.error(f"Error handling entry flagged event: {str(e)}")


async def handle_reconciliation_complete(reconciliation_id: str, tenant_id: str):
    """
    Handle reconciliation complete event.

    Sends reconciliation report to users who have email_reports enabled.
    """
    try:
        db = get_firestore()

        # Get reconciliation
        reconciliation_doc = await db.collection(FirestoreCollections.RECONCILIATIONS).document(
            reconciliation_id
        ).get()

        if not reconciliation_doc.exists:
            logger.warning(f"Reconciliation {reconciliation_id} not found")
            return

        reconciliation_data = reconciliation_doc.to_dict()
        result = reconciliation_data.get("result", {})

        # Get all users in tenant
        users_ref = db.collection(FirestoreCollections.USERS)
        users_query = await users_ref.where("tenant_ids", "array_contains", tenant_id).get()

        # Send email to each user with email_reports enabled
        for user_doc in users_query:
            user_data = user_doc.to_dict()
            notification_settings = user_data.get("notification_settings", {})

            # Check if user wants report emails
            if not notification_settings.get("email_reports", True):
                logger.info(f"User {user_data.get('email')} has report emails disabled")
                continue

            # Determine if user is a partner (to show partner-specific view)
            user_role = user_data.get('role', '')
            user_partner_id = user_data.get('partner_id')
            user_allocated_volume = None

            # Find user's allocation if they're a partner
            if user_partner_id and user_role == 'partner':
                partner_allocations = result.get('partner_allocations', [])
                for allocation in partner_allocations:
                    if allocation.get('partner_id') == user_partner_id:
                        user_allocated_volume = allocation.get('allocated_volume')
                        break

            # Render email using template
            html_body = render_reconciliation_complete_email(
                user_name=user_data.get('full_name', 'User'),
                reconciliation_id=reconciliation_id,
                period_start=str(reconciliation_data.get('period_start', '')),
                period_end=str(reconciliation_data.get('period_end', '')),
                terminal_volume=reconciliation_data.get('terminal_volume', 0),
                total_allocated=result.get('total_allocated_volume', 0),
                shrinkage_percent=result.get('shrinkage_percent', 0),
                partner_count=len(result.get('partner_allocations', [])),
                user_partner_id=user_partner_id if user_allocated_volume is not None else None,
                user_allocated_volume=user_allocated_volume,
            )

            # Send email
            subject = "✅ FlowShare: Reconciliation Complete"
            await send_email(
                to_email=user_data.get("email"),
                to_name=user_data.get('full_name', 'User'),
                subject=subject,
                html_body=html_body,
            )
            logger.info(f"Reconciliation report sent to {user_data.get('email')}")

    except Exception as e:
        logger.error(f"Error handling reconciliation complete event: {str(e)}")


def callback(message: pubsub_v1.subscriber.message.Message):
    """Callback for Pub/Sub messages."""
    try:
        data = json.loads(message.data.decode("utf-8"))
        event_type = data.get("event_type")
        logger.info(f"Received message: {event_type}")

        # Run async handler based on event type
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        if event_type == "entry_flagged":
            loop.run_until_complete(
                handle_entry_flagged(
                    entry_id=data.get("entry_id"),
                    tenant_id=data.get("tenant_id"),
                    user_id=data.get("user_id"),
                    anomaly_score=data.get("anomaly_score", 0),
                )
            )
        elif event_type == "reconciliation_complete":
            loop.run_until_complete(
                handle_reconciliation_complete(
                    reconciliation_id=data.get("reconciliation_id"),
                    tenant_id=data.get("tenant_id"),
                )
            )
        else:
            logger.warning(f"Unknown event type: {event_type}")

        loop.close()
        message.ack()

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        message.nack()


def main():
    """Start the Communicator Agent subscriber."""
    logger.info("Starting Communicator Agent...")

    subscriber = pubsub_v1.SubscriberClient()

    # Subscribe to multiple topics
    topics = [
        settings.pubsub_entry_flagged_topic,
        settings.pubsub_reconciliation_complete_topic,
    ]

    futures_list = []
    for topic in topics:
        subscription_path = subscriber.subscription_path(
            settings.gcp_project_id, f"{topic}-sub"
        )
        future = subscriber.subscribe(subscription_path, callback=callback)
        logger.info(f"Listening for messages on {subscription_path}")
        futures_list.append(future)

    # Keep the subscriber running
    with futures.ThreadPoolExecutor() as executor:
        try:
            for future in futures_list:
                future.result()
        except KeyboardInterrupt:
            for future in futures_list:
                future.cancel()
            logger.info("Communicator Agent stopped")


if __name__ == "__main__":
    main()
