"""Communicator Agent - Sends notifications and generates reports."""
import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
import sys
from datetime import datetime, timezone  # <-- Moved to top
from google.cloud.firestore_v1 import AsyncClient, FieldFilter
from google.cloud import pubsub_v1

from concurrent import futures  # This is no longer strictly needed but OK

from fastapi import FastAPI
import uvicorn

sys.path.append("../..")
from shared.config import settings
from shared.database import get_firestore, FirestoreCollections
from shared.email import (
    send_email,
    render_anomaly_alert_email,
    render_reconciliation_complete_email,
    render_invitation_email,
    render_entry_edited_email
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def handle_entry_flagged(entry_id: str, tenant_id: str, user_id: str, anomaly_score: float):
    """
    Handle entry flagged event.

    Sends anomaly alert email to field operator, partner, and coordinator.
    Always includes admin (todak2000@gmail.com) in CC.
    Field operator's email preferences are respected, but partner and coordinator always receive the alert.
    """
    try:
        # ✅ IMPROVEMENT: Use the shared get_firestore() client
        db: AsyncClient = get_firestore()

        # Get entry details first
        entry_doc = await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).get()
        if not entry_doc.exists:
            logger.warning(f"Entry {entry_id} not found")
            return

        entry_data = entry_doc.to_dict()

        # Get user (field operator who submitted the entry)
        users_ref = db.collection(FirestoreCollections.USERS)
        user_query = await users_ref.where(filter=FieldFilter("firebase_uid", "==", user_id)).limit(1).get()

        if not user_query:
            logger.warning(f"User {user_id} not found")
            return

        user_data = user_query[0].to_dict()
        user_email = user_data.get("email")
        user_name = user_data.get('full_name', 'User')
        notification_settings = user_data.get("notification_settings", {})

        # Build recipient list: Always send to partner and coordinator
        # Field operator is optional based on their settings
        to_emails = []

        # Get partner email (if entry has partner_id) - ALWAYS include
        partner_id = entry_data.get('partner_id')
        partner_email = None
        if partner_id:
            partner_doc = await users_ref.document(partner_id).get()
            if partner_doc.exists:
                partner_email = partner_doc.to_dict().get('email')
                partner_name = partner_doc.to_dict().get('full_name', 'Partner')
                if partner_email:
                    to_emails.append(partner_email)
                    logger.info(f"Adding partner {partner_email} to recipients")

        # Get coordinator email (tenant owner) - ALWAYS include
        tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()
        coordinator_email = None
        if tenant_doc.exists:
            tenant_data = tenant_doc.to_dict()
            owner_id = tenant_data.get('owner_id')
            if owner_id:
                owner_doc = await users_ref.document(owner_id).get()
                if owner_doc.exists:
                    coordinator_email = owner_doc.to_dict().get('email')
                    coordinator_name = owner_doc.to_dict().get('full_name', 'Coordinator')
                    if coordinator_email:
                        to_emails.append(coordinator_email)
                        logger.info(f"Adding coordinator {coordinator_email} to recipients")

        # Add field operator if they want alerts
        if user_email and notification_settings.get("email_anomaly_alerts", True):
            to_emails.append(user_email)
            logger.info(f"Adding field operator {user_email} to recipients")
        else:
            logger.info(f"Field operator {user_email} has alerts disabled, skipping")

        # If no recipients, skip email
        if not to_emails:
            logger.warning(f"No recipients for anomaly alert {entry_id}")
            return

        # Render email using template
        html_body = render_anomaly_alert_email(
            user_name=user_name,
            entry_id=entry_id,
            partner_id=entry_data.get('partner_id', 'N/A'),
            gross_volume=entry_data.get('gross_volume', 0),
            anomaly_score=anomaly_score,
            validation_notes=entry_data.get('validation_notes', ''),
        )

        # Send email to all recipients with admin in CC
        subject = "⚠️ FlowShare: Anomaly Detected in Production Data"

        # Send to each recipient individually to respect privacy
        for recipient_email in to_emails:
            await send_email(
                to_email=recipient_email,
                to_name=user_name,  # Generic name for all
                subject=subject,
                html_body=html_body,
                cc_emails=["todak2000@gmail.com"],  # Always CC admin
            )
            logger.info(f"Anomaly alert sent to {recipient_email}")

        logger.info(f"Anomaly alert sent to {len(to_emails)} recipients for entry {entry_id}")

    except Exception as e:
        logger.error(f"Error handling entry flagged event: {str(e)}")
        raise  # ✅ IMPROVEMENT: Re-raise to be caught by callback


async def handle_invitation_created(
    invitation_id: str,
    tenant_id: str,
    email: str,
    partner_name: str,
    invited_by_user_id: str,
    role: str,
    expires_at: str,
):
    try:
        # ✅ IMPROVEMENT: Use the shared get_firestore() client
        db: AsyncClient = get_firestore()

        # Get tenant name
        tenant_doc = await db.collection(FirestoreCollections.TENANTS).document(tenant_id).get()
        tenant_name = tenant_doc.to_dict().get("name", "a joint venture") if tenant_doc.exists else "a joint venture"

        # Get inviter details
        users_ref = db.collection(FirestoreCollections.USERS)
        inviter_query = await users_ref.where("firebase_uid", "==", invited_by_user_id).limit(1).get()
        inviter_name = "A colleague"
        if inviter_query:
            inviter_data = inviter_query[0].to_dict()
            inviter_name = inviter_data.get("full_name") or inviter_data.get("email") or "A colleague"

        # Format expiration date for email (e.g., "October 25, 2025 at 3:30 PM UTC")
        try:
            expires_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            formatted_expires = expires_dt.strftime("%B %d, %Y at %I:%M %p UTC")
        # ✅ IMPROVEMENT: Catch specific errors, not bare except:
        except (ValueError, TypeError) as e: 
            logger.warning(f"Could not parse expires_at date '{expires_at}': {e}")
            formatted_expires = expires_at  # fallback

        # Render email
        html_body = render_invitation_email(
            invitee_name=partner_name,
            inviter_name=inviter_name,
            tenant_name=tenant_name,
            role=role,
            invitation_id=invitation_id,
            expires_at=formatted_expires,
        )

        await send_email(
            to_email=email,
            to_name=partner_name,
            subject="You're invited to join FlowShare!",
            html_body=html_body,
        )
        logger.info(f"Invitation email sent to {email} for invitation {invitation_id}")

    except Exception as e:
        logger.error(f"Error in handle_invitation_created: {str(e)}")
        raise  # ✅ IMPROVEMENT: Re-raise to be caught by callback

async def handle_production_entry_edited(
    entry_id: str,
    tenant_id: str,
    partner_id: str,
    edited_by_user_id: str,
    edit_reason: str,
):
    """
    Handle production entry edited event.

    Sends edit notification email to partner users.
    """
    try:
        # ✅ IMPROVEMENT: Use the shared get_firestore() client
        db: AsyncClient = get_firestore()

        # Get editor details
        users_ref = db.collection(FirestoreCollections.USERS)
        editor_query = await users_ref.where(filter=FieldFilter("firebase_uid", "==", edited_by_user_id)).limit(1).get()

        editor_name = "A coordinator"
        if editor_query:
            editor_data = editor_query[0].to_dict()
            editor_name = editor_data.get("full_name") or editor_data.get("email") or "A coordinator"

        # Get entry details
        entry_doc = await db.collection(FirestoreCollections.PRODUCTION_ENTRIES).document(entry_id).get()
        if not entry_doc.exists:
            logger.warning(f"Entry {entry_id} not found")
            return

        entry_data = entry_doc.to_dict()

        # Get all partner users for this partner
        partner_users_query = await users_ref.where(filter=FieldFilter("partner_id", "==", partner_id)).get()

        # Send email to each partner user
        for user_doc in partner_users_query:
            user_data = user_doc.to_dict()

            # Skip if user is the editor
            if user_data.get("firebase_uid") == edited_by_user_id:
                continue
            
            # Skip if user doesn't have an email
            user_email = user_data.get("email")
            if not user_email:
                continue

            # Render email using template
            html_body = render_entry_edited_email(
                user_name=user_data.get('full_name', 'User'),
                entry_id=entry_id,
                editor_name=editor_name,
                edit_reason=edit_reason,
                measurement_date=str(entry_data.get('measurement_date', '')),
                gross_volume=entry_data.get('gross_volume', 0),
                bsw_percent=entry_data.get('bsw_percent', 0),
                temperature=entry_data.get('temperature', 0),
            )

            # Send email
            subject = "📝 FlowShare: Production Entry Updated - Approval Required"
            await send_email(
                to_email=user_email,
                to_name=user_data.get('full_name', 'User'),
                subject=subject,
                html_body=html_body,
            )
            logger.info(f"Edit notification sent to {user_email}")

    except Exception as e:
        logger.error(f"Error handling production entry edited event: {str(e)}")
        raise  # ✅ IMPROVEMENT: Re-raise to be caught by callback
    # ❌ CRITICAL: Removed the `finally: await db.close()` block


async def handle_reconciliation_complete(reconciliation_id: str, tenant_id: str):
    """
    Handle reconciliation complete event.

    Sends reconciliation report to users who have email_reports enabled.
    """
    try:
        # ✅ IMPROVEMENT: Use the shared get_firestore() client
        db: AsyncClient = get_firestore()

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
            user_email = user_data.get("email")

            # Check if user wants report emails and has an email
            if not user_email or not notification_settings.get("email_reports", True):
                logger.info(f"User {user_data.get('email')} has report emails disabled or no email")
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
                to_email=user_email,
                to_name=user_data.get('full_name', 'User'),
                subject=subject,
                html_body=html_body,
            )
            logger.info(f"Reconciliation report sent to {user_email}")

    except Exception as e:
        logger.error(f"Error handling reconciliation complete event: {str(e)}")
        raise  # ✅ IMPROVEMENT: Re-raise to be caught by callback


# ✅ IMPROVEMENT: Renamed to `async_callback` and made `async`
async def async_callback(message: pubsub_v1.subscriber.message.Message):
    """Asynchronous callback to process Pub/Sub messages."""
    logger.info("✅ Received raw Pub/Sub message")
    try:
        data = json.loads(message.data.decode("utf-8"))
        event_type = data.get("event_type")
        logger.info(f"Received message: {event_type}")

        # ✅ IMPROVEMENT: Await handlers directly, no asyncio.run()
        try:
            if event_type == "entry_flagged":
                await handle_entry_flagged(
                    entry_id=data.get("entry_id"),
                    tenant_id=data.get("tenant_id"),
                    user_id=data.get("user_id"),
                    anomaly_score=data.get("anomaly_score", 0),
                )
            elif event_type == "reconciliation_complete":
                await handle_reconciliation_complete(
                    reconciliation_id=data.get("reconciliation_id"),
                    tenant_id=data.get("tenant_id"),
                )
            elif event_type == "invitation_created":
                await handle_invitation_created(
                    invitation_id=data["invitation_id"],
                    tenant_id=data["tenant_id"],
                    email=data["email"],
                    partner_name=data["partner_name"],
                    invited_by_user_id=data["invited_by_user_id"],
                    role=data["role"],
                    expires_at=data["expires_at"],
                )
            elif event_type == "production_entry_edited":
                await handle_production_entry_edited(
                    entry_id=data.get("entry_id"),
                    tenant_id=data.get("tenant_id"),
                    partner_id=data.get("partner_id"),
                    edited_by_user_id=data.get("edited_by_user_id"),
                    edit_reason=data.get("edit_reason", ""),
                )
            else:
                logger.warning(f"Unknown event type: {event_type}")

            # ✅ IMPROVEMENT: Ack only on success
            message.ack()
            logger.info(f"✅ Message acknowledged: {event_type}")

        except Exception as handler_error:
            # ✅ IMPROVEMENT: Nack on failure to allow retries
            logger.error(f"❌ Error in handler for {event_type}: {str(handler_error)}", exc_info=True)
            message.nack()
            logger.warning(f"⚠️  Message nacked for retry: {event_type}")

    except Exception as e:
        # Critical error (e.g., JSON parsing)
        logger.error(f"❌ Critical error processing message: {str(e)}", exc_info=True)
        message.nack() # Nack here too, but it might go to dead-letter

# ✅ RENAMED from main_async to run_subscriber_worker
# ✅ ADDED better shutdown logic in 'finally' block
async def run_subscriber_worker():
    """Start the Communicator Agent subscriber."""
    logger.info("Starting Communicator Agent (async worker)...")

    subscriber = pubsub_v1.SubscriberClient()

    topics = [
        settings.pubsub_entry_flagged_topic,
        settings.pubsub_reconciliation_complete_topic,
        settings.pubsub_invitation_created_topic,
        settings.publish_production_entry_edited  # Fixed: use correct setting name
    ]

    subscription_paths = []
    for topic in topics:
        if not topic:
            continue
        path = subscriber.subscription_path(
            settings.gcp_project_id, f"{topic}-sub"
        )
        subscription_paths.append(path)
        logger.info(f"Will listen for messages on {path}")
    
    loop = asyncio.get_running_loop()

    def sync_callback(message: pubsub_v1.subscriber.message.Message):
        """
        Synchronous wrapper to schedule the async callback on the main event loop.
        """
        logger.debug(f"Sync callback received, scheduling {message.message_id} on main loop.")
        asyncio.run_coroutine_threadsafe(async_callback(message), loop)
    
    streaming_pull_futures = []
    for subscription_path in subscription_paths:
        future = subscriber.subscribe(subscription_path, callback=sync_callback)
        streaming_pull_futures.append(future)
    
    logger.info(f"Listening for messages on {len(subscription_paths)} subscriptions...")
    
    stop_event = asyncio.Event()
    try:
        # Keep the worker alive
        await stop_event.wait()
    except asyncio.CancelledError:
        logger.info("Worker shutdown initiated by lifespan...")
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, stopping...")
    except Exception as e:
        logger.error(f"An unexpected error occurred in worker: {e}", exc_info=True)
    finally:
        # This block now runs on ANY exit, ensuring clean shutdown
        logger.info(f"Cancelling {len(streaming_pull_futures)} subscription futures...")
        for future in streaming_pull_futures:
            future.cancel()
            future.result()  # Wait for cancellation
        logger.info("Communicator Agent worker stopped")


# ✅ --- THIS IS THE NEW WEB SERVER LOGIC (using lifespan) ---

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
    return {"status": "healthy", "worker": "communicator-agent"}


# ✅ --- THIS IS THE NEW ENTRY POINT ---

if __name__ == "__main__":
    # This is the entry point for the container

    # Cloud Run provides the PORT environment variable
    # Fallback to 8002 for local development
    port = int(os.environ.get("PORT", 8003))

    logger.info(f"Starting web server on host 0.0.0.0 and port {port}")

    # This command starts the FastAPI server
    # It will automatically use the asyncio loop
    uvicorn.run(app, host="0.0.0.0", port=port)