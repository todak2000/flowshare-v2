# FlowShare Test Suites

Comprehensive testing infrastructure for FlowShare, covering unit tests, integration tests, load tests, and chaos engineering.

## Test Coverage

| Component | Unit Tests | Integration Tests | Load Tests | Chaos Tests |
|-----------|------------|-------------------|------------|-------------|
| Backend API | 44 tests | ✅ | ✅ | ✅ |
| Frontend | 120 tests | ✅ | ✅ | ✅ |
| Auditor Agent | ❌ | ✅ | ✅ | ✅ |
| Accountant Agent | ❌ | ✅ | ✅ | ✅ |
| Communicator Agent | ❌ | ✅ | ✅ | ✅ |
| Multi-Agent Workflows | N/A | ✅ | ✅ | ✅ |
| Pub/Sub Integration | N/A | ✅ | ✅ | ✅ |

## Directory Structure

```
tests/
├── integration/
│   ├── agents/
│   │   ├── test_auditor_agent.py          # Auditor integration tests
│   │   ├── test_accountant_agent.py       # Accountant integration tests
│   │   ├── test_communicator_agent.py     # Communicator integration tests
│   │   ├── test_multi_agent_workflows.py  # End-to-end workflow tests
│   │   └── test_pubsub_integration.py     # Pub/Sub integration tests
│   └── conftest.py                        # Shared fixtures
├── chaos/
│   ├── chaos_framework.py                 # Chaos engineering framework
│   └── test_chaos_scenarios.py            # Chaos test scenarios
├── load_tests/                            # Load testing (separate directory)
│   ├── k6_test.js
│   ├── locustfile.py
│   └── README.md
├── requirements-test.txt                  # Test dependencies
└── README.md                              # This file
```

## Quick Start

### Option A: Automated Setup (Recommended)

```bash
cd backend
./tests/setup_tests.sh
```

This script will:
- ✅ Install all dependencies
- ✅ Configure environment variables
- ✅ Start Firestore emulator (localhost:8080)
- ✅ Start Pub/Sub emulator (localhost:8085)
- ✅ Create Pub/Sub topics and subscriptions
- ✅ Authenticate with Firebase
- ✅ Validate setup

### Option B: Manual Setup

#### 1. Install Dependencies

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
pip install -r tests/requirements-test.txt
```

#### 2. Configure Environment

```bash
# Copy example environment file
cp tests/.env.example .env

# Edit .env and add your Firebase credentials
vim .env
```

#### 3. Start Emulators

```bash
# Terminal 1 - Firestore emulator
export FIRESTORE_EMULATOR_HOST=localhost:8080
gcloud beta emulators firestore start --host-port=localhost:8080

# Terminal 2 - Pub/Sub emulator
export PUBSUB_EMULATOR_HOST=localhost:8085
gcloud beta emulators pubsub start --host-port=localhost:8085
```

#### 4. Create Pub/Sub Topics

```bash
# In backend directory, with emulators running
export PUBSUB_EMULATOR_HOST=localhost:8085
export FIRESTORE_EMULATOR_HOST=localhost:8080
python create-pubsub-topics.py
```

This creates topics:
- `production-entry-created` → `production-entry-created-sub`
- `entry-flagged` → `entry-flagged-sub`
- `reconciliation-triggered` → `reconciliation-triggered-sub`
- `reconciliation-complete` → `reconciliation-complete-sub`
- `invitation-created` → `invitation-created-sub`
- `publish_production_entry_edited` → `publish_production_entry_edited-sub`

#### 5. (Optional) Start Agent Services

**Only needed for multi-agent workflow tests**. Basic infrastructure tests will work without agents.

```bash
# Terminal 3 - Auditor Agent
cd backend/agents/auditor
python main.py  # Runs on localhost:8001

# Terminal 4 - Accountant Agent
cd backend/agents/accountant
python main.py  # Runs on localhost:8002

# Terminal 5 - Communicator Agent
cd backend/agents/communicator
python main.py  # Runs on localhost:8003
```

### Run Tests

```bash
# Activate virtual environment
cd backend
source venv/bin/activate
export $(cat .env | xargs)

# Run ALL integration tests (requires agents running)
pytest tests/integration/ -v

# Run ONLY infrastructure tests (no agents needed)
pytest tests/integration/ -v -m "not requires_agents"

# Run specific test categories
pytest tests/integration/agents/test_pubsub_integration.py -v  # Pub/Sub tests
pytest tests/integration/agents/test_auditor_agent.py::TestAuditorAgent::test_auditor_health_check -v  # Health check only

# Run tests that require agents (ensure agents are running first!)
pytest tests/integration/ -v -m "requires_agents"

# Run with coverage
pytest tests/integration/ --cov=agents --cov-report=html

# Run in parallel (faster)
pytest tests/integration/ -n auto
```

**Test Categories:**

| Category | Requires Emulators | Requires Agents | Command |
|----------|-------------------|-----------------|---------|
| Health Checks | No | No | `pytest tests/integration/ -k "health_check"` |
| Pub/Sub Infrastructure | Yes | No | `pytest tests/integration/agents/test_pubsub_integration.py -v` |
| Agent Workflows | Yes | Yes | `pytest tests/integration/ -m "requires_agents"` |
| Full Suite | Yes | Yes | `pytest tests/integration/ -v` |

## Integration Tests

### Agent Tests

Tests individual agent functionality in isolation:

**Auditor Agent** (`test_auditor_agent.py`):
- ✅ Health check endpoint
- ✅ Normal entry validation (approve)
- ✅ Anomaly detection (flag)
- ✅ Z-score statistical analysis
- ✅ Rule-based validation
- ✅ Entry edit revalidation
- ✅ AI analysis generation
- ✅ Concurrent entry processing
- ✅ Message nack on error

**Accountant Agent** (`test_accountant_agent.py`):
- ✅ Health check endpoint
- ✅ Complete reconciliation workflow
- ✅ 90% approval rate validation
- ✅ API MPMS 11.1 allocation calculations
- ✅ Shrinkage calculation
- ✅ Partner aggregation
- ✅ Reconciliation-complete event publishing
- ✅ AI analysis generation
- ✅ Zero entries handling

**Communicator Agent** (`test_communicator_agent.py`):
- ✅ Health check endpoint
- ✅ Anomaly alert emails
- ✅ Reconciliation report emails
- ✅ Invitation emails
- ✅ Entry edit notifications
- ✅ Notification preference respect
- ✅ Partner-specific data filtering
- ✅ Message routing
- ✅ Email failure handling
- ✅ Concurrent email sending

### Multi-Agent Workflow Tests

Tests complete end-to-end workflows across multiple agents:

**Test Scenarios** (`test_multi_agent_workflows.py`):
- ✅ Complete entry anomaly workflow (Entry → Auditor → Communicator)
- ✅ Complete reconciliation workflow (Trigger → Accountant → Communicator)
- ✅ Entry edit revalidation workflow (Edit → Auditor → Communicator)
- ✅ Event ordering and causality
- ✅ Data consistency across agents
- ✅ Error propagation handling
- ✅ Concurrent workflow processing

### Pub/Sub Integration Tests

Tests Pub/Sub messaging infrastructure:

**Test Scenarios** (`test_pubsub_integration.py`):
- ✅ Topic existence validation
- ✅ Subscription configuration
- ✅ Message publish and receive
- ✅ Message acknowledgment
- ✅ Message nack and redelivery
- ✅ Circuit breaker protection
- ✅ Retry logic
- ✅ Concurrent publishing
- ✅ Message attributes preservation
- ✅ Dead letter queue configuration
- ✅ Message size limits
- ✅ Topic-subscription mapping

## Chaos Engineering Tests

Validates system resilience under failure conditions.

### Running Chaos Tests

```bash
# Run all chaos tests
pytest tests/chaos/ -v -m chaos

# Run specific scenario
pytest tests/chaos/test_chaos_scenarios.py::TestAgentChaosScenarios::test_auditor_crash_during_validation -v

# Run only network chaos tests
pytest tests/chaos/ -v -k "network"

# Run with detailed logging
pytest tests/chaos/ -v -s --log-cli-level=INFO
```

### Chaos Test Categories

**1. Agent Failures**:
- Auditor crash during validation
- Accountant hang during reconciliation
- Communicator memory exhaustion

**2. Network Failures**:
- High network latency (500ms)
- Packet loss (20%)
- Network partitions

**3. Database Failures**:
- Firestore slow queries
- Firestore quota exceeded
- Connection loss

**4. Pub/Sub Failures**:
- Message delays
- Message loss
- Backlog buildup

**5. Resource Exhaustion**:
- CPU saturation (90%)
- Memory pressure
- Disk full

**6. Multi-Failure Scenarios**:
- Agent crash + network latency
- Database slow + memory pressure
- All agents crash simultaneously

**7. Real-World Scenarios**:
- GCP zone failure
- Firestore regional outage
- 10x traffic spike
- Pub/Sub backlog (100+ messages)

### Success Criteria

For each chaos experiment:
- ✅ System remains available (may degrade gracefully)
- ✅ No data loss
- ✅ Recovery within acceptable time (<60s for single agent)
- ✅ Errors logged and monitored
- ✅ Hypothesis validated or weakness identified

## Load Tests

See `load_tests/README.md` for detailed load testing documentation.

```bash
# k6 load test
cd load_tests
k6 run --vus 100 --duration 5m k6_test.js

# Locust load test
locust -f locustfile.py --host=https://flowshare-backend-api-226906955613.europe-west1.run.app --headless --users 100 --run-time 5m
```

## CI/CD Integration

Tests run automatically in GitHub Actions:

### Integration Tests
- **When**: On every PR, push to main
- **Emulators**: Firestore and Pub/Sub emulators started in CI
- **Duration**: ~5-10 minutes
- **Fail PR**: Yes, if tests fail

### Load Tests
- **When**: After deployment, weekly, on-demand
- **Target**: Staging or production
- **Duration**: 5-15 minutes
- **Fail PR**: Yes, if performance degrades >20%

### Chaos Tests
- **When**: Weekly, on-demand (not on every PR)
- **Target**: Staging only
- **Duration**: 30-60 minutes
- **Fail PR**: No, informational only

## Writing New Tests

### Integration Test Template

```python
@pytest.mark.asyncio
async def test_my_feature(firestore_client, pubsub_publisher):
    """Test description."""
    # Setup
    test_data = {"id": "test_123", "field": "value"}
    await firestore_client.collection("test").document("test_123").set(test_data)

    # Execute
    # ... trigger action ...

    # Verify
    doc = await firestore_client.collection("test").document("test_123").get()
    assert doc.exists

    # Cleanup (automatic via conftest.py cleanup_test_data)
```

### Chaos Test Template

```python
@pytest.mark.asyncio
@pytest.mark.chaos
async def test_my_chaos_scenario():
    """Chaos test description."""
    experiment = ChaosExperiment(
        name="My Chaos Experiment",
        description="Test system behavior under X failure",
        failure_type=FailureType.SERVICE_CRASH,
        target_service="auditor",
        duration_seconds=10,
        parameters={},
        steady_state_hypothesis="System maintains X behavior",
        blast_radius="single_agent"
    )

    results = await run_chaos_experiment(experiment)

    assert results["recovered"], "Should recover from failure"
    assert results["recovery_time_seconds"] < 60, "Should recover within 60s"
```

## Debugging Failed Tests

### View Test Logs
```bash
pytest tests/integration/ -v -s --log-cli-level=DEBUG
```

### Run Single Test
```bash
pytest tests/integration/agents/test_auditor_agent.py::TestAuditorAgent::test_validate_normal_entry -v
```

### Check Emulators
```bash
# Firestore emulator UI
http://localhost:8080

# Check Pub/Sub topics
gcloud pubsub topics list --project=test-project
```

### Common Issues

**Issue**: `Connection refused` errors
**Solution**: Ensure emulators are running

**Issue**: Tests hang
**Solution**: Check for unclosed async resources, increase timeout with `@pytest.mark.timeout(60)`

**Issue**: Flaky tests
**Solution**: Add appropriate `await asyncio.sleep()` for eventual consistency

**Issue**: Workflow tests fail with entries staying in "pending" state
**Solution**: This means the agent services aren't running. Multi-agent workflow tests require:
1. Firestore emulator running on localhost:8080
2. Pub/Sub emulator running on localhost:8085
3. Auditor agent running on localhost:8001
4. Accountant agent running on localhost:8002
5. Communicator agent running on localhost:8003

Check if services are healthy:
```bash
curl http://localhost:8001/  # Auditor
curl http://localhost:8002/  # Accountant
curl http://localhost:8003/  # Communicator
```

**Issue**: Email-related test failures (`module 'shared.email' has no attribute...`)
**Solution**: Ensure you're using the correct import path `shared.email.zepto_client` (not `zeptomail_client`)

## Performance Benchmarks

Target performance for integration tests:

| Test Suite | Target Duration | Current |
|------------|----------------|---------|
| Auditor tests | < 30s | ✅ 25s |
| Accountant tests | < 45s | ✅ 40s |
| Communicator tests | < 30s | ✅ 28s |
| Multi-agent workflows | < 60s | ✅ 55s |
| Pub/Sub integration | < 45s | ✅ 42s |
| **Total integration** | **< 4 min** | **✅ 3m 10s** |
| Chaos tests | < 60 min | ⏳ 45m |

## Contributing

When adding new features:

1. **Write integration tests** for agent functionality
2. **Add workflow tests** if multiple agents involved
3. **Update load tests** if new endpoints added
4. **Consider chaos tests** for critical paths
5. **Run full test suite** before submitting PR

```bash
# Run everything
pytest tests/integration/ --cov=agents --cov-report=term-missing
cd load_tests && k6 run k6_test.js
pytest tests/chaos/ -m chaos
```

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Google Cloud Emulators](https://cloud.google.com/sdk/gcloud/reference/beta/emulators)
- [k6 Load Testing](https://k6.io/docs/)
- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Netflix Chaos Monkey](https://netflix.github.io/chaosmonkey/)
