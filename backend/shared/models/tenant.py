"""Tenant models."""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class AllocationModel(str, Enum):
    """Available allocation calculation models."""

    API_MPMS_11_1 = "api_mpms_11_1"  # Default: API MPMS 11.1
    MODEL_B = "model_b"  # Future model
    MODEL_C = "model_c"  # Future model


class SubscriptionPlan(str, Enum):
    """Subscription tiers."""

    FREE = "free"
    STANDARD = "standard"
    ENTERPRISE = "enterprise"


class TenantSettings(BaseModel):
    """Tenant configuration settings."""

    allocation_model: AllocationModel = AllocationModel.API_MPMS_11_1
    default_temperature_standard: float = 60.0  # °F
    default_pressure_standard: float = 14.696  # psia


class TenantBase(BaseModel):
    """Base tenant fields."""

    name: str
    subscription_plan: SubscriptionPlan = SubscriptionPlan.STANDARD


class TenantCreate(TenantBase):
    """Tenant creation model."""

    owner_id: str


class TenantUpdate(BaseModel):
    """Tenant update model."""

    name: Optional[str] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    settings: Optional[TenantSettings] = None


class Tenant(TenantBase):
    """Tenant model with metadata."""

    id: str
    owner_id: str
    settings: TenantSettings = Field(default_factory=TenantSettings)
    status: str = "active"  # active, suspended, cancelled
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
