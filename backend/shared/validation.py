"""Input validation and sanitization utilities."""
import re
from typing import Optional
from pydantic import BaseModel, validator, Field


def normalize_email(email: str) -> str:
    """
    Normalize email address for case-insensitive matching.

    Args:
        email: Email address to normalize

    Returns:
        Normalized email (lowercased, stripped)
    """
    if not email:
        return email
    return email.lower().strip()


def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format.
    Accepts: +1234567890, (123) 456-7890, 123-456-7890, 1234567890

    Args:
        phone: Phone number to validate

    Returns:
        True if valid format
    """
    if not phone:
        return False

    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)

    # Check if we have 10-15 digits (international format)
    return 10 <= len(digits_only) <= 15


def sanitize_name(name: str) -> str:
    """
    Sanitize name input.

    Args:
        name: Name to sanitize

    Returns:
        Sanitized name
    """
    if not name:
        return name

    # Strip whitespace, limit to reasonable length
    sanitized = name.strip()

    # Remove any potentially dangerous characters but keep unicode letters
    # Allows letters, spaces, hyphens, apostrophes (for names like O'Brien, Mary-Jane)
    sanitized = re.sub(r'[^\w\s\-\'\u00C0-\u017F]', '', sanitized, flags=re.UNICODE)

    # Limit length to prevent abuse
    return sanitized[:100]


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.

    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"

    return True, None


class ValidatedRegisterRequest(BaseModel):
    """Validated registration request with sanitization."""

    full_name: str = Field(..., min_length=2, max_length=100)
    tenant_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=10)
    role: str = Field(default="coordinator")
    subscription_plan: str = Field(default="starter")
    payment_data: Optional[dict] = None

    @validator('full_name')
    def validate_full_name(cls, v):
        """Validate and sanitize full name."""
        sanitized = sanitize_name(v)
        if not sanitized or len(sanitized.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return sanitized

    @validator('tenant_name')
    def validate_tenant_name(cls, v):
        """Validate and sanitize tenant/organization name."""
        sanitized = sanitize_name(v)
        if not sanitized or len(sanitized.strip()) < 2:
            raise ValueError("Organization name must be at least 2 characters")
        return sanitized

    @validator('phone_number')
    def validate_phone(cls, v):
        """Validate phone number format."""
        if not validate_phone_number(v):
            raise ValueError(
                "Invalid phone number format. Please use format: +1234567890 or (123) 456-7890"
            )
        return v.strip()

    @validator('role')
    def validate_role(cls, v):
        """Validate role."""
        valid_roles = ['coordinator', 'partner', 'field_operator', 'auditor']
        if v not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        return v

    @validator('subscription_plan')
    def validate_subscription_plan(cls, v):
        """Validate subscription plan."""
        valid_plans = ['starter', 'professional', 'enterprise']
        if v not in valid_plans:
            raise ValueError(f"Invalid subscription plan. Must be one of: {', '.join(valid_plans)}")
        return v


class ValidatedInviteeRegisterRequest(BaseModel):
    """Validated invitee registration request with sanitization."""

    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=10)
    invitation_id: str

    @validator('full_name')
    def validate_full_name(cls, v):
        """Validate and sanitize full name."""
        sanitized = sanitize_name(v)
        if not sanitized or len(sanitized.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return sanitized

    @validator('phone_number')
    def validate_phone(cls, v):
        """Validate phone number format."""
        if not validate_phone_number(v):
            raise ValueError(
                "Invalid phone number format. Please use format: +1234567890 or (123) 456-7890"
            )
        return v.strip()
