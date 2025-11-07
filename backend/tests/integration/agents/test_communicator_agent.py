"""
Integration tests for Communicator Agent (Notifications & Reporting).

Tests validate:
- Email notification sending
- Anomaly alert emails
- Reconciliation report emails
- Invitation emails
- Entry edit notifications
- User notification preferences
- Email template rendering
- Pub/Sub message routing
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import json

COMMUNICATOR_PORT = 8003
TEST_TENANT_ID = "54a6cb06-0183-4b15-8ff7-77afeaeada3d"
PROJECT_ID = "flowshare-v2"


class TestCommunicatorAgent:
    """Integration tests for Communicator Agent."""

    @pytest.fixture
    async def setup_users(self, firestore_client):
        """Create test users with various notification settings."""
        users = [
            {
                "id": "user_coordinator",
                "email": "coordinator@test.com",
                "role": "coordinator",
                "tenant_id": TEST_TENANT_ID,
                "notification_settings": {
                    "email_alerts": True,
                    "email_reports": True
                }
            },
            {
                "id": "user_partner",
                "email": "partner@test.com",
                "role": "partner",
                "tenant_id": TEST_TENANT_ID,
                "partner_id": "partner_001",
                "notification_settings": {
                    "email_alerts": True,
                    "email_reports": False
                }
            },
            {
                "id": "user_field_operator",
                "email": "operator@test.com",
                "role": "field_operator",
                "tenant_id": TEST_TENANT_ID,
                "notification_settings": {
                    "email_alerts": False,  # Disabled
                    "email_reports": True
                }
            }
        ]

        for user in users:
            await firestore_client.collection("users").document(user["id"]).set(user)

        yield users

        # Cleanup
        for user in users:
            await firestore_client.collection("users").document(user["id"]).delete()

    @pytest.mark.asyncio
    async def test_communicator_health_check(self, http_client):
        """Test communicator agent health endpoint."""
        response = await http_client.get(f"http://localhost:{COMMUNICATOR_PORT}/")
        assert response.status == 200
        data = await response.json()
        assert data["status"] == "healthy"
        assert data["worker"] == "communicator-agent"

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")


    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_anomaly_alert_email(self, mock_send_email, setup_users, firestore_client, pubsub_publisher):
        """Test anomaly alert email is sent to correct recipients."""
        mock_send_email.return_value = {"status": "success"}

        # Create flagged entry
        entry = {
            "id": "test_entry_flagged",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 120000.0,
            "bsw_percent": 55.0,
            "temperature": 25.0,
            "api_gravity": 15.0,
            "status": "flagged",
            "anomaly_score": 85.5,
            "validation_notes": "Multiple extreme values detected"
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Publish entry-flagged event
        message_data = {
            "entry_id": entry["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "entry-flagged")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Verify email was sent
        assert mock_send_email.called
        call_args = mock_send_email.call_args[1]

        # Check recipients (partner, coordinator, admin - NOT field operator due to settings)
        recipients = call_args["to"]
        recipient_emails = [r["email"] for r in recipients]
        assert "partner@test.com" in recipient_emails
        assert "coordinator@test.com" in recipient_emails
        assert "todak2000@gmail.com" in recipient_emails  # Admin CC
        assert "operator@test.com" not in recipient_emails  # Disabled notifications

        # Check email content
        assert "Anomaly Alert" in call_args["subject"] or "Flagged" in call_args["subject"]
        assert str(entry["anomaly_score"]) in call_args["body"]

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")


    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_reconciliation_report_email(self, mock_send_email, setup_users, firestore_client, pubsub_publisher):
        """Test reconciliation report is sent with partner-specific data."""
        mock_send_email.return_value = {"status": "success"}

        # Create reconciliation
        recon = {
            "id": "test_recon_complete",
            "tenant_id": TEST_TENANT_ID,
            "period_start": (datetime.now() - timedelta(days=30)).isoformat(),
            "period_end": datetime.now().isoformat(),
            "terminal_volume": 100000.0,
            "total_allocated": 95000.0,
            "shrinkage": 5000.0,
            "shrinkage_percent": 5.0,
            "status": "completed",
            "allocations": [
                {
                    "partner_id": "partner_001",
                    "partner_name": "Test Partner",
                    "allocated_volume": 50000.0,
                    "percentage": 52.6
                },
                {
                    "partner_id": "partner_002",
                    "partner_name": "Other Partner",
                    "allocated_volume": 45000.0,
                    "percentage": 47.4
                }
            ]
        }
        await firestore_client.collection("reconciliations").document(recon["id"]).set(recon)

        # Publish reconciliation-complete event
        message_data = {
            "reconciliation_id": recon["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "reconciliation-complete")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Verify emails were sent
        assert mock_send_email.called

        # Check that each partner gets their specific data
        # Partner should only see their allocation, not others
        for call in mock_send_email.call_args_list:
            call_args = call[1]
            if "partner@test.com" in [r["email"] for r in call_args["to"]]:
                # Partner email should show their allocation
                assert "50000" in call_args["body"] or "50,000" in call_args["body"]
                # Should not show other partner's data
                assert "45000" not in call_args["body"]

        # Cleanup
        await firestore_client.collection("reconciliations").document(recon["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")


    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_invitation_email(self, mock_send_email, firestore_client, pubsub_publisher):
        """Test invitation email is sent to invitee."""
        mock_send_email.return_value = {"status": "success"}

        # Create invitation
        invitation = {
            "id": "test_invitation_001",
            "tenant_id": TEST_TENANT_ID,
            "tenant_name": "Test Oil Company",
            "inviter_name": "John Coordinator",
            "invitee_email": "newuser@test.com",
            "role": "partner",
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat(),
            "created_at": datetime.now().isoformat()
        }
        await firestore_client.collection("invitations").document(invitation["id"]).set(invitation)

        # Publish invitation-created event
        message_data = {
            "invitation_id": invitation["id"],
            "tenant_id": TEST_TENANT_ID
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "invitation-created")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Verify email was sent
        assert mock_send_email.called
        call_args = mock_send_email.call_args[1]

        # Check recipient
        assert call_args["to"][0]["email"] == "newuser@test.com"

        # Check content
        assert "invitation" in call_args["subject"].lower()
        assert "Test Oil Company" in call_args["body"]
        assert "John Coordinator" in call_args["body"]
        assert "partner" in call_args["body"].lower()

        # Cleanup
        await firestore_client.collection("invitations").document(invitation["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")


    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_entry_edit_notification(self, mock_send_email, setup_users, firestore_client, pubsub_publisher):
        """Test that partners are notified when entries are edited."""
        mock_send_email.return_value = {"status": "success"}

        # Create edited entry
        entry = {
            "id": "test_entry_edited",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": 25000.0,
            "bsw_percent": 5.0,
            "temperature": 85.0,
            "api_gravity": 35.0,
            "status": "approved",
            "edited_by": "user_coordinator",
            "edited_by_name": "John Coordinator",
            "edit_reason": "Corrected measurement error"
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Publish entry-edited event
        message_data = {
            "entry_id": entry["id"],
            "tenant_id": TEST_TENANT_ID,
            "editor_id": "user_coordinator"
        }
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "publish_production_entry_edited")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Verify email was sent
        assert mock_send_email.called
        call_args = mock_send_email.call_args[1]

        # Check partner users are notified (except editor)
        recipients = [r["email"] for r in call_args["to"]]
        assert "partner@test.com" in recipients
        assert "coordinator@test.com" not in recipients  # Editor shouldn't get notification

        # Check content
        assert "edited" in call_args["subject"].lower() or "modified" in call_args["subject"].lower()
        assert "Corrected measurement error" in call_args["body"]

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.asyncio
    async def test_notification_preferences_respected(self, setup_users, firestore_client):
        """Test that user notification preferences are respected."""
        users = setup_users

        # Check preferences
        coordinator = next(u for u in users if u["role"] == "coordinator")
        assert coordinator["notification_settings"]["email_alerts"] is True
        assert coordinator["notification_settings"]["email_reports"] is True

        field_operator = next(u for u in users if u["role"] == "field_operator")
        assert field_operator["notification_settings"]["email_alerts"] is False
        assert field_operator["notification_settings"]["email_reports"] is True

        # Field operator should get reports but not alerts

    @pytest.mark.asyncio
    async def test_message_routing(self, pubsub_publisher, pubsub_subscriber):
        """Test that communicator routes messages to correct handlers."""
        topics = [
            "entry-flagged",
            "reconciliation-complete",
            "invitation-created",
            "publish_production_entry_edited"
        ]

        for topic in topics:
            message_data = {"test": "data", "topic": topic}
            pubsub_publisher.publish(
                topic,
                json.dumps(message_data).encode("utf-8")
            )

        await asyncio.sleep(5)
        # Each should be routed correctly without errors

    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_email_failure_handling(self, mock_send_email, firestore_client, pubsub_publisher):
        """Test graceful handling of email sending failures."""
        mock_send_email.side_effect = Exception("SMTP connection failed")

        # Create flagged entry
        entry = {
            "id": "test_entry_email_fail",
            "tenant_id": TEST_TENANT_ID,
            "partner_id": "partner_001",
            "status": "flagged",
            "anomaly_score": 75.0
        }
        await firestore_client.collection("production_entries").document(entry["id"]).set(entry)

        # Publish event
        message_data = {"entry_id": entry["id"], "tenant_id": TEST_TENANT_ID}
        topic_path = pubsub_publisher.topic_path(PROJECT_ID, "entry-flagged")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(3)

        # Agent should handle failure gracefully (log error, nack message for retry)
        # Verify message was nacked and will be retried

        # Cleanup
        await firestore_client.collection("production_entries").document(entry["id"]).delete()

    @pytest.mark.skip(reason="Pub/Sub emulator streaming pull limitation")


    @pytest.mark.asyncio
    @patch('shared.email.zepto_client.send_email')
    async def test_concurrent_email_sending(self, mock_send_email, firestore_client, pubsub_publisher):
        """Test handling multiple concurrent email notifications."""
        mock_send_email.return_value = {"status": "success"}

        # Create multiple flagged entries
        entry_ids = []
        for i in range(5):
            entry_id = f"test_concurrent_email_{i}"
            entry_ids.append(entry_id)
            entry = {
                "id": entry_id,
                "tenant_id": TEST_TENANT_ID,
                "partner_id": "partner_001",
                "status": "flagged",
                "anomaly_score": 70.0 + i
            }
            await firestore_client.collection("production_entries").document(entry_id).set(entry)

        # Publish all at once
        for entry_id in entry_ids:
            message_data = {"entry_id": entry_id, "tenant_id": TEST_TENANT_ID}
            topic_path = pubsub_publisher.topic_path(PROJECT_ID, "entry-flagged")
        future = pubsub_publisher.publish(
            topic_path,
            json.dumps(message_data).encode("utf-8")
        )
        future.result()

        await asyncio.sleep(5)

        # Verify all emails were sent
        assert mock_send_email.call_count >= 5

        # Cleanup
        for entry_id in entry_ids:
            await firestore_client.collection("production_entries").document(entry_id).delete()
