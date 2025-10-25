"""Invitation models."""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr
from .user import UserRole, NotificationSettings


class InvitationStatus(str, Enum):
    """Invitation status."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class InvitationBase(BaseModel):
    """Base invitation fields."""

    email: EmailStr
    partner_name: Optional[str] = None
    role: UserRole
    partner_id: Optional[str] = None
    notification_settings: NotificationSettings = NotificationSettings()


class InvitationCreate(InvitationBase):
    """Invitation creation model."""

    tenant_id: str
    # invited_by: str


class Invitation(InvitationBase):
    """Invitation model with metadata."""

    id: str
    tenant_id: str
    invited_by: str
    status: InvitationStatus = InvitationStatus.PENDING
    created_at: datetime
    updated_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True
