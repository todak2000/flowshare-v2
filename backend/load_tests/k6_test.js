/**
 * k6 Load Test for FlowShare API
 *
 * k6 is a modern, fast load testing tool written in Go.
 *
 * Installation:
 *   brew install k6  (macOS)
 *   sudo apt install k6  (Ubuntu)
 *
 * Usage (Recommended - uses auth_helper.py automatically):
 *   # Smoke test (verify functionality)
 *   ./run_k6.sh --vus 1 --duration 30s
 *
 *   # Load test (normal traffic)
 *   ./run_k6.sh --vus 50 --duration 5m
 *
 *   # Stress test (find breaking point)
 *   ./run_k6.sh --vus 100 --duration 10m
 *
 *   # Test against production
 *   BASE_URL=https://flowshare-backend-api-226906955613.europe-west1.run.app ./run_k6.sh --vus 50 --duration 5m
 *
 * Manual Usage (if you have tokens already):
 *   export TEST_TOKEN="your_firebase_token"
 *   export TENANT_ID="your_tenant_id"
 *   k6 run --vus 50 --duration 5m k6_test.js
 *
 * Performance Thresholds:
 *   - HTTP errors < 1%
 *   - P95 latency < 2000ms
 *   - P99 latency < 5000ms
 *   - Average latency < 1000ms
 *
 * Note:
 *   This script requires TEST_TOKEN and TENANT_ID environment variables.
 *   Use the run_k6.sh wrapper script for automatic authentication.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const TEST_TOKEN = __ENV.TEST_TOKEN || '';
const TENANT_ID = __ENV.TENANT_ID || '';

// Validate required environment variables
if (!TEST_TOKEN) {
  console.error('❌ ERROR: TEST_TOKEN environment variable is required');
  console.error('');
  console.error('Recommended: Use the run_k6.sh wrapper script for automatic authentication:');
  console.error('   ./run_k6.sh --vus 50 --duration 5m');
  console.error('');
  console.error('Or manually export the token:');
  console.error('   export TEST_TOKEN="your_firebase_id_token"');
  throw new Error('TEST_TOKEN is required');
}

if (!TENANT_ID) {
  console.error('❌ ERROR: TENANT_ID environment variable is required');
  console.error('');
  console.error('Recommended: Use the run_k6.sh wrapper script:');
  console.error('   ./run_k6.sh --vus 50 --duration 5m');
  console.error('');
  console.error('Or manually export the tenant ID:');
  console.error('   export TENANT_ID="your_tenant_id"');
  throw new Error('TENANT_ID is required');
}

// Custom metrics
const errorRate = new Rate('errors');
const dashboardTrend = new Trend('dashboard_duration');
const productionListTrend = new Trend('production_list_duration');
const entryCreationTrend = new Trend('entry_creation_duration');
const largeResponseCounter = new Counter('large_responses');

// Test configuration
export const options = {
  // Stages define the load pattern
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Spike to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],

  // Performance thresholds (test fails if not met)
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],  // 95% < 2s, 99% < 5s
    'http_req_duration{name:Dashboard}': ['p(95)<1000'], // Dashboard: 95% < 1s
    'http_req_duration{name:ProductionList}': ['p(95)<1500'], // List: 95% < 1.5s
    'http_req_failed': ['rate<0.01'],  // Error rate < 1%
    'errors': ['rate<0.01'],           // Custom error rate < 1%
  },

  // Summary export
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Test data
const PARTNER_IDS = ['partner_001', 'partner_002', 'partner_003'];
const STATUSES = ['pending', 'approved', 'flagged'];

// Request headers
function getHeaders() {
  return {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// Generate random production entry
function generateProductionEntry() {
  return {
    tenant_id: TENANT_ID,
    partner_id: randomItem(PARTNER_IDS),
    measurement_date: new Date().toISOString(),
    gross_volume: randomIntBetween(1000, 50000),
    bsw_percent: Math.random() * 25,
    temperature: randomIntBetween(60, 120),
    pressure: randomIntBetween(50, 200),
    api_gravity: randomIntBetween(25, 45) + Math.random(),
    meter_factor: 0.98 + (Math.random() * 0.04),
  };
}

// Main test scenario
export default function () {
  const headers = getHeaders();

  // Group related requests
  group('Dashboard Operations', function () {
    const dashboardResponse = http.get(
      `${BASE_URL}/api/dashboard/stats`,
      {
        headers,
        tags: { name: 'Dashboard' },
      }
    );

    const dashboardSuccess = check(dashboardResponse, {
      'dashboard status 200': (r) => r.status === 200,
      'dashboard has total_production': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.total_production !== undefined;
        } catch {
          return false;
        }
      },
      'dashboard response time < 1s': (r) => r.timings.duration < 1000,
    });

    dashboardTrend.add(dashboardResponse.timings.duration);
    errorRate.add(!dashboardSuccess);

    // Check response size
    if (dashboardResponse.body && dashboardResponse.body.length > 512 * 1024) {
      largeResponseCounter.add(1);
      console.warn(`Large dashboard response: ${dashboardResponse.body.length / 1024}KB`);
    }
  });

  sleep(randomIntBetween(1, 2));

  group('Production Entry Operations', function () {
    // List production entries (most common operation)
    const listResponse = http.get(
      `${BASE_URL}/api/production/entries?tenant_id=${TENANT_ID}&page=1&page_size=31`,
      {
        headers,
        tags: { name: 'ProductionList' },
      }
    );

    const listSuccess = check(listResponse, {
      'list status 200': (r) => r.status === 200,
      'list has entries': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.entries);
        } catch {
          return false;
        }
      },
      'list response time < 1.5s': (r) => r.timings.duration < 1500,
    });

    productionListTrend.add(listResponse.timings.duration);
    errorRate.add(!listSuccess);

    // Check for overly large responses
    if (listResponse.body && listResponse.body.length > 1024 * 1024) {
      largeResponseCounter.add(1);
      console.warn(`Large production list response: ${listResponse.body.length / 1024}KB`);
    }

    sleep(randomIntBetween(1, 3));

    // Create a production entry (write operation)
    if (Math.random() < 0.3) {  // 30% of users create entries
      const createPayload = JSON.stringify(generateProductionEntry());

      const createResponse = http.post(
        `${BASE_URL}/api/production/entries`,
        createPayload,
        {
          headers,
          tags: { name: 'CreateEntry' },
        }
      );

      const createSuccess = check(createResponse, {
        'create status 201': (r) => r.status === 201,
        'create response time < 2s': (r) => r.timings.duration < 2000,
      });

      entryCreationTrend.add(createResponse.timings.duration);
      errorRate.add(!createSuccess);
    }
  });

  sleep(randomIntBetween(2, 4));

  // Filter and search (less frequent)
  if (Math.random() < 0.5) {  // 50% of users filter
    group('Filtering Operations', function () {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      const status = randomItem(STATUSES);

      const filterResponse = http.get(
        `${BASE_URL}/api/production/entries?tenant_id=${TENANT_ID}&status=${status}&start_date=${startDate}&end_date=${endDate}&page=1&page_size=50`,
        {
          headers,
          tags: { name: 'FilterEntries' },
        }
      );

      check(filterResponse, {
        'filter status 200': (r) => r.status === 200,
        'filter response time < 2s': (r) => r.timings.duration < 2000,
      });
    });
  }

  sleep(randomIntBetween(3, 5));
}

// Teardown function (runs once at the end)
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  };
}

// Helper: Generate text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors;

  let summary = '\n';
  summary += `${indent}========================================\n`;
  summary += `${indent}FlowShare Load Test Summary\n`;
  summary += `${indent}========================================\n\n`;

  summary += `${indent}Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n`;
  summary += `${indent}Virtual Users: ${data.metrics.vus.values.max}\n\n`;

  summary += `${indent}HTTP Metrics:\n`;
  summary += `${indent}  Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Failed: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `${indent}  Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  P99 Duration: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  summary += `${indent}Custom Metrics:\n`;
  if (data.metrics.dashboard_duration) {
    summary += `${indent}  Dashboard P95: ${data.metrics.dashboard_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.production_list_duration) {
    summary += `${indent}  Prod List P95: ${data.metrics.production_list_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  if (data.metrics.large_responses) {
    summary += `${indent}  Large Responses: ${data.metrics.large_responses.values.count}\n`;
  }

  summary += `\n${indent}========================================\n`;

  return summary;
}

// Helper: Generate HTML report (simplified)
function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>FlowShare Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>FlowShare Load Test Report</h1>
  <h2>Summary</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Test Duration</td><td>${(data.state.testRunDurationMs / 1000).toFixed(2)}s</td></tr>
    <tr><td>Total Requests</td><td>${data.metrics.http_reqs.values.count}</td></tr>
    <tr><td>Failed Requests</td><td class="${data.metrics.http_req_failed.values.rate < 0.01 ? 'pass' : 'fail'}">${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</td></tr>
    <tr><td>Avg Response Time</td><td>${data.metrics.http_req_duration.values.avg.toFixed(2)}ms</td></tr>
    <tr><td>P95 Response Time</td><td class="${data.metrics.http_req_duration.values['p(95)'] < 2000 ? 'pass' : 'fail'}">${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td></tr>
    <tr><td>P99 Response Time</td><td>${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms</td></tr>
  </table>
  <p>Generated: ${new Date().toISOString()}</p>
</body>
</html>
  `;
}
