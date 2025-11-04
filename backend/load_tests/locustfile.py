"""
Load testing suite for FlowShare V2 API using Locust.

Usage:
    # Install: pip install locust

    # Run locally:
    locust -f locustfile.py --host=http://localhost:8000

    # Run headless (for CI/CD):
    locust -f locustfile.py --host=https://api.flowshare.com \
           --users 100 --spawn-rate 10 --run-time 5m --headless \
           --csv=results/load_test --html=results/report.html

    # Run with specific scenario:
    locust -f locustfile.py --host=https://api.flowshare.com \
           CoordinatorUser --users 50 --spawn-rate 5 --run-time 3m

Performance Targets:
    - API P95 latency: < 2000ms
    - Dashboard P95 latency: < 1000ms
    - Production list P95 latency: < 1500ms
    - Error rate: < 0.1%
    - Throughput: > 100 req/s
"""
from locust import HttpUser, task, between, TaskSet, events
import random
import json
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Test configuration
TENANT_ID = "test_tenant_001"
TEST_USER_TOKEN = None  # Set via environment variable
PARTNER_IDS = ["partner_001", "partner_002", "partner_003"]


class CoordinatorTaskSet(TaskSet):
    """Tasks performed by a coordinator user."""

    def on_start(self):
        """Initialize test user with authentication."""
        # In real tests, get token from Firebase Auth
        self.headers = {
            "Authorization": f"Bearer {TEST_USER_TOKEN or 'test_token'}",
            "Content-Type": "application/json"
        }

    @task(10)
    def view_dashboard(self):
        """Load dashboard statistics (most frequent operation)."""
        with self.client.get(
            "/api/dashboard/stats",
            headers=self.headers,
            name="Dashboard Stats",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "total_production" in data:
                    response.success()
                else:
                    response.failure("Missing total_production in response")
            else:
                response.failure(f"Status code: {response.status_code}")

    @task(8)
    def list_production_entries(self):
        """List production entries with pagination."""
        page = random.randint(1, 5)
        params = {
            "tenant_id": TENANT_ID,
            "page": page,
            "page_size": 31
        }

        with self.client.get(
            "/api/production/entries",
            params=params,
            headers=self.headers,
            name="List Production Entries",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "entries" in data and "total" in data:
                    response.success()
                    # Log response size for monitoring
                    response_size_kb = len(response.content) / 1024
                    if response_size_kb > 500:
                        logger.warning(f"Large response: {response_size_kb:.2f} KB")
                else:
                    response.failure("Invalid response structure")
            else:
                response.failure(f"Status code: {response.status_code}")

    @task(5)
    def filter_production_entries(self):
        """Filter production entries by date and status."""
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()

        params = {
            "tenant_id": TENANT_ID,
            "status": random.choice(["pending", "approved", "flagged"]),
            "start_date": start_date,
            "end_date": end_date,
            "page": 1,
            "page_size": 50
        }

        with self.client.get(
            "/api/production/entries",
            params=params,
            headers=self.headers,
            name="Filter Production Entries",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")

    @task(3)
    def get_single_entry(self):
        """Get details of a single production entry."""
        entry_id = f"test_entry_{random.randint(1, 100)}"

        with self.client.get(
            f"/api/production/entries/{entry_id}",
            headers=self.headers,
            name="Get Single Entry",
            catch_response=True
        ) as response:
            # 404 is expected for non-existent entries in load test
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")

    @task(2)
    def create_production_entry(self):
        """Create a new production entry."""
        payload = {
            "tenant_id": TENANT_ID,
            "partner_id": random.choice(PARTNER_IDS),
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": random.uniform(1000, 50000),
            "bsw_percent": random.uniform(0, 25),
            "temperature": random.uniform(60, 120),
            "pressure": random.uniform(50, 200),
            "api_gravity": random.uniform(25, 45),
            "meter_factor": random.uniform(0.98, 1.02)
        }

        with self.client.post(
            "/api/production/entries",
            json=payload,
            headers=self.headers,
            name="Create Production Entry",
            catch_response=True
        ) as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")

    @task(2)
    def view_analytics(self):
        """View analytics trends (requires professional plan)."""
        params = {
            "tenant_id": TENANT_ID,
            "days": 30
        }

        with self.client.get(
            "/api/analytics/trends",
            params=params,
            headers=self.headers,
            name="Analytics Trends",
            catch_response=True
        ) as response:
            # May return 403 if plan doesn't allow analytics
            if response.status_code in [200, 403]:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")

    @task(1)
    def view_reconciliations(self):
        """View reconciliation list."""
        params = {"tenant_id": TENANT_ID}

        with self.client.get(
            "/api/reconciliation/list",
            params=params,
            headers=self.headers,
            name="List Reconciliations",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")


class PartnerTaskSet(TaskSet):
    """Tasks performed by a partner user (more focused on own data)."""

    def on_start(self):
        """Initialize test user."""
        self.headers = {
            "Authorization": f"Bearer {TEST_USER_TOKEN or 'test_token'}",
            "Content-Type": "application/json"
        }
        self.partner_id = random.choice(PARTNER_IDS)

    @task(10)
    def view_own_entries(self):
        """Partners view their own production entries."""
        params = {
            "tenant_id": TENANT_ID,
            "partner_id": self.partner_id,
            "page": 1,
            "page_size": 31
        }

        with self.client.get(
            "/api/production/entries",
            params=params,
            headers=self.headers,
            name="Partner: View Own Entries"
        ) as response:
            pass

    @task(5)
    def view_dashboard(self):
        """Partners check dashboard."""
        with self.client.get(
            "/api/dashboard/stats",
            headers=self.headers,
            name="Partner: Dashboard"
        ) as response:
            pass

    @task(2)
    def create_entry(self):
        """Partners create production entries."""
        payload = {
            "tenant_id": TENANT_ID,
            "partner_id": self.partner_id,
            "measurement_date": datetime.now().isoformat(),
            "gross_volume": random.uniform(1000, 50000),
            "bsw_percent": random.uniform(0, 25),
            "temperature": random.uniform(60, 120),
            "pressure": random.uniform(50, 200),
            "api_gravity": random.uniform(25, 45),
            "meter_factor": random.uniform(0.98, 1.02)
        }

        with self.client.post(
            "/api/production/entries",
            json=payload,
            headers=self.headers,
            name="Partner: Create Entry"
        ) as response:
            pass


class CoordinatorUser(HttpUser):
    """Simulates a coordinator user behavior."""
    tasks = [CoordinatorTaskSet]
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    weight = 3  # Coordinators are 3x more active


class PartnerUser(HttpUser):
    """Simulates a partner user behavior."""
    tasks = [PartnerTaskSet]
    wait_time = between(2, 5)  # Partners check less frequently
    weight = 10  # More partners than coordinators


class HealthCheckUser(HttpUser):
    """Simulates health check monitoring."""
    wait_time = between(10, 15)
    weight = 1

    @task
    def health_check(self):
        """Check API health endpoint."""
        self.client.get("/health", name="Health Check")


# Event hooks for custom metrics
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    """Log slow requests."""
    if response_time > 2000:  # Over 2 seconds
        logger.warning(f"Slow request: {name} took {response_time}ms")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Log test start."""
    logger.info("=" * 60)
    logger.info("FlowShare V2 Load Test Starting")
    logger.info(f"Target: {environment.host}")
    logger.info(f"Users: {environment.runner.target_user_count if hasattr(environment.runner, 'target_user_count') else 'N/A'}")
    logger.info("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Log test completion and summary."""
    logger.info("=" * 60)
    logger.info("FlowShare V2 Load Test Completed")

    stats = environment.stats
    logger.info(f"Total Requests: {stats.total.num_requests}")
    logger.info(f"Failures: {stats.total.num_failures}")
    logger.info(f"Median Response Time: {stats.total.median_response_time}ms")
    logger.info(f"95th Percentile: {stats.total.get_response_time_percentile(0.95)}ms")
    logger.info(f"RPS: {stats.total.current_rps:.2f}")
    logger.info("=" * 60)
