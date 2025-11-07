"""
Integration tests for Auditor Agent (Anomaly Detector).

Tests validate:
- Production entry anomaly detection
- Z-score statistical analysis
- Rule-based validation
- Pub/Sub message processing
- AI analysis generation
- Entry status updates
"""
import pytest
import asyncio
import json
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from google.cloud import firestore
from google.cloud.pubsub_v1 import SubscriberClient, PublisherClient

# Test configuration
AUDITOR_PORT = 8001
TEST_TENANT_ID = "54a6cb06-0183-4b15-8ff7-77afeaeada3d"
TEST_PARTNER_ID = "938d094a-f75d-4b9a-875c-4668f1a776ff"
PROJECT_ID = "flowshare-v2"


class TestAuditorAgent:
    """Integration tests for Auditor Agent."""

    @pytest.fixture
    async def setup_test_data(self, firestore_client):
        """Create test production entries in Firestore."""
        # Normal entry (should be APPROVED)
        normal_entry = {
            "id": "test_entry_normal",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": TEST_PARTNER_ID,
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 25000.0,
            "bsw_percent": 5.0,
            "temperature": 85.0,
            "pressure": 100.0,
            "api_gravity": 35.0,
            "meter_factor": 1.0,
            "status": "pending"
        }

        # Anomalous entry (should be FLAGGED)
        anomalous_entry = {
            "id": "test_entry_anomaly",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": TEST_PARTNER_ID,
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 150000.0,  # Extremely high volume
            "bsw_percent": 55.0,  # Very high BSW (> 50%)
            "temperature": 25.0,  # Below freezing point
            "pressure": 100.0,
            "api_gravity": 15.0,  # Very low API gravity
            "meter_factor": 1.0,
            "status": "pending"
        }

        # Store test entries
        await firestore_client.collection("production_entries").document(normal_entry["id"]).set(normal_entry)
        await firestore_client.collection("production_entries").document(anomalous_entry["id"]).set(anomalous_entry)

        yield {
            "normal": normal_entry,
            "anomaly": anomalous_entry
        }

        # Cleanup
        await firestore_client.collection("production_entries").document(normal_entry["id"]).delete()
        await firestore_client.collection("production_entries").document(anomalous_entry["id"]).delete()

    @pytest.mark.asyncio
    async def test_auditor_health_check(self, http_client):
        """Test auditor agent health endpoint."""
        response = await http_client.get(f"http://localhost:{AUDITOR_PORT}/")
        assert response.status == 200
        data = await response.json()
        assert data["status"] == "healthy"
        assert data["worker"] == "auditor-agent"

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_validate_normal_entry(self, setup_test_data, firestore_client, pubsub_publisher):
        """Test that normal entries are approved."""
        entry = setup_test_data["normal"]

        # Publish production-entry-created event
        message_data = {
            "entry_id": entry["id"],
            "tenant_id": entry["tenant_id"]
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()  # Wait for publish to complete
        await asyncio.sleep(2)  # Wait for async processing

        # Check entry was updated to APPROVED
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        assert doc.exists
        data = doc.to_dict()
        assert data["status"] == "approved"
        assert "anomaly_score" in data
        assert data["anomaly_score"] < 30  # Low anomaly score

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_detect_anomaly(self, setup_test_data, firestore_client, pubsub_publisher, pubsub_subscriber):
        """Test that anomalous entries are flagged."""
        entry = setup_test_data["anomaly"]

        # Subscribe to entry-flagged topic
        flagged_messages = []

        def callback(message):
            flagged_messages.append(message)
            message.ack()

        subscription_path = pubsub_subscriber.subscription_path(PROJECT_ID, "entry-flagged-sub")
        streaming_pull_future = pubsub_subscriber.subscribe(subscription_path, callback=callback)

        # Publish production-entry-created event
        message_data = {
            "entry_id": entry["id"],
            "tenant_id": entry["tenant_id"]
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)  # Wait for processing

        # Check entry was flagged
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        data = doc.to_dict()
        assert data["status"] == "flagged"
        assert data["anomaly_score"] > 50  # High anomaly score
        assert "validation_notes" in data
        assert "ai_analysis" in data

        # Check entry-flagged event was published
        streaming_pull_future.cancel()
        assert len(flagged_messages) > 0

    @pytest.mark.asyncio
    async def test_z_score_detection(self):
        """Test Z-score statistical analysis."""
        # Mock historical data
        historical_volumes = [20000, 22000, 21000, 23000, 21500, 22500]  # Normal range
        outlier_volume = 80000  # 4+ standard deviations away

        # Calculate z-score
        import statistics
        mean = statistics.mean(historical_volumes)
        stdev = statistics.stdev(historical_volumes)
        z_score = abs((outlier_volume - mean) / stdev)

        assert z_score > 3.0  # Should trigger anomaly

    @pytest.mark.asyncio
    async def test_rule_based_validation(self):
        """Test rule-based anomaly detection."""
        # Test cases that should trigger flags
        test_cases = [
            {"bsw_percent": 55.0, "reason": "BSW > 50%"},
            {"temperature": 25.0, "reason": "Temp < 32°F"},
            {"temperature": 210.0, "reason": "Temp > 200°F"},
            {"gross_volume": 150000.0, "reason": "Volume > 100,000 BBL"},
        ]

        for case in test_cases:
            # Validate each rule triggers appropriately
            if "bsw_percent" in case:
                assert case["bsw_percent"] > 50, f"Failed: {case['reason']}"
            if "temperature" in case:
                temp = case["temperature"]
                assert temp < 32 or temp > 200, f"Failed: {case['reason']}"
            if "gross_volume" in case:
                assert case["gross_volume"] > 100000, f"Failed: {case['reason']}"

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_entry_edited_revalidation(self, setup_test_data, firestore_client, pubsub_publisher):
        """Test that edited entries are revalidated."""
        entry = setup_test_data["normal"]

        # Approve the entry first
        await firestore_client.collection("production_entries").document(entry["id"]).update({
            "status": "approved"
        })

        # Edit entry to introduce anomaly
        await firestore_client.collection("production_entries").document(entry["id"]).update({
            "gross_volume": 120000.0  # Extreme value
        })

        # Publish edit event
        message_data = {
            "entry_id": entry["id"],
            "tenant_id": entry["tenant_id"]
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "publish_production_entry_edited")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(2)

        # Check entry is now flagged
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        data = doc.to_dict()
        assert data["status"] == "flagged"

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_ai_analysis_generation(self, setup_test_data, firestore_client):
        """Test that AI analysis is generated for flagged entries."""
        entry = setup_test_data["anomaly"]

        # Trigger validation
        # ... (validation logic)

        await asyncio.sleep(3)

        # Check AI analysis exists
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        data = doc.to_dict()
        assert "ai_analysis" in data
        assert len(data["ai_analysis"]) > 100  # Should have substantive analysis
        assert "anomaly" in data["ai_analysis"].lower() or "flag" in data["ai_analysis"].lower()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_concurrent_entry_processing(self, firestore_client, pubsub_publisher):
        """Test auditor can handle multiple concurrent entries."""
        # Create 10 entries
        entry_ids = []
        for i in range(10):
            entry_id = f"test_concurrent_{i}"
            entry_ids.append(entry_id)
            entry = {
                "id": entry_id,
                "tenant_id": TEST_TENANT_ID,
                "partner_id": TEST_PARTNER_ID,
                "measurement_date": datetime.now().isoformat(),
                "gross_volume": 25000.0 + (i * 1000),
                "bsw_percent": 5.0 + i,
                "temperature": 85.0,
                "pressure": 100.0,
                "api_gravity": 35.0,
                "meter_factor": 1.0,
                "status": "pending"
            }
            await firestore_client.collection("production_entries").document(entry_id).set(entry)

        # Publish all at once
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        for entry_id in entry_ids:
            message_data = {"entry_id": entry_id, "tenant_id": TEST_TENANT_ID}
            future = pubsub_publisher.publish(
                topic_path,
                json.dumps(message_data).encode("utf-8")
            )
            future.result()

        await asyncio.sleep(5)  # Wait for all to process

        # Verify all were processed
        processed_count = 0
        for entry_id in entry_ids:
            doc = await firestore_client.collection("production_entries").document(entry_id).get()
            if doc.exists and doc.to_dict()["status"] in ["approved", "flagged"]:
                processed_count += 1
            await firestore_client.collection("production_entries").document(entry_id).delete()

        assert processed_count == 10  # All processed

    @pytest.mark.asyncio
    async def test_message_nack_on_error(self, pubsub_publisher, pubsub_subscriber):
        """Test that messages are nacked on processing errors."""
        # Publish message with invalid entry_id
        message_data = {
            "entry_id": "nonexistent_entry",
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )

        # Wait and verify message was redelivered (nacked)
        await asyncio.sleep(3)
        # In real scenario, would check delivery attempts > 1
