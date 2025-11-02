# FlowShare V2 Email System

## Overview

FlowShare V2 uses **ZeptoMail** for transactional email delivery with a modular template system featuring reusable header/footer layouts.

## Architecture

```
Email System
├── zepto_client.py       # ZeptoMail API integration
└── templates.py          # Email templates with header/footer wrapper
```

## Template Structure

### Master Layout

All emails use a consistent header and footer defined in `_wrap_in_layout()`:

**Header:**
- Company logo (from `LOGO_URL` env variable)
- Blue gradient background
- Branded header section

**Footer:**
- FlowShare V2 branding
- Help links
- Unsubscribe notice
- Copyright

### Sub-Templates

Individual email templates focus only on content, which is automatically wrapped:

1. **Anomaly Alert Email** - `render_anomaly_alert_email()`
2. **Reconciliation Complete Email** - `render_reconciliation_complete_email()`
3. **Invitation Email** - `render_invitation_email()`

## Usage

### Sending an Email

```python
from shared.email import send_email, render_anomaly_alert_email

# Render email with template
html_body = render_anomaly_alert_email(
    user_name="John Doe",
    entry_id="entry-123",
    partner_id="PARTNER_001",
    gross_volume=1000.0,
    anomaly_score=0.85,
)

# Send via ZeptoMail
await send_email(
    to_email="user@example.com",
    to_name="John Doe",
    subject="⚠️ Anomaly Detected",
    html_body=html_body,
)
```

### Creating a New Email Template

```python
def render_new_email_type(param1: str, param2: int) -> str:
    """
    Render new email type (without header/footer).

    Args:
        param1: Description
        param2: Description

    Returns:
        Complete HTML email
    """
    body = f"""
        <h1>Email Title</h1>

        <p>Hello <strong>{param1}</strong>,</p>

        <p>Your content here with {param2}...</p>

        <a href="https://flowshare-v2.web.app/action" class="button">
            Call to Action
        </a>
    """

    # Wrap in master layout
    return _wrap_in_layout(body)
```

## Available CSS Classes

Use these pre-defined classes in your email templates:

### Layout
- `.button` - Primary action button
- `.divider` - Horizontal separator line

### Alerts
- `.alert-box` - Warning/alert box (yellow)
- `.success-box` - Success notification box (green)

### Tables
- `.data-table` - Styled data table with headers

### Typography
- `<h1>` - Main heading (24px)
- `<h2>` - Section heading (18px)
- `<p>` - Body text

## Environment Variables

Required in `.env`:

```bash
# ZeptoMail Configuration
ZEPTO_TOKEN=Zoho-enczapikey YOUR_API_KEY_HERE
ZEPTO_FROM_EMAIL=noreply@yourcompany.com

# Branding
LOGO_URL=https://your-cdn.com/logo.png
```

## Testing Emails

### Local Testing (Logs Only)

Without `ZEPTO_TOKEN` configured, emails are logged to console:

```bash
docker logs flowshare-communicator | grep "EMAIL PREVIEW"
```

### Production Testing

With valid `ZEPTO_TOKEN`, emails are sent via ZeptoMail API.

### Visual Testing

1. Copy HTML from logs
2. Save as `.html` file
3. Open in browser to verify formatting

## Email Notification Settings

Users can control which emails they receive via notification settings:

```python
notification_settings = {
    "email_reports": True,           # Reconciliation complete emails
    "email_anomaly_alerts": False,   # Anomaly detection alerts
}
```

The Communicator Agent respects these settings before sending any email.

## Best Practices

1. **Keep Templates Simple** - Focus on content, layout is handled
2. **Use Semantic HTML** - Tables for data, divs for layout
3. **Test Responsively** - Emails should work on mobile
4. **Respect User Preferences** - Always check notification settings
5. **Include Clear CTAs** - Every email should have a purpose

## Troubleshooting

### Emails Not Sending

```bash
# Check ZeptoMail token is set
echo $ZEPTO_TOKEN

# Check Communicator logs
docker logs flowshare-communicator

# Verify user has notifications enabled
# Check notification_settings in user document
```

### Email Formatting Issues

- Ensure logo URL is publicly accessible
- Test HTML in multiple email clients
- Use inline CSS for best compatibility
- Avoid complex layouts

### Missing Emails

- Verify event was published to Pub/Sub
- Check Communicator Agent is subscribed
- Verify user's notification settings
- Check email didn't go to spam

## Examples

See `templates.py` for complete examples of:
- Anomaly alert with data table
- Reconciliation report (coordinator vs partner views)
- Team invitation with call-to-action

---

**Need to add a new email template?** Follow the pattern in `templates.py` and ensure it uses `_wrap_in_layout()` for consistency.
