#!/bin/bash
#
# Helper script to run k6 load tests with automatic Firebase authentication
#
# Usage:
#   ./run_k6.sh [k6 arguments]
#
# Examples:
#   # Smoke test (verify functionality)
#   ./run_k6.sh --vus 1 --duration 30s
#
#   # Load test (normal traffic)
#   ./run_k6.sh --vus 50 --duration 5m
#
#   # Stress test (find breaking point)
#   ./run_k6.sh --vus 100 --duration 10m
#
#   # Custom base URL
#   BASE_URL=https://flowshare-backend-api-226906955613.europe-west1.run.app ./run_k6.sh --vus 50 --duration 5m

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$SCRIPT_DIR/../tests"

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}  FlowShare - K6 Load Test Runner${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ ERROR: k6 is not installed${NC}"
    echo ""
    echo "Installation instructions:"
    echo "  macOS:   brew install k6"
    echo "  Ubuntu:  sudo apt install k6"
    echo "  Other:   https://k6.io/docs/getting-started/installation/"
    echo ""
    exit 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ ERROR: python3 is not installed${NC}"
    exit 1
fi

# Step 1: Authenticate and get tokens
echo -e "${YELLOW}🔐 Authenticating with Firebase...${NC}"

# Create a temporary Python script to get tokens
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOF'
import sys
import os
from pathlib import Path

# Add tests directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../tests'))

try:
    from auth_helper import get_test_token, get_test_tenant_id

    # Get authentication tokens
    token = get_test_token()
    tenant_id = get_test_tenant_id()

    # Print tokens in a way that can be sourced by bash
    print(f"export TEST_TOKEN='{token}'")
    print(f"export TENANT_ID='{tenant_id}'")

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
EOF

# Run the Python script and capture output
AUTH_OUTPUT=$(cd "$SCRIPT_DIR" && python3 "$TEMP_SCRIPT" 2>&1)
AUTH_EXIT_CODE=$?

# Clean up temp script
rm -f "$TEMP_SCRIPT"

# Check if authentication was successful
if [ $AUTH_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Authentication failed:${NC}"
    echo "$AUTH_OUTPUT"
    echo ""
    echo "Make sure your .env file contains:"
    echo "  FIREBASE_API_KEY=your_api_key"
    echo "  TEST_USER_EMAIL=your_test_email"
    echo "  TEST_USER_PASSWORD=your_test_password"
    exit 1
fi

# Source the authentication tokens
eval "$AUTH_OUTPUT"

echo -e "${GREEN}✅ Authentication successful!${NC}"
echo -e "   Tenant ID: ${TENANT_ID}"
echo ""

# Step 2: Set BASE_URL if not already set
if [ -z "$BASE_URL" ]; then
    BASE_URL="${BASE_URL:-http://localhost:8000}"
fi

echo -e "${BLUE}📊 Running k6 load test...${NC}"
echo -e "   Target: ${BASE_URL}"
echo -e "   Arguments: $*"
echo ""

# Step 3: Run k6 with the tokens
export TEST_TOKEN
export TENANT_ID
export BASE_URL

k6 run "$SCRIPT_DIR/k6_test.js" "$@"

K6_EXIT_CODE=$?

echo ""
if [ $K6_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Load test completed successfully!${NC}"
else
    echo -e "${RED}❌ Load test failed with exit code: $K6_EXIT_CODE${NC}"
fi

echo -e "${BLUE}===================================================${NC}"

exit $K6_EXIT_CODE
