"""Audit logger utility for tracking user activities."""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from shared.database import get_firestore, FirestoreCollections
from shared.models.audit_log import AuditAction
import logging

logger = logging.getLogger(__name__)


async def log_audit_event(
    tenant_id: str,
    user_id: str,
    action: AuditAction,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> str:
    """
    Log an audit event to Firestore.

    Args:
        tenant_id: Tenant ID
        user_id: User ID who performed the action
        action: Action performed (AuditAction enum)
        resource_type: Type of resource affected
        resource_id: ID of the resource affected
        user_email: User email (optional)
        user_name: User full name (optional)
        details: Additional details about the action
        ip_address: IP address of the request
        user_agent: User agent of the request

    Returns:
        Audit log entry ID
    """
    try:
        db = get_firestore()
        audit_ref = db.collection(FirestoreCollections.AUDIT_LOGS)

        audit_data = {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_name,
            "action": action.value if isinstance(action, AuditAction) else action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.now(timezone.utc),
        }

        # Add the document
        doc_ref = await audit_ref.add(audit_data)
        logger.info(f"Audit log created: {action.value} by user {user_id}")
        return doc_ref[1].id

    except Exception as e:
        logger.error(f"Failed to log audit event: {e}")
        # Don't fail the main operation if audit logging fails
        return ""
