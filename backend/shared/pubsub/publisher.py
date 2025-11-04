"""Pub/Sub publisher utilities."""
from google.cloud import pubsub_v1
from typing import Dict, Any, Optional
import json
import logging
from ..config import settings
from ..utils.circuit_breaker import async_retry, pubsub_breaker, CircuitBreakerError

logger = logging.getLogger(__name__)

_publisher: Optional[pubsub_v1.PublisherClient] = None


def get_publisher() -> pubsub_v1.PublisherClient:
    """Get or create Pub/Sub publisher client."""
    global _publisher
    if _publisher is None:
        _publisher = pubsub_v1.PublisherClient()
    return _publisher


@async_retry(
    max_attempts=3,
    initial_delay=1.0,
    max_delay=10.0,
    exceptions=(Exception,)
)
async def publish_message(topic_name: str, data: Dict[str, Any], **attributes) -> str:
    """
    Publish a message to a Pub/Sub topic with retry logic and circuit breaker.

    Retries up to 3 times with exponential backoff.
    Circuit breaker opens after 5 consecutive failures.

    Args:
        topic_name: Name of the topic (not full path)
        data: Message data as dictionary
        **attributes: Additional message attributes

    Returns:
        Message ID

    Raises:
        CircuitBreakerError: If circuit breaker is open
        Exception: If all retry attempts fail
    """
    try:
        async with pubsub_breaker:
            publisher = get_publisher()
            topic_path = publisher.topic_path(settings.gcp_project_id, topic_name)

            # Encode message as JSON
            message_bytes = json.dumps(data).encode("utf-8")

            # Publish message (this returns a Future)
            future = publisher.publish(topic_path, message_bytes, **attributes)
            message_id = future.result()  # Block until published
            logger.info(f"Published message {message_id} to {topic_name}")
            return message_id
    except CircuitBreakerError as e:
        logger.error(f"Circuit breaker open for Pub/Sub: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Failed to publish message to {topic_name}: {str(e)}")
        raise


async def publish_production_entry_created(
    entry_id: str,
    tenant_id: str,
    partner_id: str,
    entry_data: Optional[Dict[str, Any]] = None
):
    """Publish production entry created event with full entry data for auditor analysis."""
    message_data = {
        "entry_id": entry_id,
        "tenant_id": tenant_id,
        "partner_id": partner_id,
        "event_type": "production_entry_created",
    }

    # Include full entry data if provided (for auditor agent)
    if entry_data:
        message_data["entry_data"] = entry_data

    await publish_message(
        settings.pubsub_production_entry_topic,
        message_data,
    )


async def publish_reconciliation_triggered(reconciliation_id: str, tenant_id: str):
    """Publish reconciliation triggered event."""
    await publish_message(
        settings.pubsub_reconciliation_trigger_topic,
        {
            "reconciliation_id": reconciliation_id,
            "tenant_id": tenant_id,
            "event_type": "reconciliation_triggered",
        },
    )


async def publish_entry_flagged(
    entry_id: str,
    tenant_id: str,
    anomaly_score: float,
    flags: Optional[list] = None,
    user_id: Optional[str] = None
):
    """Publish entry flagged event with anomaly details."""
    message_data = {
        "entry_id": entry_id,
        "tenant_id": tenant_id,
        "anomaly_score": anomaly_score,
        "event_type": "entry_flagged",
    }

    if flags:
        message_data["flags"] = flags

    if user_id:
        message_data["user_id"] = user_id

    await publish_message(
        settings.pubsub_entry_flagged_topic,
        message_data,
    )


async def publish_reconciliation_complete(reconciliation_id: str, tenant_id: str):
    """Publish reconciliation complete event."""
    await publish_message(
        settings.pubsub_reconciliation_complete_topic,
        {
            "reconciliation_id": reconciliation_id,
            "tenant_id": tenant_id,
            "event_type": "reconciliation_complete",
        },
    )

async def publish_invitation_created(
    invitation_id: str,
    tenant_id: str,
    email: str,
    partner_name: str,
    invited_by_user_id: str,
    role: str,
    expires_at: str,
):
    """Publish invitation created event for email delivery."""
    await publish_message(
        settings.pubsub_invitation_created_topic,
        {
            "event_type": "invitation_created",
            "invitation_id": invitation_id,
            "tenant_id": tenant_id,
            "email": email,
            "partner_name": partner_name,
            "invited_by_user_id": invited_by_user_id,
            "role": role,
            "expires_at": expires_at,
        },
    )


async def publish_production_entry_edited(
    entry_id: str,
    tenant_id: str,
    partner_id: str,
    edited_by_user_id: str,
    edit_reason: str,
):
    """Publish production entry edited event for partner notification."""
    await publish_message(
        settings.pubsub_entry_edited_topic,
        {
            "event_type": "production_entry_edited",
            "entry_id": entry_id,
            "tenant_id": tenant_id,
            "partner_id": partner_id,
            "edited_by_user_id": edited_by_user_id,
            "edit_reason": edit_reason,
        },
    )