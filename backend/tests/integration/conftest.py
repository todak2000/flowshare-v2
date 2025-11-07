"""
Pytest configuration and fixtures for integration tests.

Provides:
- Firestore client (with emulator support)
- Pub/Sub clients (publisher and subscriber)
- HTTP client for agent health checks
- Test data factories
- Cleanup utilities
"""

import pytest
import asyncio
import os
import sys
from google.cloud import firestore
from google.cloud import pubsub_v1
import aiohttp
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from tests.auth_helper import FirebaseAuthHelper, get_test_auth

# Environment configuration
USE_EMULATOR = os.getenv("USE_EMULATOR", "true").lower() == "true"

if USE_EMULATOR:
    os.environ["FIRESTORE_EMULATOR_HOST"] = os.getenv("FIRESTORE_EMULATOR_HOST", "localhost:8080")
    os.environ["PUBSUB_EMULATOR_HOST"] = os.getenv("PUBSUB_EMULATOR_HOST", "localhost:8085")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "flowshare-v2")

# Topics and their subscriptions for auto-creation
TOPICS = {
    "production-entry-created": ["production-entry-created-sub"],
    "entry-flagged": ["entry-flagged-sub"],
    "reconciliation-triggered": ["reconciliation-triggered-sub"],
    "reconciliation-complete": ["reconciliation-complete-sub"],
    "invitation-created": ["invitation-created-sub"],
    "publish_production_entry_edited": ["publish_production_entry_edited-sub"]
}


@pytest.fixture(scope="session")
def ensure_pubsub_topics():
    """Ensure Pub/Sub topics and subscriptions exist before running tests."""
    if not USE_EMULATOR:
        # Only auto-create in emulator mode
        return

    try:
        from google.api_core.exceptions import AlreadyExists

        publisher = pubsub_v1.PublisherClient()
        subscriber = pubsub_v1.SubscriberClient()

        for topic_name, subscriptions in TOPICS.items():
            # Create topic if it doesn't exist
            topic_path = publisher.topic_path(PROJECT_ID, topic_name)
            try:
                publisher.create_topic(request={"name": topic_path})
                print(f"✅ Created topic: {topic_name}")
            except AlreadyExists:
                pass  # Topic already exists, no problem
            except Exception:
                pass  # Ignore other errors, test will fail if topic truly missing

            # Create subscriptions if they don't exist
            for sub_name in subscriptions:
                subscription_path = subscriber.subscription_path(PROJECT_ID, sub_name)
                try:
                    subscriber.create_subscription(
                        request={
                            "name": subscription_path,
                            "topic": topic_path,
                            "ack_deadline_seconds": 60,
                        }
                    )
                    print(f"✅ Created subscription: {sub_name}")
                except AlreadyExists:
                    pass  # Subscription already exists
                except Exception:
                    pass  # Ignore errors
    except Exception as e:
        print(f"⚠️  Could not auto-create Pub/Sub topics: {e}")
        print("   Run: python backend/create-pubsub-topics.py")


@pytest.fixture(scope="session")
def event_loop(ensure_pubsub_topics):
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def auth_helper():
    """Provide Firebase authentication helper for tests."""
    if not USE_EMULATOR:
        # Only authenticate if not using emulator
        auth = get_test_auth()
        try:
            auth.authenticate()
            print(f"\n✅ Authenticated as {auth.email}")
            print(f"   Tenant ID: {auth.tenant_id}")
            print(f"   User ID: {auth.user_id}")
            return auth
        except Exception as e:
            print(f"\n⚠️  Authentication failed: {e}")
            print("   Tests requiring authentication will be skipped")
            return None
    return None


@pytest.fixture
def auth_headers(auth_helper):
    """Provide authentication headers for HTTP requests."""
    if auth_helper:
        return auth_helper.get_auth_headers()
    return {"Content-Type": "application/json"}


@pytest.fixture
def test_token(auth_helper):
    """Provide Firebase ID token for tests."""
    if auth_helper:
        return auth_helper.id_token
    return "test_token_emulator"


@pytest.fixture
def test_tenant_id(auth_helper):
    """Provide tenant ID for tests."""
    if auth_helper:
        return auth_helper.tenant_id
    return "54a6cb06-0183-4b15-8ff7-77afeaeada3d"


@pytest.fixture
async def firestore_client():
    """Provide async Firestore client."""
    client = firestore.AsyncClient(project=PROJECT_ID)
    yield client
    # Cleanup after test
    # Note: In emulator mode, can clear all data
    client.close()


@pytest.fixture
def pubsub_publisher():
    """Provide Pub/Sub publisher client."""
    client = pubsub_v1.PublisherClient()
    yield client


@pytest.fixture
def pubsub_subscriber():
    """Provide Pub/Sub subscriber client."""
    client = pubsub_v1.SubscriberClient()
    yield client
    # Cleanup subscriptions if needed


@pytest.fixture
async def http_client():
    """Provide async HTTP client for testing agent endpoints."""
    async with aiohttp.ClientSession() as session:
        yield session


@pytest.fixture
async def check_agent_running(http_client):
    """Check if an agent is running and accessible."""
    async def _check(port: int) -> bool:
        try:
            response = await http_client.get(f"http://localhost:{port}/", timeout=aiohttp.ClientTimeout(total=2))
            if response.status == 200:
                data = await response.json()
                return data.get("status") == "healthy"
        except Exception:
            pass
        return False
    return _check


@pytest.fixture
def test_tenant_data():
    """Provide test tenant data."""
    return {
        "id": "54a6cb06-0183-4b15-8ff7-77afeaeada3d",
        "name": "Test Oil Company",
        "settings": {
            "allocation_method": "API_MPMS_11_1",
            "require_approval_pct": 90
        },
        "created_at": datetime.now().isoformat()
    }


@pytest.fixture
def test_user_data():
    """Provide test user data."""
    return {
        "coordinator": {
            "id": "user_coordinator",
            "email": "coordinator@test.com",
            "role": "coordinator",
            "tenant_id": "54a6cb06-0183-4b15-8ff7-77afeaeada3d",
            "notification_settings": {
                "email_alerts": True,
                "email_reports": True
            }
        },
        "partner": {
            "id": "user_partner",
            "email": "partner@test.com",
            "role": "partner",
            "tenant_id": "54a6cb06-0183-4b15-8ff7-77afeaeada3d",
            "partner_id": "partner_001",
            "notification_settings": {
                "email_alerts": True,
                "email_reports": True
            }
        }
    }


@pytest.fixture
def production_entry_factory():
    """Factory for creating test production entries."""
    def create_entry(
        entry_id: str,
        tenant_id: str = "54a6cb06-0183-4b15-8ff7-77afeaeada3d",
        partner_id: str = "938d094a-f75d-4b9a-875c-4668f1a776ff",
        status: str = "pending",
        **kwargs
    ):
        entry = {
            "id": entry_id,
            "tenant_id": tenant_id,
            "partner_id": partner_id,
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": kwargs.get("gross_volume", 25000.0),
            "bsw_percent": kwargs.get("bsw_percent", 5.0),
            "temperature": kwargs.get("temperature", 85.0),
            "pressure": kwargs.get("pressure", 100.0),
            "api_gravity": kwargs.get("api_gravity", 35.0),
            "meter_factor": kwargs.get("meter_factor", 1.0),
            "status": status,
            "created_at": datetime.now().isoformat()
        }
        return entry
    return create_entry


@pytest.fixture
def reconciliation_factory():
    """Factory for creating test reconciliations."""
    from datetime import timedelta

    def create_reconciliation(
        recon_id: str,
        tenant_id: str = "54a6cb06-0183-4b15-8ff7-77afeaeada3d",
        status: str = "pending",
        **kwargs
    ):
        recon = {
            "id": recon_id,
            "tenant_id": tenant_id,
            "period_start": kwargs.get("period_start", (datetime.now() - timedelta(days=30)).isoformat()),
            "period_end": kwargs.get("period_end", datetime.now().isoformat()),
            "terminal_volume": kwargs.get("terminal_volume", 100000.0),
            "status": status,
            "created_at": datetime.now().isoformat()
        }
        return recon
    return create_reconciliation


@pytest.fixture(autouse=True)
async def cleanup_test_data(firestore_client):
    """Automatically cleanup test data after each test."""
    yield
    # Cleanup collections
    collections = [
        "production_entries",
        "reconciliations",
        "users",
        "tenants",
        "invitations"
    ]
    for collection in collections:
        docs = firestore_client.collection(collection).where("id", ">=", "test_").stream()
        async for doc in docs:
            try:
                await doc.reference.delete()
            except:
                pass


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "chaos: mark test as chaos engineering test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "requires_agents: mark test as requiring agent services to be running"
    )
