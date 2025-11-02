"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Google Cloud Project
    gcp_project_id: str = "flowshare-v2"
    gcp_region: str = "europe-west1"

    # Firebase
    firebase_project_id: str = "flowshare-v2"
    firebase_private_key_id: str = ""
    firebase_private_key: str = ""
    firebase_client_email: str = ""
    firebase_client_id: str = ""

    # Pub/Sub Topics
    pubsub_production_entry_topic: str = "production-entry-created"
    publish_production_entry_edited: str = "publish_production_entry_edited"
    pubsub_entry_flagged_topic: str = "entry-flagged"
    pubsub_entry_edited_topic: str = "entry-edited"
    pubsub_reconciliation_trigger_topic: str = "reconciliation-triggered"
    pubsub_reconciliation_complete_topic: str = "reconciliation-complete"
    pubsub_invitation_created_topic: str = "invitation-created"

    # BigQuery
    bq_dataset: str = "flowshare_analytics"
    bq_production_table: str = "production_data"
    bq_reconciliation_table: str = "reconciliation_results"

    # Vertex AI
    vertex_ai_location: str = "europe-west1"
    vertex_ai_anomaly_endpoint: str = ""
    vertex_ai_forecast_endpoint: str = ""

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Agents
    auditor_agent_url: str = "http://localhost:8001"
    accountant_agent_url: str = "http://localhost:8002"
    communicator_agent_url: str = "http://localhost:8003"

    # Email (ZeptoMail)
    zepto_token: str = ""
    zepto_from_email: str = "noreply@futuxconsult.com"
    logo_url: str = "https://firebasestorage.googleapis.com/v0/b/back-allocation.firebasestorage.app/o/logo.webp?alt=media&token=a14f4e59-df8d-41bd-ae0c-3a1224c86033"

    # Frontend URL
    app_url: str = "http://localhost:3000"

    # Gemini AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash-exp"  # Main model for analysis
    gemini_flash_model: str = "gemini-2.5-flash"  # Fast model for chat

    # Security
    swagger_username: str = "admin"  # Change in production
    swagger_password: str = ""  # REQUIRED in production - set via environment variable
    demo_password: str = ""  # REQUIRED for demo endpoints - set via environment variable
    rate_limit_per_minute: int = 60  # Requests per minute per IP

    # Environment
    environment: str = "development"
    debug: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        # Look for .env file in the backend directory (parent of shared)
        env_file = str(Path(__file__).parent.parent / ".env")
        case_sensitive = False


# Global settings instance
settings = Settings()
