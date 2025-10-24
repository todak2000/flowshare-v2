"""Pub/Sub publisher utilities."""
from google.cloud import pubsub_v1
from typing import Dict, Any, Optional
import json
import logging
from ..config import settings

logger = logging.getLogger(__name__)

_publisher: Optional[pubsub_v1.PublisherClient] = None


def get_publisher() -> pubsub_v1.PublisherClient:
    """Get or create Pub/Sub publisher client."""
    global _publisher
    if _publisher is None:
        _publisher = pubsub_v1.PublisherClient()
    return _publisher


async def publish_message(topic_name: str, data: Dict[str, Any], **attributes) -> str:
    """
    Publish a message to a Pub/Sub topic.

    Args:
        topic_name: Name of the topic (not full path)
        data: Message data as dictionary
        **attributes: Additional message attributes

    Returns:
        Message ID
    """
    publisher = get_publisher()
    topic_path = publisher.topic_path(settings.gcp_project_id, topic_name)

    # Encode message as JSON
    message_bytes = json.dumps(data).encode("utf-8")

    # Publish message
    try:
        future = publisher.publish(topic_path, message_bytes, **attributes)
        message_id = future.result()
        logger.info(f"Published message {message_id} to {topic_name}")
        return message_id
    except Exception as e:
        logger.error(f"Failed to publish message to {topic_name}: {str(e)}")
        raise


async def publish_production_entry_created(entry_id: str, tenant_id: str, partner_id: str):
    """Publish production entry created event."""
    await publish_message(
        settings.pubsub_production_entry_topic,
        {
            "entry_id": entry_id,
            "tenant_id": tenant_id,
            "partner_id": partner_id,
            "event_type": "production_entry_created",
        },
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


async def publish_entry_flagged(entry_id: str, tenant_id: str, user_id: str, anomaly_score: float):
    """Publish entry flagged event."""
    await publish_message(
        settings.pubsub_entry_flagged_topic,
        {
            "entry_id": entry_id,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "anomaly_score": anomaly_score,
            "event_type": "entry_flagged",
        },
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
