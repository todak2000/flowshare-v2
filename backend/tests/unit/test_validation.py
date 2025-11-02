"""
Unit tests for validation utilities.

Tests cover:
- Email normalization
- Phone number validation
- Name sanitization
- Password strength validation
- Validated request models
"""

import pytest
from pydantic import ValidationError

from shared.validation import (
    normalize_email,
    validate_phone_number,
    sanitize_name,
    validate_password_strength,
    ValidatedRegisterRequest,
    ValidatedInviteeRegisterRequest,
)


@pytest.mark.unit
class TestNormalizeEmail:
    """Test normalize_email function."""

    def test_normalize_email_lowercase(self):
        """Test that email is lowercased."""
        assert normalize_email("TEST@EXAMPLE.COM") == "test@example.com"

    def test_normalize_email_strips_whitespace(self):
        """Test that whitespace is stripped."""
        assert normalize_email("  test@example.com  ") == "test@example.com"

    def test_normalize_email_mixed_case(self):
        """Test mixed case email."""
        assert normalize_email("Test.User@Example.COM") == "test.user@example.com"

    def test_normalize_email_empty(self):
        """Test empty email."""
        assert normalize_email("") == ""

    def test_normalize_email_none(self):
        """Test None email."""
        assert normalize_email(None) is None


@pytest.mark.unit
class TestValidatePhoneNumber:
    """Test validate_phone_number function."""

    def test_validate_phone_number_valid_formats(self):
        """Test various valid phone number formats."""
        valid_numbers = [
            "+1234567890",
            "(123) 456-7890",
            "123-456-7890",
            "1234567890",
            "+44 20 1234 5678",
            "123.456.7890",
        ]
        for number in valid_numbers:
            assert validate_phone_number(number), f"Failed for {number}"

    def test_validate_phone_number_invalid_formats(self):
        """Test invalid phone number formats."""
        invalid_numbers = [
            "",
            "123",  # Too short
            "abc",
            "12345",  # Too short
            "123456789012345678",  # Too long
        ]
        for number in invalid_numbers:
            assert not validate_phone_number(number), f"Should fail for {number}"

    def test_validate_phone_number_none(self):
        """Test None phone number."""
        assert not validate_phone_number(None)


@pytest.mark.unit
class TestSanitizeName:
    """Test sanitize_name function."""

    def test_sanitize_name_basic(self):
        """Test basic name sanitization."""
        assert sanitize_name("John Doe") == "John Doe"

    def test_sanitize_name_strips_whitespace(self):
        """Test that whitespace is stripped."""
        assert sanitize_name("  John Doe  ") == "John Doe"

    def test_sanitize_name_hyphenated(self):
        """Test hyphenated names."""
        assert sanitize_name("Mary-Jane") == "Mary-Jane"

    def test_sanitize_name_apostrophe(self):
        """Test names with apostrophes."""
        assert sanitize_name("O'Brien") == "O'Brien"

    def test_sanitize_name_removes_dangerous_chars(self):
        """Test that dangerous characters are removed."""
        # Angle brackets and parentheses removed, but apostrophes preserved
        result = sanitize_name("John<script>alert('xss')</script>Doe")
        assert "<" not in result
        assert ">" not in result
        assert "John" in result
        assert "Doe" in result

    def test_sanitize_name_limits_length(self):
        """Test that name is limited to 100 characters."""
        long_name = "A" * 150
        assert len(sanitize_name(long_name)) == 100

    def test_sanitize_name_unicode(self):
        """Test unicode characters in names."""
        assert sanitize_name("José García") == "José García"

    def test_sanitize_name_empty(self):
        """Test empty name."""
        assert sanitize_name("") == ""


@pytest.mark.unit
class TestValidatePasswordStrength:
    """Test validate_password_strength function."""

    def test_validate_password_strong(self):
        """Test strong password."""
        valid, error = validate_password_strength("StrongP@ssw0rd")
        assert valid is True
        assert error is None

    def test_validate_password_too_short(self):
        """Test password too short."""
        valid, error = validate_password_strength("Short1!")
        assert valid is False
        assert "8 characters" in error

    def test_validate_password_no_uppercase(self):
        """Test password without uppercase."""
        valid, error = validate_password_strength("password123!")
        assert valid is False
        assert "uppercase" in error

    def test_validate_password_no_lowercase(self):
        """Test password without lowercase."""
        valid, error = validate_password_strength("PASSWORD123!")
        assert valid is False
        assert "lowercase" in error

    def test_validate_password_no_number(self):
        """Test password without number."""
        valid, error = validate_password_strength("Password!@#")
        assert valid is False
        assert "number" in error

    def test_validate_password_no_special(self):
        """Test password without special character."""
        valid, error = validate_password_strength("Password123")
        assert valid is False
        assert "special character" in error


@pytest.mark.unit
class TestValidatedRegisterRequest:
    """Test ValidatedRegisterRequest model."""

    def test_validated_register_request_valid(self):
        """Test valid registration request."""
        data = {
            "full_name": "John Doe",
            "tenant_name": "Acme Corp",
            "phone_number": "+1234567890",
            "role": "coordinator",
            "subscription_plan": "professional",
        }
        request = ValidatedRegisterRequest(**data)
        assert request.full_name == "John Doe"
        assert request.tenant_name == "Acme Corp"

    def test_validated_register_request_sanitizes_name(self):
        """Test that names are sanitized."""
        data = {
            "full_name": "  John Doe  ",
            "tenant_name": "Acme<script>Corp",
            "phone_number": "+1234567890",
        }
        request = ValidatedRegisterRequest(**data)
        assert request.full_name == "John Doe"
        # Check that angle brackets are removed
        assert "<" not in request.tenant_name
        assert ">" not in request.tenant_name

    def test_validated_register_request_invalid_phone(self):
        """Test invalid phone number."""
        data = {
            "full_name": "John Doe",
            "tenant_name": "Acme Corp",
            "phone_number": "123",  # Too short
        }
        with pytest.raises(ValidationError) as exc_info:
            ValidatedRegisterRequest(**data)
        assert "phone" in str(exc_info.value).lower()

    def test_validated_register_request_invalid_role(self):
        """Test invalid role."""
        data = {
            "full_name": "John Doe",
            "tenant_name": "Acme Corp",
            "phone_number": "+1234567890",
            "role": "invalid_role",
        }
        with pytest.raises(ValidationError) as exc_info:
            ValidatedRegisterRequest(**data)
        assert "role" in str(exc_info.value).lower()

    def test_validated_register_request_invalid_plan(self):
        """Test invalid subscription plan."""
        data = {
            "full_name": "John Doe",
            "tenant_name": "Acme Corp",
            "phone_number": "+1234567890",
            "subscription_plan": "invalid_plan",
        }
        with pytest.raises(ValidationError) as exc_info:
            ValidatedRegisterRequest(**data)
        assert "subscription" in str(exc_info.value).lower()

    def test_validated_register_request_name_too_short(self):
        """Test name too short."""
        data = {
            "full_name": "A",
            "tenant_name": "Acme Corp",
            "phone_number": "+1234567890",
        }
        with pytest.raises(ValidationError):
            ValidatedRegisterRequest(**data)


@pytest.mark.unit
class TestValidatedInviteeRegisterRequest:
    """Test ValidatedInviteeRegisterRequest model."""

    def test_validated_invitee_request_valid(self):
        """Test valid invitee registration request."""
        data = {
            "full_name": "Jane Smith",
            "phone_number": "+1987654321",
            "invitation_id": "invite_123",
        }
        request = ValidatedInviteeRegisterRequest(**data)
        assert request.full_name == "Jane Smith"
        assert request.invitation_id == "invite_123"

    def test_validated_invitee_request_sanitizes_name(self):
        """Test that name is sanitized."""
        data = {
            "full_name": "  Jane Smith  ",
            "phone_number": "+1987654321",
            "invitation_id": "invite_123",
        }
        request = ValidatedInviteeRegisterRequest(**data)
        assert request.full_name == "Jane Smith"

    def test_validated_invitee_request_invalid_phone(self):
        """Test invalid phone number."""
        data = {
            "full_name": "Jane Smith",
            "phone_number": "abc",
            "invitation_id": "invite_123",
        }
        with pytest.raises(ValidationError):
            ValidatedInviteeRegisterRequest(**data)

    def test_validated_invitee_request_missing_invitation_id(self):
        """Test missing invitation ID."""
        data = {
            "full_name": "Jane Smith",
            "phone_number": "+1987654321",
        }
        with pytest.raises(ValidationError):
            ValidatedInviteeRegisterRequest(**data)
