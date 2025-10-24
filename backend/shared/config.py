"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Google Cloud Project
    gcp_project_id: str = "flowshare-v2"
    gcp_region: str = "us-central1"

    # Firebase
    firebase_project_id: str = "flowshare-v2"
    firebase_private_key_id: str = ""
    firebase_private_key: str = ""
    firebase_client_email: str = ""
    firebase_client_id: str = ""

    # Pub/Sub Topics
    pubsub_production_entry_topic: str = "production-entry-created"
    pubsub_entry_flagged_topic: str = "entry-flagged"
    pubsub_reconciliation_trigger_topic: str = "reconciliation-triggered"
    pubsub_reconciliation_complete_topic: str = "reconciliation-complete"

    # BigQuery
    bq_dataset: str = "flowshare_analytics"
    bq_production_table: str = "production_data"
    bq_reconciliation_table: str = "reconciliation_results"

    # Vertex AI
    vertex_ai_location: str = "us-central1"
    vertex_ai_anomaly_endpoint: str = ""
    vertex_ai_forecast_endpoint: str = ""

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Agents
    auditor_agent_url: str = "http://auditor:8001"
    accountant_agent_url: str = "http://accountant:8002"
    communicator_agent_url: str = "http://communicator:8003"

    # Email (ZeptoMail)
    zepto_token: str = ""
    zepto_from_email: str = "noreply@flowshare.io"
    logo_url: str = ""

    # Environment
    environment: str = "development"
    debug: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
