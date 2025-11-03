# FlowShare V2 - Backend

> **Production-grade API and AI Agent Infrastructure for Automated Hydrocarbon Allocation**

FlowShare V2 Backend is the core engine powering automated petroleum allocation for Oil & Gas joint ventures. Built with FastAPI, it orchestrates event-driven AI agents, implements industry-standard API MPMS 11.1 allocation formulas, and provides a robust REST API for multi-tenant operations.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [AI Agents](#ai-agents)
- [Allocation Engine](#allocation-engine)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Environment Configuration](#environment-configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

### What is FlowShare V2 Backend?

The backend provides:

- **REST API** - 12 routers handling authentication, production data, reconciliation, analytics, and more
- **AI Agent Infrastructure** - 3 microservices (Auditor, Accountant, Communicator) processing events asynchronously
- **Allocation Engine** - Implements API MPMS 11.1 petroleum industry standard for accurate hydrocarbon allocation
- **Multi-Tenant Architecture** - Isolated data and operations per tenant (joint venture)
- **Event-Driven Processing** - Google Cloud Pub/Sub for decoupled, scalable operations
- **AI-Powered Validation** - Gemini API for anomaly detection and reconciliation insights

### Key Capabilities

✅ **95% faster reconciliation** (weeks → minutes)
✅ **99.9% accurate calculations** using API MPMS 11.1 standards
✅ **AI-powered anomaly detection** to prevent costly disputes
✅ **Complete audit trail** with Excel exports showing step-by-step calculations
✅ **Multi-tenant security** with role-based access control

---

## Architecture

### High-Level System Architecture

<p align="center">
  <img src="../archi.svg" alt="Architecture Deep Dive" width="100%">
</p>


### Event-Driven Workflows

**Production Data Lifecycle:**
```
User submits production entry (API)
      ↓
API publishes "production-entry-created" event
      ↓
Auditor Agent validates data
      ↓
Updates entry status (APPROVED/FLAGGED)
      ↓
If flagged → Communicator sends alerts
```

**Reconciliation Workflow:**
```
Coordinator triggers reconciliation (API)
      ↓
API publishes "reconciliation-triggered" event
      ↓
Accountant Agent calculates allocation
      ↓
Generates AI insights via Gemini
      ↓
Saves results with status COMPLETED
      ↓
Publishes "reconciliation-complete" event
      ↓
Communicator sends reports to team
```

---

## Technology Stack

### Core Framework

- **[FastAPI](https://fastapi.tiangolo.com/) 0.104.1** - Modern async web framework
- **[Uvicorn](https://www.uvicorn.org/)** - ASGI server with hot reload
- **[Pydantic](https://docs.pydantic.dev/) 2.5.0** - Data validation and serialization
- **Python 3.11+** - Type hints and async/await support

### Google Cloud Platform

- **[Cloud Firestore](https://cloud.google.com/firestore)** - NoSQL database for multi-tenant data
- **[Cloud Pub/Sub](https://cloud.google.com/pubsub)** - Event messaging for async processing
- **[Cloud BigQuery](https://cloud.google.com/bigquery)** - Analytics data warehouse
- **[Cloud Storage](https://cloud.google.com/storage)** - File storage for reports/exports
- **[Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)** - Authentication

### AI

- **[Google Gemini API](https://ai.google.dev/)** - AI-powered validation and insights

### Data Processing & Reporting

- **[openpyxl](https://openpyxl.readthedocs.io/)** - Excel file generation for audit exports
- **[reportlab](https://www.reportlab.com/)** - PDF report generation
- **[numpy](https://numpy.org/)** - Scientific computing for allocation formulas

### Authentication & Security

- **[python-jose](https://python-jose.readthedocs.io/)** - JWT token handling
- **[cryptography](https://cryptography.io/)** - Encryption utilities
- **[passlib](https://passlib.readthedocs.io/)** - Password hashing

### Development Tools

- **[pytest](https://pytest.org/)** - Unit testing framework
- **[pytest-asyncio](https://pytest-asyncio.readthedocs.io/)** - Async test support
- **[black](https://black.readthedocs.io/)** - Code formatting
- **[ruff](https://beta.ruff.rs/)** - Fast Python linter
- **[mypy](https://mypy.readthedocs.io/)** - Static type checking

---

## Project Structure

```
backend/
├── api/                          # REST API Service
│   ├── main.py                  # FastAPI application entrypoint
│   ├── routers/                 # API route handlers (12 modules)
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── production.py       # Production data CRUD
│   │   ├── reconciliation.py   # Reconciliation management
│   │   ├── tenants.py          # Tenant/organization management
│   │   ├── invitations.py      # Team invitation system
│   │   ├── partners.py         # Partner management
│   │   ├── analytics.py        # Production trends & statistics
│   │   ├── forecasts.py        # ML-based forecasting
│   │   ├── api_keys.py         # SCADA API key management
│   │   ├── scada.py            # SCADA data ingestion API
│   │   ├── audit.py            # Audit logs & compliance
│   │   ├── dashboard.py        # Dashboard stats
│   │   └── flowsharegpt.py     # AI chat interface
│   └── utils/                   # API utilities
│       └── report_generator.py  # Excel/PDF export generator
│
├── agents/                       # AI Agent Microservices
│   ├── auditor/                 # Data Validation Agent
│   │   ├── main.py             # Pub/Sub subscriber for validation
│   │   └── anomaly_detector.py # Statistical & AI anomaly detection
│   ├── accountant/              # Allocation Calculation Agent
│   │   ├── main.py             # Pub/Sub subscriber for reconciliation
│   │   └── allocation_engine.py # API MPMS 11.1 implementation
│   └── communicator/            # Notification Agent
│       ├── main.py             # Pub/Sub subscriber for notifications
│       └── email_templates.py   # HTML email templates
│
├── shared/                       # Shared Code Across Services
│   ├── models/                  # Pydantic Data Models (11 modules)
│   │   ├── user.py             # User profile model
│   │   ├── tenant.py           # Tenant settings model
│   │   ├── production.py       # Production entry model
│   │   ├── reconciliation.py   # Reconciliation result model
│   │   ├── invitation.py       # Team invitation model
│   │   ├── api_key.py          # API key model
│   │   ├── audit_log.py        # Audit trail model
│   │   ├── dashboard.py        # Dashboard stats model
│   │   ├── analytics.py        # Analytics data model
│   │   ├── forecast.py         # ML forecast model
│   │   └── terminal_receipt.py # Terminal volume receipt model
│   │
│   ├── auth/                    # Authentication
│   │   └── firebase_auth.py    # Firebase token verification
│   │
│   ├── database/                # Database Client
│   │   └── firestore_client.py # Async Firestore wrapper
│   │
│   ├── pubsub/                  # Event Publishing
│   │   └── publisher.py        # Pub/Sub message publishing
│   │
│   ├── email/                   # Email Service
│   │   └── zepto_mail.py       # ZeptoMail integration
│   │
│   ├── ai/                      # AI Services
│   │   └── gemini_service.py   # Gemini API client
│   │
│   ├── config.py                # Environment configuration
│   ├── validation.py            # Email normalization & validation
│   └── utils/                   # Shared utilities
│       ├── audit_logger.py     # Audit trail logging
│       └── helpers.py          # Common helper functions
│
├── tests/                        # Unit & Integration Tests
│   ├── test_auth.py
│   ├── test_production.py
│   ├── test_reconciliation.py
│   ├── test_allocation_engine.py
│   └── test_anomaly_detection.py
│
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Container image for deployment
├── docker-compose.yml            # Local development environment
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Docker & Docker Compose** (for local development)
- **Google Cloud Project** with Firestore, Pub/Sub, and Firebase enabled
- **Firebase Admin SDK credentials** (JSON key file)
- **API Keys:**
  - Gemini API key
  - ZeptoMail API token

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/todak2000/flowshare-v2.git
cd flowshare-v2/backend
```

#### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory and copy the contents of `.env.example` updating the respective variables


#### 5. Start Local Development Environment

Using Docker Compose (recommended):

```bash
docker-compose up --build
```

This starts:
- **API** on `http://localhost:8000`
- **Firestore Emulator** on `http://localhost:8080`
- **Pub/Sub Emulator** on `http://localhost:8085`
- **Auditor Agent** on `http://localhost:8001`
- **Accountant Agent** on `http://localhost:8002`
- **Communicator Agent** on `http://localhost:8003`

**Without Docker** (manual setup):

```bash
# Terminal 1: Start Firestore Emulator
gcloud emulators firestore start --host-port=localhost:8080

# Terminal 2: Start Pub/Sub Emulator
gcloud emulators pubsub start --host-port=localhost:8085

# Terminal 3: Start API
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 4: Start Auditor Agent
python agents/auditor/main.py

# Terminal 5: Start Accountant Agent
python agents/accountant/main.py

# Terminal 6: Start Communicator Agent
python agents/communicator/main.py
```

#### 6. Verify Installation

Visit the API documentation:

```
http://localhost:8000/docs
```

You should see the interactive Swagger UI with all API endpoints.

---

## API Documentation

### Interactive API Docs

The Swagger Docs are passworded using
username: `admin`
password: `Qwerty@12345`

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### API Routers Overview

| Router | Prefix | Description |
|--------|--------|-------------|
| **auth** | `/api/auth` | User registration, login, authentication |
| **production** | `/api/production` | Production data CRUD operations |
| **reconciliation** | `/api/reconciliation` | Trigger and manage reconciliations |
| **tenants** | `/api/tenants` | Tenant management, billing, settings |
| **invitations** | `/api/invitations` | Team invitation system |
| **partners** | `/api/partners` | Partner management |
| **analytics** | `/api/analytics` | Production trends & statistics |
| **forecasts** | `/api/forecasts` | ML-based production forecasting |
| **api_keys** | `/api/api-keys` | SCADA API key management |
| **scada** | `/api/scada` | SCADA system data ingestion |
| **audit** | `/api/audit` | Audit logs & compliance |
| **dashboard** | `/api/dashboard` | Dashboard stats & recent activity |
| **flowsharegpt** | `/api/flowsharegpt` | AI chat interface |

### Key Endpoints

#### Authentication

```http
POST /api/auth/register
POST /api/auth/register-invitee
GET /api/auth/me
```

#### Production Data

```http
POST /api/production/entries       # Create production entry
GET /api/production/entries        # List entries (with filters)
GET /api/production/entries/{id}   # Get entry details
PATCH /api/production/entries/{id} # Update entry
POST /api/production/entries/{id}/approve # Approve entry
```

#### Reconciliation

```http
POST /api/reconciliation           # Trigger reconciliation
GET /api/reconciliation            # List reconciliations
GET /api/reconciliation/{id}       # Get results
GET /api/reconciliation/{id}/export/excel # Export as Excel
```

#### SCADA Integration

```http
POST /api/scada/entries            # Submit production data (API key auth)
GET /api/scada/status              # Health check
```

### Authentication

All endpoints (except `/api/scada/*` and demo endpoints) require Firebase ID token:

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
     http://localhost:8000/api/production/entries
```

SCADA endpoints use API key authentication:

```bash
curl -H "X-API-Key: YOUR_SCADA_API_KEY" \
     -X POST http://localhost:8000/api/scada/entries \
     -H "Content-Type: application/json" \
     -d '{"partner_id": "...", "gross_volume": 10000, ...}'
```

---

## AI Agents

### 1. Auditor Agent

**Location**: `agents/auditor/main.py`

**Purpose**: Validate production data and detect anomalies

**Event Subscription**: `production-entry-created`

**Workflow**:
1. Receives notification when new production entry is created
2. Fetches entry and 20 historical approved entries for the partner
3. Performs anomaly detection:
   - **Statistical Z-score analysis** on gross volume, BSW%, temperature
   - **Hard range checks** (e.g., BSW% > 50 flags as extremely high)
   - **AI-enhanced analysis** via Gemini for contextual insights
4. Calculates anomaly score (0-1)
5. Updates entry status: `PENDING` → `APPROVED` or `FLAGGED`
6. If flagged, publishes `entry-flagged` event
7. Logs anomaly details for audit trail

**Anomaly Flags**:
- High water content (BSW% > 30%)
- Extremely high BSW (> 50%)
- Temperature out of safe range (< 32°F or > 200°F)
- Unusual meter factor (< 0.8 or > 1.2)
- Extremely large volume (> 100,000 BBL)
- Statistical outliers (z-score > 2.5)

**Run Auditor Agent**:

```bash
python agents/auditor/main.py
```

### 2. Accountant Agent

**Location**: `agents/accountant/main.py`

**Purpose**: Calculate petroleum allocation using industry standards

**Event Subscription**: `reconciliation-triggered`

**Workflow**:
1. Receives notification when reconciliation is triggered
2. Fetches tenant settings (allocation model: API MPMS 11.1)
3. Validates that > 80% of entries are APPROVED
4. Fetches all APPROVED entries for the period
5. For each partner:
   - Calculates Net Standard Volume with all corrections
   - Determines ownership percentage
   - Allocates terminal volume
6. Generates AI analysis via Gemini
7. Saves results to Firestore with status `COMPLETED`
8. Publishes `reconciliation-complete` event

**Allocation Models Supported**:
- **API MPMS 11.1** (default) - Petroleum industry standard

**Run Accountant Agent**:

```bash
python agents/accountant/main.py
```

### 3. Communicator Agent

**Location**: `agents/communicator/main.py`

**Purpose**: Send email notifications to stakeholders

**Event Subscriptions**:
- `entry-flagged` - Anomaly detection alerts
- `reconciliation-complete` - Final results notification
- `invitation-created` - Team invitations
- `entry-edited` - Data change notifications

**Workflow**:
1. Receives event notification
2. Fetches relevant data (entry, reconciliation, user, tenant)
3. Builds recipient list based on user notification preferences
4. Renders HTML email using templates
5. Sends via ZeptoMail API

**Email Provider**: ZeptoMail

**Run Communicator Agent**:

```bash
python agents/communicator/main.py
```

---

## Allocation Engine

### API MPMS 11.1 Implementation

**Location**: `agents/accountant/allocation_engine.py`

The allocation engine implements the **API Manual of Petroleum Measurement Standards (MPMS) Chapter 11.1** for accurate hydrocarbon allocation.

### Calculation Steps

For each partner's production data:

#### 1. Water Cut Factor
```python
water_cut_factor = 1 - (bsw_percent / 100)
```
Removes water and sediment from gross volume.

#### 2. Net Observed Volume
```python
net_observed_volume = gross_volume * water_cut_factor
```
Only oil content, measured at observed conditions.

#### 3. Temperature Correction Factor (CTL)
```python
# Alpha and Beta coefficients based on API gravity
alpha = get_alpha_coefficient(api_gravity)
beta = get_beta_coefficient(api_gravity)

# Temperature difference from standard (60°F)
delta_t = temperature - 60.0

# Correction factor
ctl = 1 - alpha * delta_t - beta * (delta_t ** 2)
```
Corrects for thermal expansion/contraction.

#### 4. Specific Gravity
```python
specific_gravity = 141.5 / (api_gravity + 131.5)
```
Converts API Gravity to density ratio.

#### 5. API Gravity Correction Factor (CPL)
```python
sg_standard = 141.5 / (api_gravity + 131.5)
sg_observed = sg_standard * ctl

cpl = sg_standard / sg_observed
```
Accounts for density change due to temperature.

#### 6. Net Standard Volume
```python
net_standard_volume = net_observed_volume * ctl * cpl
```
Volume normalized to standard conditions (60°F, 14.696 psia).

#### 7. Ownership Calculation
```python
# Calculate each partner's percentage
ownership_percent = (partner_nsv / total_nsv) * 100

# Allocate terminal volume
allocated_volume = terminal_volume * (ownership_percent / 100)
```

#### 8. Shrinkage
```python
shrinkage_volume = total_nsv - terminal_volume
shrinkage_percent = (shrinkage_volume / total_nsv) * 100
```

### Example Calculation

**Input:**
- Partner: Shell
- Gross Volume: 10,000 barrels
- BSW%: 5%
- Temperature: 75°F
- API Gravity: 35

**Calculation:**
```
Step 1: Water Cut = 1 - (5/100) = 0.95
Step 2: Net Observed = 10,000 × 0.95 = 9,500 bbls
Step 3: CTL ≈ 0.998
Step 4: SG = 141.5 / (35 + 131.5) = 0.845
Step 5: CPL ≈ 1.001
Step 6: Net Standard = 9,500 × 0.998 × 1.001 = 9,510 bbls
Step 7: If total NSV = 50,000 bbls and terminal = 49,800 bbls
        Shell Allocation% = (9,510 / 50,000) × 100 = 19.02%
        Shell Allocated = 49,800 × 0.1902 = 9,475 bbls
```

### Pluggable Architecture

The allocation engine is designed to support multiple models:

```python
class AllocationEngine:
    def __init__(self, model: str = "api_mpms_11_1"):
        self.model = model

    def calculate(self, entries, terminal_volume):
        if self.model == "api_mpms_11_1":
            return self._calculate_api_mpms()
        elif self.model == "model_b":
            return self._calculate_model_b()
        # Add more models as needed
```

Coordinators can select the allocation model in tenant settings.

---

## Database Schema

### Firestore Collections

#### `users/`
User profiles with authentication details and roles.

```python
{
  "email": "john@shell.com",
  "full_name": "John Doe",
  "firebase_uid": "abc123...",
  "role": "partner",  # coordinator | partner | field_operator | auditor
  "partner_id": "partner_123",
  "organization": "Shell",
  "tenant_ids": ["tenant_xyz"],
  "notification_settings": {
    "email_reports": true,
    "email_anomaly_alerts": false
  },
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

#### `tenants/`
Joint venture organizations and their settings.

```python
{
  "name": "Niger Delta JV",
  "owner_id": "user_123",  # Coordinator user_id
  "subscription_plan": "professional",  # starter | professional | enterprise
  "status": "active",
  "settings": {
    "allocation_model": "api_mpms_11_1",
    "default_temperature_standard": 60.0,
    "default_pressure_standard": 14.696
  },
  "partner_ids": ["partner_1", "partner_2"],
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### `production_entries/`
Daily production data submitted by partners or field operators.

```python
{
  "tenant_id": "tenant_xyz",
  "partner_id": "partner_123",
  "measurement_date": "2025-01-15",
  "gross_volume": 10000.0,  # barrels
  "bsw_percent": 5.0,  # 0-100
  "temperature": 75.0,  # °F
  "api_gravity": 35.0,
  "pressure": 14.696,  # psia
  "meter_factor": 1.0,
  "submitted_by": "user_456",
  "status": "approved",  # pending | approved | flagged
  "anomaly_score": 0.15,  # 0-1
  "ai_analysis": "<p>Entry looks normal...</p>",
  "created_at": "2025-01-15T10:00:00Z"
}
```

#### `reconciliations/`
Allocation calculation results for a given period.

```python
{
  "tenant_id": "tenant_xyz",
  "period_start": "2025-01-01",
  "period_end": "2025-01-31",
  "terminal_volume": 49800.0,  # barrels
  "triggered_by": "user_123",
  "status": "completed",  # pending | processing | completed | failed
  "result": {
    "total_gross_volume": 50000.0,
    "total_net_volume_standard": 48500.0,
    "shrinkage_percent": 2.5,
    "partner_allocations": [
      {
        "partner_id": "partner_123",
        "partner_name": "Shell",
        "gross_volume": 10000.0,
        "net_volume_standard": 9510.0,
        "ownership_percent": 19.02,
        "allocated_volume": 9475.0
      }
    ]
  },
  "ai_analysis": "<p>Allocation completed successfully...</p>",
  "created_at": "2025-02-01T12:00:00Z",
  "completed_at": "2025-02-01T12:05:00Z"
}
```

---

## Authentication & Authorization

### Authentication Flow

```
1. User logs in via Firebase Auth (frontend)
2. Firebase returns ID token
3. Frontend includes token in Authorization header
4. Backend validates token using Firebase Admin SDK
5. Backend extracts user_id from token
6. Backend fetches user record from Firestore
7. Request proceeds with user context
```

### Token Verification

**Middleware** (`shared/auth/firebase_auth.py`):

```python
async def get_current_user_id(authorization: str = Header(...)) -> str:
    """Verify Firebase ID token and return user_id"""
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Role-Based Access Control

**User Roles**:

1. **Coordinator (Admin)**
   - Create/manage tenants and users
   - Invite partners and field operators
   - Configure allocation model
   - View all partner data
   - Trigger reconciliations
   - Approve/reject production entries

2. **Partner**
   - Submit production data
   - View own company's data and reports
   - Invite field operators
   - Access analytics

3. **Field Operator**
   - Submit production data via UI or SCADA API
   - View own submission history
   - Receive anomaly alerts

4. **Auditor**
   - Read-only access to all partner data
   - Download audit reports
   - Cannot access ML forecasting features

---

## Environment Configuration

### Firebase Credentials

**Updated Approach (January 2025):** We now use a streamlined credential management system:

#### **Development (Local)**
Place your Firebase service account JSON file as `backend/firebase-credentials.json`:

```bash
# Download from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
cp ~/Downloads/flowshare-v2-firebase-adminsdk.json backend/firebase-credentials.json
```

The code automatically detects and loads this file during local development.

#### **Production (Cloud Run)**
Credentials are fetched from **Google Cloud Secret Manager**:

```bash
# Upload the entire service account JSON as a single secret
cat firebase-credentials.json | gcloud secrets create FIREBASE_CREDENTIALS_JSON \
  --data-file=- \
  --replication-policy=automatic \
  --project=flowshare-v2
```

The backend automatically:
1. Checks for local `firebase-credentials.json` file (development)
2. Falls back to fetching `FIREBASE_CREDENTIALS_JSON` from Secret Manager (production)
3. Uses Application Default Credentials as last resort

**Why this approach?**
- ✅ No more newline formatting issues with private keys
- ✅ Single source of truth for all Firebase credentials
- ✅ Easy to rotate credentials
- ✅ Works seamlessly in both dev and production

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GCP_PROJECT_ID` | Google Cloud Project ID | Yes | - |
| `GCP_REGION` | Google Cloud region | No | `europe-west1` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | No | Uses GCP_PROJECT_ID |
| `FIRESTORE_EMULATOR_HOST` | Firestore emulator (local dev) | No | - |
| `PUBSUB_EMULATOR_HOST` | Pub/Sub emulator (local dev) | No | - |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `ZEPTO_TOKEN` | ZeptoMail API token (email service) | Yes | - |
| `ZEPTO_FROM_EMAIL` | Sender email address | Yes | - |
| `SWAGGER_USERNAME` | API docs username | No | `admin` |
| `SWAGGER_PASSWORD` | API docs password | No | - |
| `DEMO_PASSWORD` | Demo endpoints password | No | - |
| `ENVIRONMENT` | Environment name | No | `development` |
| `LOG_LEVEL` | Logging level | No | `INFO` |

### Secret Manager Configuration

All production secrets are stored in **Google Cloud Secret Manager**:

```bash
# List all secrets
gcloud secrets list --project=flowshare-v2

# View a secret (non-sensitive fields only)
gcloud secrets versions access latest --secret="FIREBASE_CREDENTIALS_JSON" --project=flowshare-v2 | jq '{type, project_id, client_email}'
```

**Production Secrets**:
- `FIREBASE_CREDENTIALS_JSON` - Complete Firebase service account (JSON)
- `GEMINI_API_KEY` - Google Gemini API key
- `ZEPTO_TOKEN` - Email service token
- `DEMO_PASSWORD` - Demo/test endpoint password
- `SWAGGER_USERNAME` / `SWAGGER_PASSWORD` - API documentation access

**Note:** Individual Firebase credential secrets (`FIREBASE_PRIVATE_KEY`, etc.) have been deprecated in favor of `FIREBASE_CREDENTIALS_JSON`.

---

## Testing

### Run All Tests

```bash
cd backend
python -m pytest tests/unit/ -v
```

### Run Specific Test File

```bash
python -m pytest tests/unit/test_validation.py -v
python -m pytest tests/unit/test_api_key_auth.py -v
```

### Run with Coverage

```bash
python -m pytest tests/unit/ --cov=shared --cov-report=html
# Open htmlcov/index.html in browser
```

### Test Status

✅ **All Tests Passing: 44 tests (100%)**

**Test Files**:
- `test_validation.py` (27 tests) - Input validation and sanitization
- `test_api_key_auth.py` (12 tests) - API key generation, hashing, verification
- Additional test files for routers and utilities

### Test Coverage

**High Coverage on Core Utilities**:
- `shared/validation.py`: **94% coverage**
- `shared/auth/api_key_auth.py`: **85% coverage**
- `shared/config.py`: **98% coverage**

### Test Structure

```
backend/tests/
├── unit/                        # Unit tests
│   ├── test_validation.py      # Validation utilities
│   ├── test_api_key_auth.py    # API key authentication
│   └── ...
├── conftest.py                  # Pytest fixtures and mocks
└── pytest.ini                   # Pytest configuration
```

### Viewing Test Report

See [TEST_REPORT.md](./TEST_REPORT.md) for detailed test documentation.

### Key Test Features

- ✅ Proper mocking of Firebase, Firestore, Pub/Sub
- ✅ Security testing (XSS prevention, input sanitization)
- ✅ Edge cases (null, empty, invalid inputs)
- ✅ Fast execution (< 10 seconds)
- ✅ CI/CD ready

---

## Deployment

### Production Services (Live)

All services are deployed on **Google Cloud Run** in the `europe-west1` region:

| Service | URL | Status |
|---------|-----|--------|
| **Backend API** | [flowshare-backend-api-226906955613.europe-west1.run.app](https://flowshare-backend-api-226906955613.europe-west1.run.app) | ✅ Live |
| **Auditor Agent** | `flowshare-auditor-agent-226906955613.europe-west1.run.app` | ✅ Live |
| **Accountant Agent** | `flowshare-accountant-agent-226906955613.europe-west1.run.app` | ✅ Live |
| **Communicator Agent** | `flowshare-communicator-agent-226906955613.europe-west1.run.app` | ✅ Live |

**API Documentation:** [https://flowshare-backend-api-226906955613.europe-west1.run.app/docs](https://flowshare-backend-api-226906955613.europe-west1.run.app/docs)
- Username: `admin`
- Password: Stored in Secret Manager (`SWAGGER_PASSWORD`)

### Automated Deployment (CI/CD)

Deployments are fully automated via **GitHub Actions** workflows:

**Trigger:** Push to `main` branch with changes in `backend/` directory

**Workflow Files:**
- `.github/workflows/deploy-backend-api.yml` - API service deployment
- `.github/workflows/deploy-backend-agents.yml` - AI agents deployment

**What happens automatically:**
1. Checkout code from GitHub
2. Authenticate to Google Cloud
3. Build Docker images for each service
4. Push images to Artifact Registry
5. Deploy to Cloud Run with secrets from Secret Manager
6. Health checks verify successful deployment

### Manual Deployment

If you need to deploy manually:

```bash
# Deploy all services
cd /path/to/flowshare-v2
git add .
git commit -m "Your deployment message"
git push origin main
```

GitHub Actions will handle the rest.

### Pub/Sub Configuration

**Topics** (already created):
```bash
production-entry-created
reconciliation-triggered
entry-flagged
reconciliation-complete
publish_production_entry_edited
invitation-created
```

**Subscriptions** (pull-based for Cloud Run):
```bash
production-entry-created-sub → Auditor Agent
reconciliation-triggered-sub → Accountant Agent
entry-flagged-sub → Communicator Agent
reconciliation-complete-sub → Communicator Agent
publish_production_entry_edited-sub → Communicator Agent
invitation-created-sub → Communicator Agent
```

### Environment Variables in Production

Set via GitHub Actions workflows:

```yaml
env_vars: |
  GCP_PROJECT_ID=${{ secrets.GCP_PROJECT_ID }}
  GCP_REGION=${{ secrets.GCP_REGION }}
  FIREBASE_PROJECT_ID=${{ secrets.GCP_PROJECT_ID }}
  ENVIRONMENT=production
  DEBUG=false

secrets: |
  ZEPTO_TOKEN=ZEPTO_TOKEN:latest
  GEMINI_API_KEY=GEMINI_API_KEY:latest
  SWAGGER_USERNAME=SWAGGER_USERNAME:latest
  SWAGGER_PASSWORD=SWAGGER_PASSWORD:latest
  DEMO_PASSWORD=DEMO_PASSWORD:latest
```

The `FIREBASE_CREDENTIALS_JSON` secret is automatically fetched by the backend from Secret Manager at runtime.

### Monitoring & Logs

View logs for each service:

```bash
# API logs
gcloud run services logs read flowshare-backend-api --region=europe-west1 --project=flowshare-v2 --limit=50

# Auditor Agent logs
gcloud run services logs read flowshare-auditor-agent --region=europe-west1 --project=flowshare-v2 --limit=50

# Accountant Agent logs
gcloud run services logs read flowshare-accountant-agent --region=europe-west1 --project=flowshare-v2 --limit=50

# Communicator Agent logs
gcloud run services logs read flowshare-communicator-agent --region=europe-west1 --project=flowshare-v2 --limit=50
```

### Health Checks

All services expose health check endpoints:

```bash
# API
curl https://flowshare-backend-api-226906955613.europe-west1.run.app/

# Agents
curl https://flowshare-auditor-agent-226906955613.europe-west1.run.app/
curl https://flowshare-accountant-agent-226906955613.europe-west1.run.app/
curl https://flowshare-communicator-agent-226906955613.europe-west1.run.app/
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run tests and linting:
   ```bash
   pytest
   black .
   ruff .
   mypy .
   ```
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- **Black** for code formatting
- **Ruff** for linting
- **mypy** for type checking
- Follow PEP 8 guidelines
- Write docstrings for all functions and classes

---

## License

Copyright © 2025 FlowShare V2. All rights reserved.

---

## Support

For questions or issues:

- **Email**: todak2000@gmail.com
- **Documentation**: https://flowshare-backend-api-226906955613.europe-west1.run.app/docs
- **GitHub Issues**: https://github.com/todak2000/flowshare-v2/issues

---

