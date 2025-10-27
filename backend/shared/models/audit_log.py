"""Audit log model."""
from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class AuditAction(str, Enum):
    """Audit action types."""

    # Production
    PRODUCTION_ENTRY_CREATED = "production_entry_created"
    PRODUCTION_ENTRY_UPDATED = "production_entry_updated"
    PRODUCTION_ENTRY_DELETED = "production_entry_deleted"
    PRODUCTION_ENTRY_APPROVED = "production_entry_approved"
    PRODUCTION_ENTRY_FLAGGED = "production_entry_flagged"

    # Reconciliation
    RECONCILIATION_CREATED = "reconciliation_created"
    RECONCILIATION_APPROVED = "reconciliation_approved"
    RECONCILIATION_REJECTED = "reconciliation_rejected"

    # User Management
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_INVITED = "user_invited"

    # Tenant Management
    TENANT_CREATED = "tenant_created"
    TENANT_UPDATED = "tenant_updated"

    # Settings
    SETTINGS_UPDATED = "settings_updated"

    # Data Export
    DATA_EXPORTED = "data_exported"

    # Other
    OTHER = "other"


class AuditLogEntry(BaseModel):
    """Audit log entry model."""

    id: Optional[str] = None
    tenant_id: str
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    action: AuditAction
    resource_type: str  # e.g., "production_entry", "reconciliation", "user"
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        use_enum_values = True
