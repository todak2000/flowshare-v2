"""Firestore database client and utilities."""
import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore
from typing import Optional, Any
import os
import json
from shared.config import settings


_db_client: Optional[firestore.AsyncClient] = None


def get_secret_from_secret_manager(secret_name: str, project_id: str) -> Optional[str]:
    """
    Fetch a secret from Google Cloud Secret Manager.

    Args:
        secret_name: Name of the secret in Secret Manager
        project_id: GCP project ID

    Returns:
        Secret value as string, or None if not found/error
    """
    try:
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        secret_path = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
        response = client.access_secret_version(request={"name": secret_path})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        print(f"⚠️  Could not fetch secret {secret_name}: {e}")
        return None


def initialize_firestore() -> firestore.AsyncClient:
    """Initialize and return Firestore client."""
    global _db_client

    if _db_client is not None:
        return _db_client

    # Check if Firebase is already initialized
    if not firebase_admin._apps:
        # Initialize Firebase Admin SDK
        # Priority 1: Try to load from local JSON file (local development)
        from pathlib import Path
        credentials_file = Path(__file__).parent.parent.parent / "firebase-credentials.json"

        if credentials_file.exists():
            try:
                cred = credentials.Certificate(str(credentials_file))
                firebase_admin.initialize_app(cred)
                # Extract project_id from the credentials file
                with open(credentials_file, 'r') as f:
                    cred_data = json.load(f)
                firebase_project_id = cred_data.get('project_id', settings.gcp_project_id)
     
                if os.getenv("FIRESTORE_EMULATOR_HOST"):
                    print(f"   Using Firestore Emulator at: {os.getenv('FIRESTORE_EMULATOR_HOST')}")
            except Exception as e:
                print(f"❌ Failed to initialize from credentials file: {e}")
                raise
        else:
            # Priority 2: Try to fetch credentials JSON from Secret Manager (production)
            firebase_project_id = settings.firebase_project_id or settings.gcp_project_id
            credentials_json_str = get_secret_from_secret_manager(
                "FIREBASE_CREDENTIALS_JSON",
                firebase_project_id
            )

            if credentials_json_str:
                try:
                    # Parse the JSON string and use it directly
                    cred_data = json.loads(credentials_json_str)
                    cred = credentials.Certificate(cred_data)
                    firebase_admin.initialize_app(cred)
                    firebase_project_id = cred_data.get('project_id', firebase_project_id)
    
                    if os.getenv("FIRESTORE_EMULATOR_HOST"):
                        print(f"   Using Firestore Emulator at: {os.getenv('FIRESTORE_EMULATOR_HOST')}")
                except Exception as e:
                    print(f"❌ Failed to initialize from Secret Manager JSON: {e}")
                    raise
            
    # Use async_client() for async operations
    _db_client = firestore.AsyncClient(project=firebase_project_id)
    print(f"✅ Firestore async client created")
    return _db_client


def get_firestore() -> Any:
    """Get the Firestore client instance."""
    if _db_client is None:
        return initialize_firestore()
    return _db_client


class FirestoreCollections:
    """Firestore collection names."""

    TENANTS = "tenants"
    USERS = "users"
    INVITATIONS = "invitations"
    PRODUCTION_ENTRIES = "production_entries"
    PRODUCTION_ENTRIES_TEST = "production_entries_test"
    RECONCILIATIONS = "reconciliations"
    TERMINAL_RECEIPTS = "terminal_receipts"
    API_KEYS = "api_keys"
    PARTNERS = "partners"
    AUDIT_LOGS = "audit_logs"
