"""Circuit breaker and retry utilities for resilient service calls."""
import asyncio
import logging
import time
from enum import Enum
from typing import Callable, Any, Optional, Type
from functools import wraps
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Blocking requests due to failures
    HALF_OPEN = "half_open"  # Testing if service has recovered


class CircuitBreakerError(Exception):
    """Raised when circuit breaker is open."""
    pass


class CircuitBreaker:
    """
    Circuit breaker pattern implementation.

    Prevents cascading failures by monitoring error rates and temporarily
    blocking requests when a service is failing.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Too many failures, requests are blocked
    - HALF_OPEN: Testing if service has recovered

    Example:
        breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60,
            expected_exception=Exception
        )

        async def call_service():
            async with breaker:
                return await external_service_call()
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: Type[Exception] = Exception,
        name: str = "CircuitBreaker"
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds before attempting to close circuit
            expected_exception: Exception type to count as failures
            name: Name for logging purposes
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.name = name

        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED

    async def __aenter__(self):
        """Context manager entry."""
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            if self.last_failure_time and \
               datetime.now() - self.last_failure_time > timedelta(seconds=self.recovery_timeout):
                logger.info(f"{self.name}: Attempting recovery (HALF_OPEN)")
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerError(
                    f"{self.name}: Circuit breaker is OPEN. "
                    f"Service unavailable due to repeated failures."
                )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        if exc_type is None:
            # Success
            self.on_success()
            return False

        if issubclass(exc_type, self.expected_exception):
            # Expected failure
            self.on_failure()
            return False  # Re-raise exception

        # Unexpected exception, don't count as failure
        return False

    def on_success(self):
        """Handle successful call."""
        if self.state == CircuitState.HALF_OPEN:
            logger.info(f"{self.name}: Service recovered, closing circuit")
            self.state = CircuitState.CLOSED

        self.failure_count = 0
        self.last_failure_time = None

    def on_failure(self):
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.failure_threshold:
            if self.state != CircuitState.OPEN:
                logger.error(
                    f"{self.name}: Opening circuit after {self.failure_count} failures"
                )
                self.state = CircuitState.OPEN
        else:
            logger.warning(
                f"{self.name}: Failure {self.failure_count}/{self.failure_threshold}"
            )

    def reset(self):
        """Manually reset circuit breaker."""
        logger.info(f"{self.name}: Manual reset")
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None


def async_retry(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    exceptions: tuple = (Exception,),
):
    """
    Decorator for retrying async functions with exponential backoff.

    Args:
        max_attempts: Maximum number of retry attempts
        initial_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exponential_base: Base for exponential backoff calculation
        exceptions: Tuple of exceptions to catch and retry

    Example:
        @async_retry(max_attempts=3, initial_delay=1.0)
        async def fetch_data():
            return await api_call()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__}: All {max_attempts} attempts failed. "
                            f"Last error: {str(e)}"
                        )
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(
                        initial_delay * (exponential_base ** (attempt - 1)),
                        max_delay
                    )

                    logger.warning(
                        f"{func.__name__}: Attempt {attempt}/{max_attempts} failed. "
                        f"Retrying in {delay:.2f}s... Error: {str(e)}"
                    )

                    await asyncio.sleep(delay)

            # This should never be reached, but just in case
            if last_exception:
                raise last_exception

        return wrapper
    return decorator


def sync_retry(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    exceptions: tuple = (Exception,),
):
    """
    Decorator for retrying synchronous functions with exponential backoff.

    Args:
        max_attempts: Maximum number of retry attempts
        initial_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exponential_base: Base for exponential backoff calculation
        exceptions: Tuple of exceptions to catch and retry

    Example:
        @sync_retry(max_attempts=3, initial_delay=1.0)
        def fetch_data():
            return api_call()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__}: All {max_attempts} attempts failed. "
                            f"Last error: {str(e)}"
                        )
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(
                        initial_delay * (exponential_base ** (attempt - 1)),
                        max_delay
                    )

                    logger.warning(
                        f"{func.__name__}: Attempt {attempt}/{max_attempts} failed. "
                        f"Retrying in {delay:.2f}s... Error: {str(e)}"
                    )

                    time.sleep(delay)

            # This should never be reached, but just in case
            if last_exception:
                raise last_exception

        return wrapper
    return decorator


# Global circuit breakers for shared services
firestore_breaker = CircuitBreaker(
    failure_threshold=10,
    recovery_timeout=30,
    name="Firestore"
)

gemini_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60,
    name="Gemini"
)

pubsub_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=30,
    name="PubSub"
)

email_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60,
    name="Email"
)
