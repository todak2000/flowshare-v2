"""ZeptoMail email client."""
import httpx
import logging
from typing import Optional
from ..config import settings
from ..utils.circuit_breaker import async_retry, email_breaker, CircuitBreakerError

logger = logging.getLogger(__name__)

ZEPTO_API_URL = "https://api.zeptomail.com/v1.1/email"


@async_retry(
    max_attempts=3,
    initial_delay=1.0,
    max_delay=10.0,
    exceptions=(httpx.HTTPError, httpx.TimeoutException)
)
async def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_body: str,
    reply_to: Optional[str] = None,
    cc_emails: Optional[list[str]] = None,
) -> bool:
    """
    Send email using ZeptoMail API with retry logic and circuit breaker.

    Retries up to 3 times with exponential backoff for network errors.
    Circuit breaker opens after 5 consecutive failures.

    Args:
        to_email: Recipient email address
        to_name: Recipient name
        subject: Email subject
        html_body: HTML email body
        reply_to: Optional reply-to address
        cc_emails: Optional list of CC email addresses

    Returns:
        True if email sent successfully, False otherwise

    Raises:
        CircuitBreakerError: If email service circuit breaker is open
    """
    if not settings.zepto_token:
        logger.warning("ZeptoMail token not configured. Email not sent.")
        logger.info(f"[EMAIL PREVIEW] To: {to_email}, Subject: {subject}")
        logger.info(f"[EMAIL PREVIEW] Body:\n{html_body[:500]}...")
        return False

    try:
        async with email_breaker:
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": settings.zepto_token,
            }

            payload = {
                "from": {
                    "address": settings.zepto_from_email,
                    "name": "FlowShare V2"
                },
                "to": [
                    {
                        "email_address": {
                            "address": to_email,
                            "name": to_name
                        }
                    }
                ],
                "subject": subject,
                "htmlbody": html_body,
            }

            if reply_to:
                payload["reply_to"] = [{"address": reply_to}]

            if cc_emails:
                payload["cc"] = [
                    {"email_address": {"address": cc_email}}
                    for cc_email in cc_emails
                    if cc_email  # Filter out None or empty strings
                ]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    ZEPTO_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=30.0,
                )

                if response.status_code == 201:
                    logger.info(f"Email sent successfully to {to_email}")
                    return True
                else:
                    logger.error(
                        f"Failed to send email to {to_email}. "
                        f"Status: {response.status_code}, Response: {response.text}"
                    )
                    # Raise to trigger retry
                    raise httpx.HTTPStatusError(
                        f"Email send failed with status {response.status_code}",
                        request=response.request,
                        response=response
                    )

    except CircuitBreakerError as e:
        logger.error(f"Email circuit breaker open: {e}")
        return False
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {str(e)}")
        raise  # Let retry decorator handle it
