"""Firestore database client and utilities."""
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import AsyncClient
from typing import Optional
import os


_db_client: Optional[AsyncClient] = None


def initialize_firestore() -> AsyncClient:
    """Initialize and return Firestore client."""
    global _db_client

    if _db_client is not None:
        return _db_client

    # Check if Firebase is already initialized
    if not firebase_admin._apps:
        # Initialize Firebase Admin SDK
        # In production, this uses Application Default Credentials
        # In development with emulator, set FIRESTORE_EMULATOR_HOST env var
        if os.getenv("FIRESTORE_EMULATOR_HOST"):
            # Use default app with emulator
            firebase_admin.initialize_app()
        else:
            # Production: use service account or ADC
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred)
            except Exception:
                # Fallback to default initialization
                firebase_admin.initialize_app()

    _db_client = firestore.AsyncClient()
    return _db_client


def get_firestore() -> AsyncClient:
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
    API_KEYS = "api_keys"
    PARTNERS = "partners"
