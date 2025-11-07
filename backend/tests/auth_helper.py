"""
Authentication helper for tests.

Provides Firebase authentication utilities for integration and load tests.
Uses real Firebase authentication to obtain valid tokens for testing.
"""

import os
import sys
import requests
import logging
from typing import Optional, Dict
from pathlib import Path

logger = logging.getLogger(__name__)

# Auto-load .env file if it exists
def load_env_file():
    """Load .env file from backend directory."""
    # Try to find .env file
    current_dir = Path(__file__).parent
    # Adjust this path if your .env file is located elsewhere
    backend_dir = current_dir.parent  # Assumes tests/ is one level down
    env_file = backend_dir / '.env'

    if not env_file.exists():
        # Try another common location (e.g., if script is in backend/tests/)
        backend_dir = current_dir.parent.parent
        env_file = backend_dir / '.env'

    if env_file.exists():
        logger.info(f"Loading .env from: {env_file}")
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Strip quotes if present
                    value = value.strip("'\"")
                    # Only set if not already in environment
                    if key not in os.environ:
                        os.environ[key] = value
        return True
    
    logger.warning(f"No .env file found at {env_file} or parent directories. Relying on environment.")
    return False

# Load .env file automatically
_env_loaded = load_env_file()

# Firebase configuration
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")  # Set via environment
TEST_USER_EMAIL = os.getenv("TEST_USER_EMAIL", "todak2000@gmail.com")
TEST_USER_PASSWORD = os.getenv("TEST_USER_PASSWORD", "Qwerty@12345")

# Firebase Auth REST API endpoints
FIREBASE_AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
FIREBASE_REFRESH_URL = "https://securetoken.googleapis.com/v1/token"


class FirebaseAuthHelper:
    """Helper class for Firebase authentication in tests."""

    def __init__(self, email: str = TEST_USER_EMAIL, password: str = TEST_USER_PASSWORD):
        self.email = email
        self.password = password
        self.api_key = FIREBASE_API_KEY
        self._id_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._user_id: Optional[str] = None
        self._tenant_id: Optional[str] = None # Tenant ID is often fetched after auth

    def authenticate(self) -> Dict[str, str]:
        """
        Authenticate with Firebase and return tokens.

        Returns:
            Dict with id_token, refresh_token, user_id, and tenant_id (or fallback)

        Raises:
            Exception if authentication fails
        """
        if not self.api_key:
            raise ValueError(
                "FIREBASE_API_KEY environment variable must be set. "
                "Get it from Firebase Console > Project Settings > Web API Key. "
                "Ensure your .env file is in the correct location (e.g., project root)."
            )

        logger.info(f"Authenticating as {self.email}")

        try:
            # Sign in with email and password
            response = requests.post(
                f"{FIREBASE_AUTH_URL}?key={self.api_key}",
                json={
                    "email": self.email,
                    "password": self.password,
                    "returnSecureToken": True
                },
                timeout=10
            )

            if response.status_code != 200:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", "Unknown error")
                logger.error(f"Firebase auth response: {error_data}")
                raise Exception(f"Firebase authentication failed ({response.status_code}): {error_msg}")

            data = response.json()
            self._id_token = data["idToken"]
            self._refresh_token = data["refreshToken"]
            self._user_id = data["localId"]

            # Fetch user's tenant_id from Firestore (if available)
            # This is a placeholder; implement your actual logic
            self._fetch_tenant_id() 

            logger.info(f"Authentication successful. User ID: {self._user_id}")
            logger.info(f"Authentication successful. User ID: {self._id_token}")

            return {
                "id_token": self._id_token,
                "refresh_token": self._refresh_token,
                "user_id": self._user_id,
                "tenant_id": "54a6cb06-0183-4b15-8ff7-77afeaeada3d"  # Fallback for tests
            }

        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error during authentication: {e}")

    def _fetch_tenant_id(self):
        """
        Placeholder: Fetch user's tenant_id.
        
        This should be implemented to query your user database (e.g., Firestore)
        to get the tenant_id associated with self._user_id.
        """
        # Example logic (replace with your actual implementation):
        # try:
        #     from google.cloud import firestore
        #     db = firestore.Client()
        #     user_doc = db.collection('users').document(self._user_id).get()
        #     if user_doc.exists:
        #         self._tenant_id = user_doc.to_dict().get('tenant_id')
        #         logger.info(f"Fetched tenant_id: {self._tenant_id}")
        #     else:
        #         logger.warning(f"User document not found for {self._user_id}")
        # except ImportError:
        #     logger.warning("google-cloud-firestore not installed. Using default tenant_id.")
        # except Exception as e:
        #     logger.error(f"Failed to fetch tenant_id from Firestore: {e}")
        
        # For now, we'll just log that we're skipping it.
        logger.info("Skipping tenant_id fetch (using default/fallback).")
        pass

    def refresh_id_token(self) -> str:
        """
        Refresh the ID token using the refresh token.

        Returns:
            New ID token
        """
        if not self._refresh_token:
            raise Exception("No refresh token available. Must authenticate first.")

        logger.info("Refreshing ID token")

        try:
            response = requests.post(
                f"{FIREBASE_REFRESH_URL}?key={self.api_key}",
                json={
                    "grant_type": "refresh_token",
                    "refresh_token": self._refresh_token
                },
                timeout=10
            )

            if response.status_code != 200:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", "Token refresh failed")
                raise Exception(f"Failed to refresh token ({response.status_code}): {error_msg}")

            data = response.json()
            self._id_token = data["id_token"]
            self._refresh_token = data["refresh_token"] # Update refresh token

            logger.info("ID token refreshed successfully.")
            return self._id_token
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error during token refresh: {e}")

    def get_auth_headers(self) -> Dict[str, str]:
        """
        Get HTTP headers with authentication token.

        Returns:
            Dict with Authorization header
        """
        if not self._id_token:
            self.authenticate()

        return {
            "Authorization": f"Bearer {self._id_token}",
            "Content-Type": "application/json"
        }

    @property
    def id_token(self) -> str:
        """Get the current ID token."""
        if not self._id_token:
            self.authenticate()
        # This will raise an exception if authentication fails, which is intended.
        return self._id_token 

    @property
    def tenant_id(self) -> str:
        """Get the user's tenant ID."""
        if not self._tenant_id:
            # Authenticate will trigger _fetch_tenant_id
            self.authenticate()
        # Return fetched ID or fallback
        return "54a6cb06-0183-4b15-8ff7-77afeaeada3d"

    @property
    def user_id(self) -> str:
        """Get the user's ID."""
        if not self._user_id:
            self.authenticate()
        # This will raise an exception if authentication fails
        return self._user_id


# Global instance for easy access in tests
_auth_helper: Optional[FirebaseAuthHelper] = None


def get_test_auth() -> FirebaseAuthHelper:
    """
    Get or create the global test authentication helper.

    Usage in tests:
        from tests.auth_helper import get_test_auth

        auth = get_test_auth()
        headers = auth.get_auth_headers()
        response = requests.get(url, headers=headers)
    """
    global _auth_helper
    if _auth_helper is None:
        _auth_helper = FirebaseAuthHelper()
    return _auth_helper


def get_test_token() -> str:
    """
    Get a valid Firebase ID token for testing.

    Returns:
        Firebase ID token string
    """
    return get_test_auth().id_token


def get_test_tenant_id() -> str:
    """
    Get the test user's tenant ID.

    Returns:
        Tenant ID string
    """
    return get_test_auth().tenant_id


# For backward compatibility with existing tests
def setup_test_auth():
    """
    Setup authentication for tests. Call this in conftest.py or test setup.

    Example:
        @pytest.fixture(scope="session", autouse=True)
        def setup_auth():
            from tests.auth_helper import setup_test_auth
            setup_test_auth()
    """
    auth = get_test_auth()
    try:
        auth.authenticate()
        logger.info("Test authentication setup complete")
        return auth
    except Exception as e:
        logger.error(f"Failed to setup test authentication: {e}")
        logger.error(
            "Make sure to set environment variables or create a .env file:\n"
            "  FIREBASE_API_KEY=your_api_key\n"
            "  TEST_USER_EMAIL=todak2000@gmail.com\n"
            "  TEST_USER_PASSWORD=Qwerty@12345"
        )
        # Re-raise the exception to fail the test setup
        raise


if __name__ == "__main__":
    # Test authentication
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    print("--- Testing Firebase Authentication ---")
    print(f"Email: {TEST_USER_EMAIL}")
    print(f"API Key set: {bool(FIREBASE_API_KEY)}")

    if not FIREBASE_API_KEY:
        print("\n❌ FIREBASE_API_KEY is not set.")
        print("Please set it as an environment variable or in a .env file.")
        sys.exit(1)

    try:
        auth = FirebaseAuthHelper()
        result = auth.authenticate()

    
        # Test token refresh
        print("\nTesting token refresh...")
        new_token = auth.refresh_id_token()
        
        if new_token == result['id_token']:
            print("⚠️ Warning: New token is the same as the old token. This might happen if refreshed too quickly.")
        
        # Test property access
        print("\nTesting property access...")
        print(f"auth.user_id: {auth.user_id}")
        print(f"auth.tenant_id: {auth.tenant_id}")
        print("--- Test Complete ---")

    except Exception as e:
        print(f"\n❌ Authentication failed: {e}")
        print("\nMake sure your environment variables are correct:")
        print("  export FIREBASE_API_KEY='your_api_key_here'")
        print("  export TEST_USER_EMAIL='todak2000@gmail.com'")
        print("  export TEST_USER_PASSWORD='Qwerty@12345'")
        print("And that the test user exists in your Firebase project.")
        sys.exit(1)
