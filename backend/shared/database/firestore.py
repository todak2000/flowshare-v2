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
                print(f"✅ Firebase initialized from local credentials file: {credentials_file.name}")
                print(f"   Project: {firebase_project_id}")
                print(f"   Service account: {cred_data.get('client_email')}")
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
                    print(f"✅ Firebase initialized from Secret Manager (FIREBASE_CREDENTIALS_JSON)")
                    print(f"   Project: {firebase_project_id}")
                    print(f"   Service account: {cred_data.get('client_email')}")
                    if os.getenv("FIRESTORE_EMULATOR_HOST"):
                        print(f"   Using Firestore Emulator at: {os.getenv('FIRESTORE_EMULATOR_HOST')}")
                except Exception as e:
                    print(f"❌ Failed to initialize from Secret Manager JSON: {e}")
                    raise
            else:
                # Priority 3: Try environment variables (fallback for old setup)
                firebase_private_key = settings.firebase_private_key
                firebase_client_email = settings.firebase_client_email
                firebase_project_id = settings.firebase_project_id or settings.gcp_project_id
                firebase_private_key_id = settings.firebase_private_key_id

                if firebase_private_key and firebase_client_email and firebase_project_id:
                    # Use service account credentials from environment
                    try:
                        cred_dict = {
                            "type": "service_account",
                            "project_id": firebase_project_id,
                            "private_key_id": firebase_private_key_id,
                            "private_key": firebase_private_key.replace('\\n', '\n'),
                            "client_email": firebase_client_email,
                            "token_uri": "https://oauth2.googleapis.com/token",
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{firebase_client_email}",
                        }
                        cred = credentials.Certificate(cred_dict)
                        firebase_admin.initialize_app(cred)
                        print(f"✅ Firebase initialized with environment variables for project: {firebase_project_id}")
                        print(f"   Service account email: {firebase_client_email}")
                        if os.getenv("FIRESTORE_EMULATOR_HOST"):
                            print(f"   Using Firestore Emulator at: {os.getenv('FIRESTORE_EMULATOR_HOST')}")
                    except Exception as e:
                        print(f"❌ Failed to initialize with environment variables: {e}")
                        raise
                else:
                    # Priority 4: Fallback to default initialization (ADC)
                    print("⚠️  Missing Firebase credentials file and environment variables")
                    print("   Falling back to Application Default Credentials (ADC)")
                    firebase_admin.initialize_app()
                    firebase_project_id = settings.firebase_project_id or settings.gcp_project_id
                    print("✅ Firebase initialized with default credentials")

    # Use async_client() for async operations
    _db_client = firestore.AsyncClient(project=firebase_project_id)
    print(f"✅ Firestore async client created: {type(_db_client)}")
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
