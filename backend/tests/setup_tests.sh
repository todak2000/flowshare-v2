#!/bin/bash
# FlowShare V2 Test Setup Script
# Automates environment setup for running tests

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

error() {
    echo -e "${RED}❌ ${1}${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${1}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup
main() {
    header "FlowShare V2 Test Setup"

    # Change to backend directory
    cd "$(dirname "$0")/../.."

    # Step 1: Check prerequisites
    header "1/6 Checking Prerequisites"

    info "Checking Python..."
    if ! command_exists python3; then
        error "Python 3 not found. Please install Python 3.12+"
        exit 1
    fi
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    success "Python $PYTHON_VERSION found"

    info "Checking pip..."
    if ! command_exists pip3; then
        error "pip not found. Please install pip"
        exit 1
    fi
    success "pip found"

    info "Checking gcloud..."
    if ! command_exists gcloud; then
        warning "gcloud not found. Install from: https://cloud.google.com/sdk/docs/install"
        warning "Emulator tests will not work without gcloud"
    else
        success "gcloud found"
    fi

    info "Checking k6..."
    if ! command_exists k6; then
        warning "k6 not found. Install with: brew install k6 (macOS) or sudo apt install k6 (Ubuntu)"
        warning "Load tests will not work without k6"
    else
        success "k6 found"
    fi

    # Step 2: Install Python dependencies
    header "2/6 Installing Python Dependencies"

    info "Installing main dependencies..."
    pip3 install -q -r backend/requirements.txt
    success "Main dependencies installed"

    info "Installing test dependencies..."
    pip3 install -q -r tests/requirements-test.txt
    success "Test dependencies installed"

    info "Installing load test dependencies..."
    pip3 install -q -r load_tests/requirements.txt
    success "Load test dependencies installed"

    # Step 3: Setup environment variables
    header "3/6 Setting Up Environment Variables"

    # Check if .env exists
    if [ -f ".env" ]; then
        info "Loading .env file..."
        export $(cat .env | grep -v '^#' | xargs)
        success ".env loaded"
    else
        warning ".env file not found"
        info "Creating .env template..."

        cat > .env << 'EOF'
# Firebase Authentication
FIREBASE_API_KEY=
TEST_USER_EMAIL=todak2000@gmail.com
TEST_USER_PASSWORD=Qwerty@12345

# GCP Configuration
GCP_PROJECT_ID=flowshare-v2-project

# For integration tests (emulator)
USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
PUBSUB_EMULATOR_HOST=localhost:8085

# For load tests (will be generated)
TEST_TOKEN=
TENANT_ID=

# Target URLs
BASE_URL=http://localhost:8000
EOF

        success ".env template created"
        warning "Please edit .env and add your FIREBASE_API_KEY"
        warning "Get it from: Firebase Console → Settings → Web API Key"
        echo ""
        read -p "Press Enter after you've updated .env..."
        export $(cat .env | grep -v '^#' | xargs)
    fi

    # Verify critical env vars
    if [ -z "$FIREBASE_API_KEY" ]; then
        error "FIREBASE_API_KEY not set in .env"
        error "Get it from Firebase Console → Settings → Web API Key"
        exit 1
    fi
    success "FIREBASE_API_KEY is set"

    # Step 4: Test authentication
    header "4/6 Testing Firebase Authentication"

    info "Authenticating with Firebase..."
    if python3 tests/auth_helper.py > /tmp/auth_test.log 2>&1; then
        success "Authentication successful!"

        # Extract and set token
        info "Getting authentication token..."
        export TEST_TOKEN=$(python3 -c "from tests.auth_helper import get_test_token; print(get_test_token())" 2>/dev/null)
        export TENANT_ID=$(python3 -c "from tests.auth_helper import get_test_tenant_id; print(get_test_tenant_id())" 2>/dev/null)

        if [ -n "$TEST_TOKEN" ] && [ -n "$TENANT_ID" ]; then
            success "Token obtained: ${TEST_TOKEN:0:20}..."
            success "Tenant ID: $TENANT_ID"

            # Update .env with tokens
            if [ -f ".env" ]; then
                sed -i.bak "s|^TEST_TOKEN=.*|TEST_TOKEN=$TEST_TOKEN|" .env
                sed -i.bak "s|^TENANT_ID=.*|TENANT_ID=$TENANT_ID|" .env
                rm .env.bak 2>/dev/null || true
                success "Tokens saved to .env"
            fi
        else
            warning "Could not get token/tenant_id automatically"
        fi
    else
        error "Authentication failed"
        cat /tmp/auth_test.log
        error "Please check your credentials in .env"
        exit 1
    fi

    # Step 5: Setup test infrastructure
    header "5/6 Setting Up Test Infrastructure"

    # Check if emulators should be started
    read -p "Do you want to start emulators for integration tests? (y/n): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Starting Firestore emulator..."
        if command_exists gcloud; then
            # Check if already running
            if lsof -i:8080 >/dev/null 2>&1; then
                warning "Port 8080 already in use (Firestore emulator may be running)"
            else
                gcloud beta emulators firestore start --host-port=localhost:8080 > /tmp/firestore_emulator.log 2>&1 &
                sleep 3
                success "Firestore emulator started on localhost:8080"
            fi

            info "Starting Pub/Sub emulator..."
            if lsof -i:8085 >/dev/null 2>&1; then
                warning "Port 8085 already in use (Pub/Sub emulator may be running)"
            else
                gcloud beta emulators pubsub start --host-port=localhost:8085 > /tmp/pubsub_emulator.log 2>&1 &
                sleep 3
                success "Pub/Sub emulator started on localhost:8085"
            fi

            # Create Pub/Sub topics
            info "Creating Pub/Sub topics..."
            export PUBSUB_EMULATOR_HOST=localhost:8085
            export FIRESTORE_EMULATOR_HOST=localhost:8080
            if python3 create-pubsub-topics.py > /dev/null 2>&1; then
                success "Pub/Sub topics created"
            else
                warning "Could not create Pub/Sub topics (may already exist)"
            fi
        else
            error "gcloud not found. Cannot start emulators."
        fi
    else
        info "Skipping emulator setup"
    fi

    # Create results directory
    mkdir -p load_tests/results
    success "Results directory created"

    # Step 6: Verify setup
    header "6/6 Verifying Setup"

    SETUP_OK=true

    # Check Python packages
    info "Checking pytest..."
    if python3 -c "import pytest" 2>/dev/null; then
        success "pytest installed"
    else
        error "pytest not installed"
        SETUP_OK=false
    fi

    info "Checking auth_helper..."
    if python3 -c "from tests.auth_helper import get_test_auth" 2>/dev/null; then
        success "auth_helper available"
    else
        error "auth_helper import failed"
        SETUP_OK=false
    fi

    # Check emulators (if requested)
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Checking Firestore emulator..."
        if lsof -i:8080 >/dev/null 2>&1; then
            success "Firestore emulator running on port 8080"
        else
            warning "Firestore emulator not detected on port 8080"
        fi

        info "Checking Pub/Sub emulator..."
        if lsof -i:8085 >/dev/null 2>&1; then
            success "Pub/Sub emulator running on port 8085"
        else
            warning "Pub/Sub emulator not detected on port 8085"
        fi
    fi

    # Final summary
    header "Setup Complete! 🎉"

    if [ "$SETUP_OK" = true ]; then
        success "All checks passed!"
    else
        warning "Some checks failed. Review errors above."
    fi

    echo ""
    echo "Environment variables:"
    echo "  FIREBASE_API_KEY: ${FIREBASE_API_KEY:0:20}..."
    echo "  TEST_USER_EMAIL: $TEST_USER_EMAIL"
    echo "  TEST_TOKEN: ${TEST_TOKEN:0:20}..."
    echo "  TENANT_ID: $TENANT_ID"
    echo "  USE_EMULATOR: $USE_EMULATOR"
    echo ""

    echo "Next steps:"
    echo ""
    echo "  1. Run integration tests:"
    echo "     $ cd backend"
    echo "     $ export \$(cat .env | xargs)"
    echo "     $ pytest tests/integration/ -v"
    echo ""
    echo "  2. Run load tests:"
    echo "     $ cd backend/load_tests"
    echo "     $ export \$(cat ../.env | xargs)"
    echo "     $ k6 run --vus 10 --duration 1m k6_test.js"
    echo ""
    echo "  3. Run chaos tests:"
    echo "     $ cd backend"
    echo "     $ export \$(cat .env | xargs)"
    echo "     $ pytest tests/chaos/ -v -m chaos"
    echo ""
    echo "  See TESTING_GUIDE.md for detailed instructions"
    echo ""
}

# Run main function
main "$@"
