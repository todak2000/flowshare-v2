"""API Key models for SCADA integration."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class APIKeyEnvironment(str):
    """API Key environment types."""
    TEST = "test"
    PRODUCTION = "production"


class APIKeyCreate(BaseModel):
    """API Key creation model."""
    name: str = Field(..., description="Friendly name for the API key")
    description: Optional[str] = Field(None, description="Description of what this key is used for")
    environment: Literal["test", "production"] = Field(
        default="test",
        description="Environment for this API key (test or production)"
    )


class APIKey(BaseModel):
    """API Key model with metadata."""
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    key: str = Field(..., description="The actual API key (only shown once at creation)")
    key_prefix: str = Field(..., description="First 8 characters of the key for identification")
    environment: Literal["test", "production"] = Field(default="test")
    is_active: bool = True
    created_by: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class APIKeyInfo(BaseModel):
    """API Key info (without exposing the actual key)."""
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    key_prefix: str
    environment: Literal["test", "production"]
    is_active: bool
    created_by: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
