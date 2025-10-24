"""Production entry models."""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ProductionEntryStatus(str, Enum):
    """Production entry validation status."""

    PENDING = "pending"
    VALIDATED = "validated"
    FLAGGED = "flagged"


class ProductionEntryBase(BaseModel):
    """Base production entry fields."""

    partner_id: str
    measurement_date: datetime
    gross_volume: float = Field(gt=0, description="Gross volume in barrels")
    bsw_percent: float = Field(ge=0, le=100, description="Basic Sediment and Water %")
    temperature: float = Field(gt=0, description="Temperature in °F")
    api_gravity: float = Field(gt=0, description="API Gravity")
    pressure: Optional[float] = Field(None, gt=0, description="Pressure in psia")
    meter_factor: float = Field(default=1.0, description="Meter correction factor")


class ProductionEntryCreate(ProductionEntryBase):
    """Production entry creation model."""

    tenant_id: str
    submitted_by: str


class ProductionEntry(ProductionEntryBase):
    """Production entry model with metadata."""

    id: str
    tenant_id: str
    submitted_by: str
    status: ProductionEntryStatus = ProductionEntryStatus.PENDING
    validation_notes: Optional[str] = None
    anomaly_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
