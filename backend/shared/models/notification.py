"""Notification models."""
from pydantic import BaseModel


class NotificationSettings(BaseModel):
    """User notification preferences."""

    email_reports: bool = True
    email_anomaly_alerts: bool = True
