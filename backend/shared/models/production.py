"""Production entry models."""
from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ProductionEntryStatus(str, Enum):
    """Production entry validation status."""

    PENDING = "pending"  # Waiting for AI validation
    APPROVED = "approved"  # AI validated, no anomalies
    FLAGGED = "flagged"  # AI detected anomalies
    PENDING_APPROVAL = "pending_approval"  # Edited by coordinator, awaiting partner approval
    REJECTED = "rejected"  # Rejected by partner or coordinator


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


class ProductionEntryUpdate(BaseModel):
    """Production entry update model."""

    measurement_date: Optional[datetime] = None
    gross_volume: Optional[float] = Field(None, gt=0)
    bsw_percent: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = Field(None, gt=0)
    api_gravity: Optional[float] = Field(None, gt=0)
    pressure: Optional[float] = Field(None, gt=0)
    meter_factor: Optional[float] = None
    status: Optional[ProductionEntryStatus] = None
    validation_notes: Optional[str] = None
    edit_reason: Optional[str] = None  # Reason for edit (required for coordinator edits)


class ProductionEntry(ProductionEntryBase):
    """Production entry model with metadata."""

    id: str
    tenant_id: str
    submitted_by: str
    status: ProductionEntryStatus = ProductionEntryStatus.PENDING
    validation_notes: Optional[str] = None
    anomaly_score: Optional[float] = None
    ai_analysis: Optional[str] = None  # AI-generated analysis for flagged entries (HTML format)
    created_at: datetime
    updated_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    edited_by: Optional[str] = None  # User who edited the entry
    edited_at: Optional[datetime] = None
    edit_reason: Optional[str] = None  # Reason for edit

    class Config:
        from_attributes = True


class ProductionStats(BaseModel):
    """Production statistics for a partner."""

    partner_id: str
    partner_name: str
    total_volume: float
    percentage: float
    entry_count: int
