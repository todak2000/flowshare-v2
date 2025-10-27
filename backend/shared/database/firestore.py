"""Firestore database client and utilities."""
import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore
from typing import Optional, Any
import os
from shared.config import settings


_db_client: Optional[firestore.AsyncClient] = None


def initialize_firestore() -> firestore.AsyncClient:
    """Initialize and return Firestore client."""
    global _db_client

    if _db_client is not None:
        return _db_client

    # Check if Firebase is already initialized
    if not firebase_admin._apps:
        # Initialize Firebase Admin SDK
        # IMPORTANT: We need credentials even with Firestore emulator if using real Firebase Auth
        # Try to use service account credentials from settings
        firebase_private_key = settings.firebase_private_key
        firebase_client_email = settings.firebase_client_email
        firebase_project_id = settings.firebase_project_id or settings.gcp_project_id

        # Debug logging
        print(f"🔍 Debug - Checking Firebase credentials:")
        print(f"   FIREBASE_PROJECT_ID: {firebase_project_id}")
        print(f"   FIREBASE_CLIENT_EMAIL: {firebase_client_email}")
        print(f"   FIREBASE_PRIVATE_KEY present: {bool(firebase_private_key)}")
        print(f"   FIREBASE_PRIVATE_KEY length: {len(firebase_private_key) if firebase_private_key else 0}")

        if firebase_private_key and firebase_client_email and firebase_project_id:
            # Use service account credentials
            try:
                cred_dict = {
                    "type": "service_account",
                    "project_id": firebase_project_id,
                    "private_key": firebase_private_key.replace('\\n', '\n'),
                    "client_email": firebase_client_email,
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{firebase_client_email}",
                }
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print(f"✅ Firebase initialized with service account for project: {firebase_project_id}")
                if os.getenv("FIRESTORE_EMULATOR_HOST"):
                    print(f"   Using Firestore Emulator at: {os.getenv('FIRESTORE_EMULATOR_HOST')}")
            except Exception as e:
                print(f"❌ Failed to initialize with service account: {e}")
                raise
        else:
            # Fallback to default initialization (will use ADC or emulator)
            print("⚠️  Missing Firebase credentials, falling back to default initialization")
            firebase_admin.initialize_app()
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
    RECONCILIATIONS = "reconciliations"
    TERMINAL_RECEIPTS = "terminal_receipts"
    API_KEYS = "api_keys"
    PARTNERS = "partners"
    AUDIT_LOGS = "audit_logs"
