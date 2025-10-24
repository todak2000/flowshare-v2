"""Reconciliation models."""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ReconciliationStatus(str, Enum):
    """Reconciliation processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PartnerAllocation(BaseModel):
    """Allocation result for a single partner."""

    partner_id: str
    partner_name: str
    gross_volume: float
    bsw_percent: float
    water_cut_factor: float
    net_volume_observed: float
    temperature_correction_factor: float
    api_correction_factor: float
    net_volume_standard: float
    ownership_percent: float
    allocated_volume: float
    intermediate_calculations: Dict[str, Any] = Field(default_factory=dict)


class ReconciliationBase(BaseModel):
    """Base reconciliation fields."""

    period_start: datetime
    period_end: datetime
    terminal_volume: float = Field(gt=0, description="Final terminal volume in barrels")


class ReconciliationCreate(ReconciliationBase):
    """Reconciliation creation model."""

    tenant_id: str
    triggered_by: str


class ReconciliationResult(BaseModel):
    """Detailed reconciliation results."""

    total_gross_volume: float
    total_net_volume_standard: float
    total_allocated_volume: float
    shrinkage_volume: float
    shrinkage_percent: float
    partner_allocations: List[PartnerAllocation]
    allocation_model_used: str


class Reconciliation(ReconciliationBase):
    """Reconciliation model with metadata."""

    id: str
    tenant_id: str
    triggered_by: str
    status: ReconciliationStatus = ReconciliationStatus.PENDING
    result: Optional[ReconciliationResult] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
