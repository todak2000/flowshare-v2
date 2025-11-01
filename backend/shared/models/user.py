"""User models."""
from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    """User roles in the system."""

    COORDINATOR = "coordinator"
    PARTNER = "partner"
    FIELD_OPERATOR = "field_operator"
    AUDITOR = "auditor"


class NotificationSettings(BaseModel):
    """User notification preferences."""

    email_reports: bool = True
    email_anomaly_alerts: bool = True


class UserBase(BaseModel):
    """Base user fields."""

    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole = UserRole.PARTNER
    partner_id: Optional[str] = None
    notification_settings: NotificationSettings = Field(default_factory=NotificationSettings)


class UserCreate(UserBase):
    """User creation model."""

    firebase_uid: str
    tenant_ids: List[str] = Field(default_factory=list)


class UserUpdate(BaseModel):
    """User update model."""

    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    partner_id: Optional[str] = None
    notification_settings: Optional[NotificationSettings] = None


class User(UserBase):
    """User model with metadata."""

    id: str
    firebase_uid: str
    tenant_ids: List[str] = Field(default_factory=list)
    normalized_email: Optional[str] = None  # Normalized email for case-insensitive queries
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    organization: Optional[str] = None
    subscription_plan: Optional[str] = None  # Tenant's subscription plan

    class Config:
        from_attributes = True
