"""Terminal receipt models."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TerminalReceiptBase(BaseModel):
    """Base terminal receipt fields."""

    receipt_date: datetime
    terminal_volume: float = Field(gt=0, description="Terminal volume received in barrels")
    terminal_name: Optional[str] = None
    operator_name: Optional[str] = None
    notes: Optional[str] = None


class TerminalReceiptCreate(TerminalReceiptBase):
    """Terminal receipt creation model."""

    tenant_id: str


class TerminalReceipt(TerminalReceiptBase):
    """Terminal receipt model with metadata."""

    id: str
    tenant_id: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
