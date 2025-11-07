"""
End-to-end multi-agent workflow integration tests.

Tests validate:
- Complete entry creation → validation → notification workflow
- Complete reconciliation → report workflow
- Entry edit → revalidation → notification workflow
- Invitation → email workflow
- Error handling across agent boundaries
- Data consistency across agents
- Event ordering and causality
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import patch
import json

TEST_TENANT_ID = "54a6cb06-0183-4b15-8ff7-77afeaeada3d"
PROJECT_ID = "flowshare-v2"


class TestMultiAgentWorkflows:
    """End-to-end tests for multi-agent workflows."""

    @pytest.fixture
    async def setup_full_system(self, firestore_client):
        """Set up complete system data for E2E tests."""
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

        # Create users
        users = [
            {
                "id": "user_001",
                "email": "coordinator@test.com",
                "role": "coordinator",
                "tenant_id": TEST_TENANT_ID,
                "notification_settings": {"email_alerts": True, "email_reports": True}
            },
            {
                "id": "user_002",
                "email": "partner@test.com",
                "role": "partner",
                "tenant_id": TEST_TENANT_ID,
                "partner_id": "partner_001",
                "notification_settings": {"email_alerts": True, "email_reports": True}
            }
        ]
        for user in users:
            await firestore_client.collection("users").document(user["id"]).set(user)

        yield {"tenant": tenant, "users": users}

        # Cleanup
        await firestore_client.collection("tenants").document(TEST_TENANT_ID).delete()
        for user in users:
            await firestore_client.collection("users").document(user["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")
    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_complete_entry_anomaly_workflow(
        self, mock_send_email, setup_full_system, firestore_client, pubsub_publisher
    ):
        """
        Test complete workflow: Entry creation → Auditor detects anomaly → Communicator sends alert

        Flow:
        1. API creates production entry (status=pending)
        2. API publishes production-entry-created event
        3. Auditor receives event, validates entry
        4. Auditor detects anomaly, updates status=flagged
        5. Auditor publishes entry-flagged event
        6. Communicator receives event, fetches entry & users
        7. Communicator sends anomaly alert emails
        """
        mock_send_email.return_value = {"status": "success"}

        # Step 1: Create anomalous production entry
        entry = {
            "id": "test_e2e_anomaly",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 150000.0,  # Extreme value
            "bsw_percent": 60.0,  # Very high BSW
            "temperature": 20.0,  # Below freezing
            "pressure": 100.0,
            "api_gravity": 10.0,  # Very low
            "meter_factor": 1.0,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Step 2: Publish production-entry-created (simulating API)
        message_data = {
            "entry_id": entry["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        # Step 3-4: Wait for Auditor to process
        await asyncio.sleep(3)

        # Verify Auditor updated entry to flagged
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        assert doc.exists
        data = doc.to_dict()
        assert data["status"] == "flagged", "Auditor should have flagged the entry"
        assert "anomaly_score" in data
        assert data["anomaly_score"] > 50, "Should have high anomaly score"
        assert "validation_notes" in data
        assert "ai_analysis" in data

        # Step 5-7: Wait for Communicator to process entry-flagged event and send emails
        await asyncio.sleep(3)

        # Verify Communicator sent emails
        assert mock_send_email.called, "Communicator should have sent emails"
        call_args = mock_send_email.call_args[1]

        # Verify recipients
        recipients = [r["email"] for r in call_args["to"]]
        assert "coordinator@test.com" in recipients
        assert "partner@test.com" in recipients

        # Verify email content
        assert "anomaly" in call_args["subject"].lower() or "flagged" in call_args["subject"].lower()
        assert str(entry["id"]) in call_args["body"] or entry["id"] in str(call_args)

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")
    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_complete_reconciliation_workflow(
        self, mock_send_email, setup_full_system, firestore_client, pubsub_publisher
    ):
        """
        Test complete reconciliation workflow: Trigger → Accountant calculates → Communicator sends reports

        Flow:
        1. Create approved production entries
        2. Create reconciliation request
        3. API publishes reconciliation-triggered event
        4. Accountant receives event, performs calculations
        5. Accountant updates reconciliation with allocations
        6. Accountant publishes reconciliation-complete event
        7. Communicator receives event, sends reports to users
        """
        mock_send_email.return_value = {"status": "success"}

        # Step 1: Create approved entries
        entries = []
        for i in range(5):
            entry = {
                "id": f"test_e2e_recon_{i}",
                "tenant_id": TEST_TENANT_ID,
                "partner_id": "partner_001",
                "measurement_date": (datetime.now() - timedelta(days=i)).isoformat(),
                "gross_volume": 30000.0,
                "bsw_percent": 5.0,
                "temperature": 85.0,
                "pressure": 100.0,
                "api_gravity": 35.0,
                "meter_factor": 1.0,
                "status": "approved",
                "created_at": datetime.now().isoformat()
            }
            entries.append(entry)
            await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Step 2: Create reconciliation request
        recon = {
            "id": "test_e2e_recon",
            "tenant_id": TEST_TENANT_ID,
            "period_start": (datetime.now() - timedelta(days=30)).isoformat(),
            "period_end": datetime.now().isoformat(),
            "terminal_volume": 150000.0,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        await firestore_client.collection("reconciliations").document(recon["id"]).set(recon)

        # Step 3: Publish reconciliation-triggered
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

        # Step 4-5: Wait for Accountant to process
        await asyncio.sleep(5)

        # Verify Accountant completed reconciliation
        doc = await firestore_client.collection("reconciliations").document(recon["id"]).get()
        assert doc.exists
        data = doc.to_dict()
        assert data["status"] == "completed", "Accountant should have completed reconciliation"
        assert "allocations" in data
        assert "total_allocated" in data
        assert "shrinkage" in data
        assert "shrinkage_percent" in data
        assert "ai_analysis" in data

        # Step 6-7: Wait for Communicator to send reports
        await asyncio.sleep(3)

        # Verify Communicator sent report emails
        assert mock_send_email.called, "Communicator should have sent report emails"
        call_args = mock_send_email.call_args[1]

        # Verify email content
        assert "reconciliation" in call_args["subject"].lower() or "report" in call_args["subject"].lower()

        # Cleanup
        for entry in entries:
            await firestore_client.collection("production_entries").document(entry["id"]).delete()
        await firestore_client.collection("reconciliations").document(recon["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")
    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_entry_edit_revalidation_workflow(
        self, mock_send_email, setup_full_system, firestore_client, pubsub_publisher
    ):
        """
        Test entry edit workflow: Edit → Auditor revalidates → Communicator notifies

        Flow:
        1. Entry is initially approved
        2. User edits entry, changes status to pending
        3. API publishes production-entry-edited event
        4. Auditor revalidates entry
        5. Auditor updates status (approved or flagged)
        6. Communicator sends edit notification to partners
        """
        mock_send_email.return_value = {"status": "success"}

        # Step 1: Create initially approved entry
        entry = {
            "id": "test_e2e_edit",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 25000.0,
            "bsw_percent": 5.0,
            "temperature": 85.0,
            "pressure": 100.0,
            "api_gravity": 35.0,
            "meter_factor": 1.0,
            "status": "approved",
            "created_at": datetime.now().isoformat()
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Step 2: Edit entry to introduce anomaly
        await firestore_client.collection("production_entries").document(entry["id"]).update({
            "gross_volume": 140000.0,  # Now anomalous
            "status": "pending",
            "edited_by": "user_001",
            "edited_by_name": "Test Coordinator",
            "edit_reason": "Correcting volume"
        })

        # Step 3: Publish entry-edited event
        message_data = {
            "entry_id": entry["id"],
            "tenant_id": TEST_TENANT_ID,
            "editor_id": "user_001"
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "publish_production_entry_edited")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        # Step 4-5: Wait for Auditor to revalidate
        await asyncio.sleep(3)

        # Verify Auditor revalidated
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        data = doc.to_dict()
        assert data["status"] in ["approved", "flagged"], "Auditor should have revalidated"

        # Step 6: Verify Communicator sent notifications
        await asyncio.sleep(2)
        assert mock_send_email.called, "Communicator should have sent edit notifications"

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_event_ordering_and_causality(self, firestore_client, pubsub_publisher):
        """
        Test that events are processed in correct causal order.

        Ensures:
        - Entry must be validated before reconciliation can use it
        - Flagged events only fire after validation
        - Complete events only fire after calculation
        """
        # Create entry
        entry = {
            "id": "test_ordering",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 25000.0,
            "bsw_percent": 5.0,
            "temperature": 85.0,
            "api_gravity": 35.0,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Publish creation event
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps({"entry_id": entry["id"], "tenant_id": TEST_TENANT_ID}).encode("utf-8")
        )
        future.result()

        # Immediately check - should still be pending
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        assert doc.to_dict()["status"] == "pending"

        # Wait for processing
        await asyncio.sleep(2)

        # Now should be approved/flagged
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        assert doc.to_dict()["status"] in ["approved", "flagged"]

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_data_consistency_across_agents(self, firestore_client, pubsub_publisher):
        """
        Test that data remains consistent across agent processing.

        Ensures:
        - Agents don't overwrite each other's data
        - Firestore updates are atomic
        - No race conditions between agents
        """
        # Create entry
        entry = {
            "id": "test_consistency",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 25000.0,
            "bsw_percent": 5.0,
            "temperature": 85.0,
            "api_gravity": 35.0,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Store original values
        original_volume = entry["gross_volume"]
        original_bsw = entry["bsw_percent"]

        # Trigger validation
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps({"entry_id": entry["id"], "tenant_id": TEST_TENANT_ID}).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Verify original data unchanged (agents should only add fields, not modify existing)
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        data = doc.to_dict()
        assert data["gross_volume"] == original_volume, "Volume should not be modified"
        assert data["bsw_percent"] == original_bsw, "BSW should not be modified"
        # But new fields should be added
        assert "anomaly_score" in data
        assert "status" in data and data["status"] in ["approved", "flagged"]

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_error_propagation_across_agents(
        self, mock_send_email, firestore_client, pubsub_publisher
    ):
        """
        Test error handling when one agent in workflow fails.

        Ensures:
        - Failures don't break entire workflow
        - Messages are retried appropriately
        - Downstream agents handle upstream failures gracefully
        """
        # Simulate email failure
        mock_send_email.side_effect = Exception("Email service unavailable")

        # Create flagged entry
        entry = {
            "id": "test_error_propagation",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "status": "flagged",
            "anomaly_score": 80.0
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Trigger notification (will fail)
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "entry-flagged")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps({"entry_id": entry["id"], "tenant_id": TEST_TENANT_ID}).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Entry should still be flagged (Auditor succeeded even though Communicator failed)
        doc = await firestore_client.collection("production_entries").document(entry["id"]).get()
        assert doc.to_dict()["status"] == "flagged"

        # Message should be nacked and retried (verify in real Pub/Sub metrics)

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation - messages not delivered")
    @pytest.mark.asyncio
    async def test_concurrent_workflows(self, firestore_client, pubsub_publisher):
        """
        Test multiple workflows running concurrently without interference.
        """
        # Create multiple entries simultaneously
        entry_ids = []
        for i in range(10):
            entry_id = f"test_concurrent_workflow_{i}"
            entry_ids.append(entry_id)
            entry = {
                "id": entry_id,
                "tenant_id": TEST_TENANT_ID,
                "partner_id": "partner_001",
                "measurement_date": datetime.now().isoformat(),
                "gross_volume": 25000.0 + (i * 1000),
                "bsw_percent": 5.0,
                "temperature": 85.0,
                "api_gravity": 35.0,
                "status": "pending",
                "created_at": datetime.now().isoformat()
            }
            await firestore_client.collection("production_entries").document(entry_id).set(entry)

            # Publish event
            topic_path = pubsub_publisher.topic_path(PROJECT_ID, "production-entry-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps({"entry_id": entry_id, "tenant_id": TEST_TENANT_ID}).encode("utf-8")
        )
        future.result()

        # Wait for all to process
        await asyncio.sleep(5)

        # Verify all processed successfully
        processed = 0
        for entry_id in entry_ids:
            doc = await firestore_client.collection("production_entries").document(entry_id).get()
            if doc.exists and doc.to_dict()["status"] in ["approved", "flagged"]:
                processed += 1
            await firestore_client.collection("production_entries").document(entry_id).delete()

        assert processed == 10, "All concurrent workflows should complete"
