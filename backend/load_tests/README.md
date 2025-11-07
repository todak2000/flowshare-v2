# Load Testing Suite

This directory contains load testing infrastructure for FlowShare V2 API.

## Quick Start

### Option 1: k6 (Recommended)

```bash
# Install k6
brew install k6  # macOS
sudo apt install k6  # Ubuntu

# Set environment
export BASE_URL="https://api.flowshare.com"
export TEST_TOKEN="your_firebase_token"
export TENANT_ID="your_tenant_id"

# Run smoke test (1 user, 30 seconds)
k6 run --vus 1 --duration 30s k6_test.js

# Run load test (100 users, 5 minutes)
k6 run --vus 100 --duration 5m k6_test.js

# Run with stages
k6 run --stage 1m:10,3m:50,2m:100 k6_test.js
```

### Option 2: Locust

```bash
# Install
pip install -r requirements.txt

# Run with web UI
locust -f load_tests/locustfile.py --host=http://localhost:8000

# Run headless
locust -f locustfile.py --host=https://api.flowshare.com \
       --users 100 --spawn-rate 10 --run-time 5m --headless
```

## Files

- `k6_test.js` - k6 load test (modern, fast, Go-based)
- `locustfile.py` - Locust load test (Python, has web UI)
- `requirements.txt` - Python dependencies for Locust
- `results/` - Test results output directory (auto-created)

## Test Scenarios

### Smoke Test
Verify basic functionality with minimal load.
```bash
k6 run --vus 1 --duration 30s k6_test.js
```

### Load Test
Test typical production load.
```bash
k6 run --vus 50 --duration 5m k6_test.js
```

### Stress Test
Find breaking point.
```bash
k6 run --vus 200 --duration 10m k6_test.js
```

### Spike Test
Test sudden traffic surge.
```bash
k6 run --stage 1m:10,30s:200,2m:10 k6_test.js
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| P95 Latency | < 2000ms | < 5000ms |
| P99 Latency | < 5000ms | < 10000ms |
| Error Rate | < 1% | < 5% |
| RPS | > 100 | > 50 |

## CI/CD Integration

Tests run automatically:
- After every deployment to staging/production
- Weekly (every Monday at 2 AM UTC)
- On-demand via GitHub Actions

Trigger manually:
1. Go to GitHub Actions
2. Select "Load Testing" workflow
3. Click "Run workflow"
4. Choose environment and parameters

## Analyzing Results

### k6 Results

Output files:
- `results/k6-results.json` - Raw metrics
- `results/k6-summary.json` - Summary statistics
- `summary.html` - HTML report

Key metrics to check:
```json
{
  "http_req_duration": {
    "values": {
      "avg": 521.5,      // Average latency
      "p(95)": 1847.2,   // 95th percentile
      "p(99)": 3124.8    // 99th percentile
    }
  },
  "http_req_failed": {
    "values": {
      "rate": 0.0008     // Error rate (0.08%)
    }
  }
}
```

### Locust Results

Output files:
- `results/locust_stats.csv` - Request statistics
- `results/locust_failures.csv` - Failure details
- `results/locust-report.html` - HTML report with charts

View live during test: http://localhost:8089

## Troubleshooting

### High Error Rates

Check:
1. API endpoints are accessible
2. Authentication token is valid
3. Test data (tenant_id, partner_ids) exists
4. Firestore has sufficient quota

### Slow Response Times

Check:
1. Cloud Run instances are scaling up
2. Firestore indexes are created
3. Cache is working (check logs)
4. Network latency from test machine

### Connection Errors

Check:
1. Firewall/VPC settings
2. Cloud Run ingress settings (should be "all")
3. Service account permissions
4. Network connectivity

## Best Practices

1. **Always start with smoke test** (1 user, 30s) to verify setup
2. **Test against staging first** before hitting production
3. **Gradually increase load** (use stages)
4. **Monitor during tests** (Cloud Console, logs)
5. **Run during low-traffic hours** to avoid impacting users
6. **Keep test duration reasonable** (5-15 minutes typical)
7. **Document test results** in `docs/SCALABILITY_AND_LOAD_TESTING.md`

## Example Test Session

```bash
# 1. Set environment
export BASE_URL="https://staging-api.flowshare.com"
export TEST_TOKEN="your_token_here"
export TENANT_ID="test_tenant_001"

# 2. Smoke test (verify everything works)
k6 run --vus 1 --duration 30s k6_test.js

# 3. Load test (typical production load)
k6 run --vus 50 --duration 5m k6_test.js

# 4. Stress test (find limits)
k6 run --vus 100 --duration 10m k6_test.js

# 5. Analyze results
cat results/k6-summary.json | jq '.metrics.http_req_duration.values'
```

## Getting Test Credentials

```bash
# Get Firebase auth token (for testing)
# Option 1: From Firebase Console
# 1. Go to Firebase Console > Authentication
# 2. Create test user
# 3. Use custom token or get ID token from SDK

# Option 2: Using Firebase CLI
firebase login:ci

# Option 3: From your app (copy from dev tools)
# Login to app > Dev Tools > Application > Local Storage > firebase:authUser
```

## Resources

- k6 Documentation: https://k6.io/docs/
- Locust Documentation: https://docs.locust.io/
- Full scalability docs: `../../docs/SCALABILITY_AND_LOAD_TESTING.md`
- Performance optimization: `../../docs/PERFORMANCE_OPTIMIZATIONS.md`
- Resilience improvements: `../../docs/RESILIENCE_IMPROVEMENTS.md`
