"""Simple in-memory cache with TTL for performance optimization."""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
import threading


class TTLCache:
    """Thread-safe in-memory cache with time-to-live (TTL) expiration."""

    def __init__(self, default_ttl_seconds: int = 300):
        """
        Initialize cache.

        Args:
            default_ttl_seconds: Default time-to-live in seconds (default: 5 minutes)
        """
        self.default_ttl_seconds = default_ttl_seconds
        self._cache: Dict[str, Tuple[Any, datetime]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache if not expired.

        Args:
            key: Cache key

        Returns:
            Cached value if found and not expired, None otherwise
        """
        with self._lock:
            if key not in self._cache:
                return None

            value, expiry = self._cache[key]

            # Check if expired
            if datetime.utcnow() > expiry:
                del self._cache[key]
                return None

            return value

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """
        Set value in cache with TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: Time-to-live in seconds (uses default if not specified)
        """
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        expiry = datetime.utcnow() + timedelta(seconds=ttl)

        with self._lock:
            self._cache[key] = (value, expiry)

    def delete(self, key: str):
        """
        Delete value from cache.

        Args:
            key: Cache key
        """
        with self._lock:
            self._cache.pop(key, None)

    def clear(self):
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()

    def cleanup_expired(self):
        """Remove all expired entries from cache."""
        now = datetime.utcnow()
        with self._lock:
            expired_keys = [
                key for key, (_, expiry) in self._cache.items()
                if now > expiry
            ]
            for key in expired_keys:
                del self._cache[key]


# Global cache instances
user_cache = TTLCache(default_ttl_seconds=300)  # 5 minutes TTL for user data
query_cache = TTLCache(default_ttl_seconds=60)  # 1 minute TTL for query results
