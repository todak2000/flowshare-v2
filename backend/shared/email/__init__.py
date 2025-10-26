"""Email utilities and templates."""
from .zepto_client import send_email
from .templates import (
    render_anomaly_alert_email,
    render_reconciliation_complete_email,
    render_invitation_email,
    render_entry_edited_email,
)

__all__ = [
    "send_email",
    "render_anomaly_alert_email",
    "render_reconciliation_complete_email",
    "render_invitation_email",
    "render_entry_edited_email",
]
