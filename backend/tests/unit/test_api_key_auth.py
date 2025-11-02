"""
Unit tests for API key authentication module.

Tests cover:
- API key generation
- API key hashing
- API key verification
- API key expiration
- API key deactivation
"""

import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

from shared.auth.api_key_auth import (
    generate_api_key,
    hash_api_key,
    verify_api_key,
    get_tenant_from_api_key,
)


@pytest.mark.unit
class TestGenerateAPIKey:
    """Test generate_api_key function."""

    def test_generate_api_key_returns_string(self):
        """Test that generate_api_key returns a string."""
        api_key = generate_api_key()
        assert isinstance(api_key, str)

    def test_generate_api_key_has_sufficient_length(self):
        """Test that generated API key has sufficient length."""
        api_key = generate_api_key()
        # Should be approximately 64 characters
        assert len(api_key) >= 60

    def test_generate_api_key_is_unique(self):
        """Test that each generated API key is unique."""
        keys = [generate_api_key() for _ in range(100)]
        # All keys should be unique
        assert len(keys) == len(set(keys))


@pytest.mark.unit
class TestHashAPIKey:
    """Test hash_api_key function."""

    def test_hash_api_key_returns_hash(self):
        """Test that hash_api_key returns a hash string."""
        api_key = "test_api_key_123"
        hashed = hash_api_key(api_key)
        assert isinstance(hashed, str)
        assert len(hashed) == 64  # SHA256 produces 64 hex characters

    def test_hash_api_key_is_deterministic(self):
        """Test that hashing the same key produces the same hash."""
        api_key = "test_api_key_123"
        hash1 = hash_api_key(api_key)
        hash2 = hash_api_key(api_key)
        assert hash1 == hash2

    def test_hash_api_key_different_keys_produce_different_hashes(self):
        """Test that different keys produce different hashes."""
        hash1 = hash_api_key("key1")
        hash2 = hash_api_key("key2")
        assert hash1 != hash2


@pytest.mark.unit
class TestVerifyAPIKey:
    """Test verify_api_key function."""

    @pytest.mark.asyncio
    async def test_verify_api_key_success(self, mock_firestore_get):
        """Test successful API key verification."""
        with patch('shared.auth.api_key_auth._get_db') as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            # Mock API key exists and is active
            api_key = "test_api_key_123"
            key_hash = hash_api_key(api_key)

            mock_key_doc = Mock()
            mock_key_doc.id = "key_123"
            mock_key_doc.to_dict.return_value = {
                "tenant_id": "tenant_123",
                "key_hash": key_hash,
                "is_active": True,
                "name": "Test Key",
                "environment": "production",
                "expires_at": None,
            }
            mock_key_doc.reference = Mock()
            mock_key_doc.reference.update = AsyncMock()

            mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.get = AsyncMock(
                return_value=[mock_key_doc]
            )

            result = await verify_api_key(api_key)

            assert result["tenant_id"] == "tenant_123"
            assert result["api_key_id"] == "key_123"
            assert result["key_name"] == "Test Key"
            assert result["environment"] == "production"

            # Verify last_used_at was updated
            mock_key_doc.reference.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_verify_api_key_missing(self):
        """Test API key verification with missing key."""
        with pytest.raises(HTTPException) as exc_info:
            await verify_api_key(None)

        assert exc_info.value.status_code == 401
        assert "Missing API key" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_verify_api_key_invalid(self):
        """Test API key verification with invalid key."""
        with patch('shared.auth.api_key_auth._get_db') as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            # Mock no key found
            mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.get = AsyncMock(
                return_value=[]
            )

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key("invalid_key")

            assert exc_info.value.status_code == 401
            assert "Invalid API key" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_verify_api_key_inactive(self):
        """Test API key verification with inactive key."""
        with patch('shared.auth.api_key_auth._get_db') as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            # Mock inactive key (query returns empty because is_active=True filter)
            mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.get = AsyncMock(
                return_value=[]
            )

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key("inactive_key")

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_verify_api_key_expired(self):
        """Test API key verification with expired key."""
        with patch('shared.auth.api_key_auth._get_db') as mock_get_db:
            mock_db = MagicMock()
            mock_get_db.return_value = mock_db

            # Mock API key that has expired
            api_key = "test_api_key_123"
            key_hash = hash_api_key(api_key)

            mock_key_doc = Mock()
            mock_key_doc.id = "key_123"
            mock_key_doc.to_dict.return_value = {
                "tenant_id": "tenant_123",
                "key_hash": key_hash,
                "is_active": True,
                "name": "Test Key",
                "environment": "production",
                "expires_at": datetime.now(timezone.utc) - timedelta(days=1),  # Expired yesterday
            }

            mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.get = AsyncMock(
                return_value=[mock_key_doc]
            )

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key)

            assert exc_info.value.status_code == 401
            assert "expired" in exc_info.value.detail.lower()


@pytest.mark.unit
class TestGetTenantFromAPIKey:
    """Test get_tenant_from_api_key function."""

    @pytest.mark.asyncio
    async def test_get_tenant_from_api_key(self):
        """Test extracting tenant from API key info."""
        api_key_info = {
            "tenant_id": "tenant_123",
            "api_key_id": "key_123",
            "key_name": "Test Key",
            "environment": "production",
        }

        result = await get_tenant_from_api_key(api_key_info)

        assert result == api_key_info
        assert result["tenant_id"] == "tenant_123"
