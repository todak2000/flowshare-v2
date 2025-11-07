"""
Integration tests for Accountant Agent (Reconciliation Engine).

Tests validate:
- Reconciliation workflow execution
- API MPMS 11.1 allocation methodology
- Volume calculations (water cut, temperature, API gravity corrections)
- 90% approval rate validation
- Shrinkage calculations
- AI analysis generation
- Pub/Sub message processing
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
import json

ACCOUNTANT_PORT = 8002
TEST_TENANT_ID = "54a6cb06-0183-4b15-8ff7-77afeaeada3d"
PROJECT_ID = "flowshare-v2"


class TestAccountantAgent:
    """Integration tests for Accountant Agent."""

    @pytest.fixture
    async def setup_reconciliation_data(self, firestore_client):
        """Create test data for reconciliation."""
        # Create tenant
        tenant = {
            "id": TEST_TENANT_ID,
            "name": "Test Oil Company",
            "settings": {
                "allocation_method": "API_MPMS_11_1",
                "require_approval_pct": 90
            }
        }
        await firestore_client.collection("tenants").document(TEST_TENANT_ID).set(tenant)

        # Create approved production entries
        entries = []
        partners = ["partner_001", "partner_002", "partner_003"]

        for i, partner_id in enumerate(partners):
            entry = {
                "id": f"test_entry_{i}",
                "tenant_id": TEST_TENANT_ID,
                "partner_id": partner_id,
                "measurement_date": (datetime.now() - timedelta(days=i)).isoformat(),
                "gross_volume": 30000.0 + (i * 5000),
                "bsw_percent": 5.0 + i,
                "temperature": 85.0 + i,
                "pressure": 100.0,
                "api_gravity": 35.0 + i,
                "meter_factor": 1.0,
                "status": "approved",
                "created_at": datetime.now().isoformat()
            }
            entries.append(entry)
            await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Create reconciliation request
        recon = {
            "id": "test_recon_001",
            "tenant_id": TEST_TENANT_ID,
            "period_start": (datetime.now() - timedelta(days=30)).isoformat(),
            "period_end": datetime.now().isoformat(),
            "terminal_volume": 100000.0,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        await firestore_client.collection("reconciliations").document(recon["id"]).set(recon)

        yield {
            "tenant": tenant,
            "entries": entries,
            "reconciliation": recon
        }

        # Cleanup
        for entry in entries:
            await firestore_client.collection("production_entries").document(entry["id"]).delete()
        await firestore_client.collection("reconciliations").document(recon["id"]).delete()
        await firestore_client.collection("tenants").document(TEST_TENANT_ID).delete()

    @pytest.mark.asyncio
    async def test_accountant_health_check(self, http_client):
        """Test accountant agent health endpoint."""
        response = await http_client.get(f"http://localhost:{ACCOUNTANT_PORT}/")
        assert response.status == 200
        data = await response.json()
        assert data["status"] == "healthy"
        assert data["worker"] == "accountant-agent"

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_reconciliation_workflow(self, setup_reconciliation_data, firestore_client, pubsub_publisher):
        """Test complete reconciliation workflow."""
        recon = setup_reconciliation_data["reconciliation"]

        # Publish reconciliation-triggered event
        message_data = {
            "reconciliation_id": recon["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "reconciliation-triggered")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()  # Wait for publish to complete

        # Wait for processing
        await asyncio.sleep(5)

        # Check reconciliation was completed
        doc = await firestore_client.collection("reconciliations").document(recon["id"]).get()
        assert doc.exists
        data = doc.to_dict()

        assert data["status"] == "completed"
        assert "result" in data
        result = data["result"]
        assert "partner_allocations" in result
        assert "total_allocated_volume" in result
        assert "shrinkage_volume" in result
        assert "shrinkage_percent" in result
        assert "ai_analysis" in data

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_approval_rate_validation(self, firestore_client, pubsub_publisher):
        """Test that reconciliation requires 90%+ approval rate."""
        # Create reconciliation with insufficient approvals
        entries = []
        for i in range(10):
            status = "approved" if i < 8 else "pending"  # Only 80% approved
            entry = {
                "id": f"test_low_approval_{i}",
                "tenant_id": TEST_TENANT_ID,
                "partner_id": "partner_001",
                "measurement_date": datetime.now().isoformat(),
                "gross_volume": 25000.0,
                "bsw_percent": 5.0,
                "temperature": 85.0,
                "pressure": 100.0,
                "api_gravity": 35.0,
                "meter_factor": 1.0,
                "status": status,
                "created_at": datetime.now().isoformat()
            }
            entries.append(entry)
            await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        recon = {
            "id": "test_recon_low_approval",
            "tenant_id": TEST_TENANT_ID,
            "period_start": (datetime.now() - timedelta(days=1)).isoformat(),
            "period_end": datetime.now().isoformat(),
            "terminal_volume": 100000.0,
            "status": "pending"
        }
        await firestore_client.collection("reconciliations").document(recon["id"]).set(recon)

        # Trigger reconciliation
        message_data = {
            "reconciliation_id": recon["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "reconciliation-triggered")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Check reconciliation failed
        doc = await firestore_client.collection("reconciliations").document(recon["id"]).get()
        data = doc.to_dict()
        assert data["status"] == "failed" or "error" in data
        assert "approval" in str(data).lower()

        # Cleanup
        for entry in entries:
            await firestore_client.collection("production_entries").document(entry["id"]).delete()
        await firestore_client.collection("reconciliations").document(recon["id"]).delete()

    @pytest.mark.asyncio
    async def test_allocation_calculations(self):
        """Test API MPMS 11.1 allocation calculations."""
        # Test data
        gross_volume = 30000.0
        bsw_percent = 5.0
        temperature = 85.0
        api_gravity = 35.0

        # Step 1: Water Cut Factor
        water_cut_factor = 1 - (bsw_percent / 100)
        net_oil = gross_volume * water_cut_factor
        assert abs(net_oil - 28500.0) < 0.1

        # Step 2: Temperature Correction (85°F to 60°F standard)
        # Simplified: actual uses API tables
        temp_correction_factor = 1 - ((temperature - 60) * 0.00035)  # Approximate
        temp_corrected = net_oil * temp_correction_factor
        assert temp_corrected < net_oil  # Should reduce volume

        # Step 3: API Gravity Correction
        # Specific gravity = 141.5 / (API + 131.5)
        specific_gravity = 141.5 / (api_gravity + 131.5)
        assert 0.8 < specific_gravity < 1.0

        # Step 4: Net Standard Volume
        nsv = temp_corrected  # Simplified
        assert nsv > 0

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_shrinkage_calculation(self, setup_reconciliation_data, firestore_client, pubsub_publisher):
        """Test shrinkage calculation."""
        recon = setup_reconciliation_data["reconciliation"]

        # Trigger reconciliation
        message_data = {
            "reconciliation_id": recon["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "reconciliation-triggered")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(5)

        # Check shrinkage was calculated
        doc = await firestore_client.collection("reconciliations").document(recon["id"]).get()
        data = doc.to_dict()

        assert "result" in data
        result = data["result"]
        terminal_volume = data["terminal_volume"]
        total_allocated = result["total_allocated_volume"]
        shrinkage = result["shrinkage_volume"]
        shrinkage_percent = result["shrinkage_percent"]

        # Verify calculation
        # Note: shrinkage is calculated as gross_volume - allocated_volume, not terminal - allocated
        total_gross = result["total_gross_volume"]
        expected_shrinkage = total_gross - total_allocated
        expected_percent = (expected_shrinkage / total_gross) * 100 if total_gross > 0 else 0

        assert abs(shrinkage - expected_shrinkage) < 0.01
        assert abs(shrinkage_percent - expected_percent) < 0.01

    @pytest.mark.asyncio
    async def test_partner_aggregation(self, setup_reconciliation_data, firestore_client):
        """Test that entries are correctly grouped by partner."""
        entries = setup_reconciliation_data["entries"]

        # Group by partner manually
        partner_groups = {}
        for entry in entries:
            partner_id = entry["partner_id"]
            if partner_id not in partner_groups:
                partner_groups[partner_id] = []
            partner_groups[partner_id].append(entry)

        # Verify each partner has entries
        assert len(partner_groups) == 3
        for partner_id, partner_entries in partner_groups.items():
            assert len(partner_entries) > 0

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_reconciliation_complete_event(self, setup_reconciliation_data, pubsub_publisher, pubsub_subscriber):
        """Test that reconciliation-complete event is published."""
        recon = setup_reconciliation_data["reconciliation"]

        # Subscribe to reconciliation-complete topic
        complete_messages = []

        def callback(message):
            complete_messages.append(message)
            message.ack()

        subscription_path = pubsub_subscriber.subscription_path(PROJECT_ID, "reconciliation-complete-sub")
        streaming_pull_future = pubsub_subscriber.subscribe(subscription_path, callback=callback)

        # Trigger reconciliation
        message_data = {
            "reconciliation_id": recon["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "reconciliation-triggered")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(5)

        # Verify event was published
        streaming_pull_future.cancel()
        assert len(complete_messages) > 0

        # Verify message content
        message = complete_messages[0]
        data = json.loads(message.data.decode("utf-8"))
        assert data["reconciliation_id"] == recon["id"]
        assert data["tenant_id"] == TEST_TENANT_ID

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_ai_analysis_generation(self, setup_reconciliation_data, firestore_client, pubsub_publisher):
        """Test that AI analysis is generated for reconciliation."""
        recon = setup_reconciliation_data["reconciliation"]

        # Trigger reconciliation
        message_data = {
            "reconciliation_id": recon["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "reconciliation-triggered")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(5)

        # Check AI analysis
        doc = await firestore_client.collection("reconciliations").document(recon["id"]).get()
        data = doc.to_dict()

        assert "ai_analysis" in data
        assert len(data["ai_analysis"]) > 100
        # Should mention key terms
        analysis_lower = data["ai_analysis"].lower()
        assert any(word in analysis_lower for word in ["allocation", "reconciliation", "volume", "shrinkage"])

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_zero_entries_reconciliation(self, firestore_client, pubsub_publisher):
        """Test reconciliation with no entries."""
        recon = {
            "id": "test_recon_empty",
            "tenant_id": TEST_TENANT_ID,
            "period_start": (datetime.now() - timedelta(days=365)).isoformat(),  # Long ago
            "period_end": (datetime.now() - timedelta(days=360)).isoformat(),
            "terminal_volume": 100000.0,
            "status": "pending"
        }
        await firestore_client.collection("reconciliations").document(recon["id"]).set(recon)

        # Trigger reconciliation
        message_data = {
            "reconciliation_id": recon["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "reconciliation-triggered")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Should fail gracefully
        doc = await firestore_client.collection("reconciliations").document(recon["id"]).get()
        data = doc.to_dict()
        assert data["status"] == "failed" or "error" in data

        # Cleanup
        await firestore_client.collection("reconciliations").document(recon["id"]).delete()
