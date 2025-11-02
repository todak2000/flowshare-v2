"""
Pytest configuration and shared fixtures for FlowShare V2 tests.

This module provides:
- Firebase Admin SDK mocks
- Firestore mocks
- Test client setup
- Common test data fixtures
"""

import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from datetime import datetime, timedelta
from typing import Generator, Dict, Any
import sys
from pathlib import Path

# Add parent directory to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Mock Google Cloud modules before any imports
sys.modules['google.cloud.pubsub_v1'] = MagicMock()
sys.modules['google.cloud.bigquery'] = MagicMock()
sys.modules['google.cloud.aiplatform'] = MagicMock()
sys.modules['google.cloud.storage'] = MagicMock()
sys.modules['google.generativeai'] = MagicMock()

from fastapi.testclient import TestClient
from google.cloud.firestore_v1 import Client as FirestoreClient


# ============================================================================
# APPLICATION SETUP
# ============================================================================

@pytest.fixture(scope="session")
def mock_firebase_admin():
    """Mock Firebase Admin SDK for all tests."""
    with patch('firebase_admin.initialize_app') as mock_init, \
         patch('firebase_admin.credentials.Certificate') as mock_cert, \
         patch('firebase_admin.auth.verify_id_token') as mock_verify:

        # Mock successful token verification
        mock_verify.return_value = {
            'uid': 'test_user_123',
            'email': 'test@example.com',
            'email_verified': True
        }

        yield {
            'init': mock_init,
            'cert': mock_cert,
            'verify': mock_verify
        }


@pytest.fixture(scope="session")
def mock_firestore():
    """Mock Firestore client for all tests."""
    with patch('shared.database.initialize_firestore') as mock_init:
        mock_db = MagicMock(spec=FirestoreClient)
        mock_init.return_value = mock_db
        yield mock_db


@pytest.fixture(scope="function")
def mock_firestore_collection():
    """Mock Firestore collection for individual tests."""
    mock_collection = MagicMock()
    mock_doc_ref = MagicMock()
    mock_doc_snap = MagicMock()

    # Setup document reference chain
    mock_collection.document.return_value = mock_doc_ref
    mock_doc_ref.get.return_value = mock_doc_snap
    mock_doc_snap.exists = True
    mock_doc_snap.to_dict.return_value = {}
    mock_doc_snap.id = "test_doc_id"

    return mock_collection


@pytest.fixture(scope="session")
def app(mock_firebase_admin, mock_firestore):
    """Create FastAPI test application with mocked dependencies."""
    # Import after mocks are in place
    from api.main import app as fastapi_app
    return fastapi_app


@pytest.fixture(scope="function")
def client(app) -> Generator[TestClient, None, None]:
    """Create test client for making HTTP requests."""
    with TestClient(app) as test_client:
        yield test_client


# ============================================================================
# AUTHENTICATION FIXTURES
# ============================================================================

@pytest.fixture
def mock_auth_token() -> str:
    """Valid Firebase auth token for testing."""
    return "mock_firebase_token_abc123"


@pytest.fixture
def auth_headers(mock_auth_token: str) -> Dict[str, str]:
    """Headers with authentication token."""
    return {"Authorization": f"Bearer {mock_auth_token}"}


@pytest.fixture
def mock_verify_token():
    """Mock Firebase token verification."""
    with patch('shared.auth.firebase_auth.verify_firebase_token') as mock_verify:
        mock_verify.return_value = {
            'uid': 'test_user_123',
            'email': 'test@example.com',
            'email_verified': True
        }
        yield mock_verify


@pytest.fixture
def mock_current_user():
    """Mock current user dependency."""
    from shared.models.users import User

    user = User(
        id="user_123",
        email="test@example.com",
        full_name="Test User",
        role="coordinator",
        primary_tenant_id="tenant_123",
        phone_number="+1234567890",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        is_active=True,
        email_verified=True
    )

    with patch('shared.auth.firebase_auth.get_current_user') as mock_get_user:
        mock_get_user.return_value = user
        yield user


# ============================================================================
# TEST DATA FIXTURES
# ============================================================================

@pytest.fixture
def sample_user_data() -> Dict[str, Any]:
    """Sample user data for tests."""
    return {
        "id": "user_123",
        "email": "test@example.com",
        "full_name": "Test User",
        "role": "coordinator",
        "primary_tenant_id": "tenant_123",
        "phone_number": "+1234567890",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "is_active": True,
        "email_verified": True
    }


@pytest.fixture
def sample_tenant_data() -> Dict[str, Any]:
    """Sample tenant data for tests."""
    return {
        "id": "tenant_123",
        "name": "Test Tenant Company",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "subscription_plan": "starter",
        "subscription_status": "active",
        "owner_id": "user_123",
        "is_active": True
    }


@pytest.fixture
def sample_production_entry() -> Dict[str, Any]:
    """Sample production entry for tests."""
    return {
        "id": "entry_123",
        "tenant_id": "tenant_123",
        "partner_id": "partner_123",
        "date": "2024-01-15",
        "gross_volume": 1000.5,
        "bsw": 2.5,
        "temperature": 60.0,
        "density": 0.85,
        "net_volume": 975.5,
        "status": "approved",
        "created_by": "user_123",
        "created_at": datetime.utcnow().isoformat(),
        "environment": "production"
    }


@pytest.fixture
def sample_reconciliation_data() -> Dict[str, Any]:
    """Sample reconciliation data for tests."""
    return {
        "id": "recon_123",
        "tenant_id": "tenant_123",
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "status": "completed",
        "created_by": "user_123",
        "created_at": datetime.utcnow().isoformat(),
        "total_volume": 50000.0,
        "allocations": {}
    }


@pytest.fixture
def sample_invitation_data() -> Dict[str, Any]:
    """Sample invitation data for tests."""
    return {
        "id": "invite_123",
        "tenant_id": "tenant_123",
        "email": "newuser@example.com",
        "role": "partner",
        "partner_name": "Partner Company",
        "status": "pending",
        "created_by": "user_123",
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }


# ============================================================================
# MOCK EXTERNAL SERVICES
# ============================================================================

@pytest.fixture
def mock_pubsub():
    """Mock Google Pub/Sub client."""
    with patch('google.cloud.pubsub_v1.PublisherClient') as mock_publisher:
        mock_future = Mock()
        mock_future.result.return_value = "message_id_123"
        mock_publisher.return_value.publish.return_value = mock_future
        yield mock_publisher


@pytest.fixture
def mock_bigquery():
    """Mock Google BigQuery client."""
    with patch('google.cloud.bigquery.Client') as mock_bq:
        yield mock_bq


@pytest.fixture
def mock_vertex_ai():
    """Mock Vertex AI endpoint."""
    with patch('google.cloud.aiplatform.Endpoint') as mock_endpoint:
        mock_prediction = Mock()
        mock_prediction.predictions = [{"anomaly_score": 0.1, "is_anomaly": False}]
        mock_endpoint.return_value.predict.return_value = mock_prediction
        yield mock_endpoint


@pytest.fixture
def mock_gemini_api():
    """Mock Gemini AI API."""
    with patch('google.generativeai.GenerativeModel') as mock_model:
        mock_response = Mock()
        mock_response.text = "AI generated response for testing"
        mock_model.return_value.generate_content.return_value = mock_response
        yield mock_model


@pytest.fixture
def mock_storage():
    """Mock Google Cloud Storage."""
    with patch('google.cloud.storage.Client') as mock_storage_client:
        mock_bucket = Mock()
        mock_blob = Mock()
        mock_blob.public_url = "https://storage.googleapis.com/test/file.pdf"
        mock_bucket.blob.return_value = mock_blob
        mock_storage_client.return_value.bucket.return_value = mock_bucket
        yield mock_storage_client


# ============================================================================
# DATABASE MOCK HELPERS
# ============================================================================

@pytest.fixture
def mock_firestore_get():
    """Mock Firestore get operation."""
    def _mock_get(data: Dict[str, Any] = None, exists: bool = True):
        mock_doc = Mock()
        mock_doc.exists = exists
        mock_doc.to_dict.return_value = data if exists else None
        mock_doc.id = data.get('id', 'test_id') if data else 'test_id'
        return mock_doc

    return _mock_get


@pytest.fixture
def mock_firestore_query():
    """Mock Firestore query operation."""
    def _mock_query(documents: list = None):
        if documents is None:
            documents = []

        mock_docs = []
        for doc_data in documents:
            mock_doc = Mock()
            mock_doc.to_dict.return_value = doc_data
            mock_doc.id = doc_data.get('id', 'test_id')
            mock_docs.append(mock_doc)

        return mock_docs

    return _mock_query


# ============================================================================
# UTILITY FIXTURES
# ============================================================================

@pytest.fixture
def freeze_time():
    """Freeze time for consistent timestamp testing."""
    frozen_time = datetime(2024, 1, 15, 12, 0, 0)

    with patch('api.routers.auth.datetime') as mock_datetime:
        mock_datetime.utcnow.return_value = frozen_time
        mock_datetime.now.return_value = frozen_time
        yield frozen_time


@pytest.fixture
def mock_email_sender():
    """Mock email sending functionality."""
    with patch('shared.email.send_email') as mock_send:
        mock_send.return_value = True
        yield mock_send


# ============================================================================
# CLEANUP
# ============================================================================

@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset all mocks after each test."""
    yield
    # Cleanup happens automatically with pytest
