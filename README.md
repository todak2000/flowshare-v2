# FlowShare V2

> **Production-Grade Automated Hydrocarbon Allocation Platform for Oil & Gas Joint Ventures**

[![Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Gemini](https://img.shields.io/badge/Google-Gemini%20Pro-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)

FlowShare V2 is a full-stack SaaS application that automates petroleum allocation calculations for joint venture operations, reducing reconciliation time from weeks to minutes with 99.9% accuracy using industry-standard API MPMS 11.1 formulas.

---

## 🎯 What is FlowShare V2?

FlowShare V2 streamlines the complex process of allocating crude oil production among multiple partners in a joint venture. It combines:

- **AI-Powered Validation** - Gemini API detects anomalies in production data
- **Automated Calculations** - API MPMS 11.1 petroleum allocation standards
- **Event-Driven Architecture** - Asynchronous processing with AI agents
- **Multi-Tenant SaaS** - Secure, isolated data for each organization
- **Real-time Analytics** - ML forecasting and production insights

**Live Link:** [https://flowshare-197665497260.europe-west1.run.app/](https://flowshare-197665497260.europe-west1.run.app/)

**Demo Video:** [Watch on Youtube](https://youtu.be/b0BSD6JAadU)

**Blog Post:** [Read on Medium](https://medium.com/@todak2000/building-flowshare-how-i-built-a-multi-agent-system-on-google-cloud-run-a6dd577989e2)

### Key Benefits

✅ **95% faster reconciliation** (weeks → minutes)
✅ **99.9% calculation accuracy** using industry standards
✅ **AI anomaly detection** prevents costly disputes
✅ **Complete audit trail** with Excel exports
✅ **Multi-role access** for coordinators, partners, and operators

---

## 🏗️ Architecture Overview
<p align="center">
  <img src="archi.svg" alt="Architecture Deep Dive" width="100%">
</p>

---

## 📁 Project Structure

```
flowshare-v2/
├── frontend/                    # Next.js 15 application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & config
│   │   ├── hooks/              # Custom React hooks
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── README.md              # 👉 Frontend Documentation
│
├── backend/                    # FastAPI application
│   ├── api/                   # REST API routers
│   │   ├── main.py            # FastAPI app
│   │   └── routers/           # 12 API routers
│   ├── agents/                # AI microservices
│   │   ├── auditor/           # Data validation agent
│   │   ├── accountant/        # Allocation engine
│   │   └── communicator/      # Notification agent
│   ├── shared/                # Shared code
│   │   ├── models/            # Pydantic models
│   │   ├── auth/              # Authentication
│   │   ├── database/          # Firestore client
│   │   └── ai/                # Gemini service
│   ├── tests/                 # Unit tests
│   ├── requirements.txt
│   └── README.md              # 👉 Backend Documentation
│
├── .gitignore
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (for frontend)
- **Python 3.11+** (for backend)
- **Docker & Docker Compose** (optional, for local development)
- **Google Cloud Project** with Firestore, Pub/Sub, and Firebase

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/todak2000/flowshare-v2.git
cd flowshare-v2
```

#### 2. Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**Backend runs on**: `http://localhost:8000`

📖 **See detailed setup**: [backend/README.md](./backend/README.md)

#### 3. Start Frontend

```bash
cd frontend
yarn install  # or npm install
yarn dev      # or npm run dev
```

**Frontend runs on**: `http://localhost:3000`

📖 **See detailed setup**: [frontend/README.md](./frontend/README.md)

---

## 📚 Documentation

### Detailed Documentation

- **[Backend Documentation](./backend/README.md)** - API endpoints, AI agents, allocation engine, deployment
- **[Frontend Documentation](./frontend/README.md)** - Components, routing, state management, styling

### Key Features Documentation

**Backend**:
- REST API (12 routers)
- AI Agent Infrastructure
- API MPMS 11.1 Allocation Engine
- Event-Driven Architecture
- Multi-Tenant Security
- SCADA Integration

**Frontend**:
- Next.js 15 App Router
- Server & Client Components
- Real-time Validation
- Dark/Light Mode
- Role-Based UI
- Excel Export

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/unit/ -v
```

✅ **44 tests passing** - See [backend/TEST_REPORT.md](./backend/TEST_REPORT.md)

### Frontend Tests

```bash
cd frontend
yarn test --run
```

✅ **120 tests passing** - See [frontend/TEST_REPORT.md](./frontend/TEST_REPORT.md)

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI, Framer Motion
- **State**: TanStack Query, Zustand
- **Forms**: React Hook Form, Zod
- **Auth**: Firebase Authentication

### Backend
- **Framework**: FastAPI, Python 3.11+
- **Database**: Google Cloud Firestore
- **Events**: Google Cloud Pub/Sub
- **AI**: Google Gemini API, Vertex AI
- **Auth**: Firebase Admin SDK

### Infrastructure
- **Cloud**: Google Cloud Platform
- **Database**: Firestore (NoSQL)
- **Messaging**: Pub/Sub
- **AI**: Gemini API
- **Storage**: Cloud Storage
- **Email**: ZeptoMail

---

## 🔑 Key Features

### 1. Production Data Management
- Submit and track daily production data
- AI-powered anomaly detection
- Real-time validation and approval workflow
- Partner-specific data access

### 2. Automated Reconciliation
- API MPMS 11.1 allocation calculations
- One-click reconciliation trigger
- Detailed allocation breakdown per partner
- Excel export with step-by-step calculations
- AI-generated insights

### 3. Team Management
- Multi-role access control (Coordinator, Partner, Field Operator, Auditor)
- Email invitation system
- Notification preferences
- Partner limit enforcement based on subscription

### 4. Analytics
- Production trend analysis
- Shrinkage tracking
- Partner breakdown visualizations

### 5. SCADA Integration
- API key-based authentication
- Automated data ingestion
- Test/production environment support
- Complete API documentation

### 6. FlowshareGPT
- AI chat interface powered by Gemini
- Context-aware data analysis
- Natural language queries about production data

---

## 🔒 Security Features

- ✅ Firebase Authentication with JWT tokens
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenant data isolation
- ✅ API key authentication for SCADA
- ✅ Input validation and sanitization
- ✅ XSS prevention
- ✅ Rate limiting
- ✅ Security headers (CSP, HSTS)
- ✅ Audit logging

---

## 📊 Subscription Plans

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Partners** | 5 | 15 | Unlimited |
| **Reconciliations/Month** | 12 | 50 | Unlimited |
| **Analytics** | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ✅ | ✅ |
| **Support** | Email | Priority | Dedicated |
| **Price** | Free | $149/mo | $399/mo |

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd frontend
yarn build
vercel --prod
```

### Backend (Google Cloud Run)

```bash
cd backend
docker build -t gcr.io/flowshare-v2/api:latest .
docker push gcr.io/flowshare-v2/api:latest
gcloud run deploy flowshare-api --image gcr.io/flowshare-v2/api:latest
```

📖 **Detailed deployment instructions**: See [backend/README.md](./backend/README.md#deployment) and [frontend/README.md](./frontend/README.md#deployment)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Keep commits atomic and well-described

---

## 📝 License

Copyright © 2025 FlowShare V2. All rights reserved.

---

## 📞 Support

For questions, issues, or support:

- **Documentation**: [Backend README](./backend/README.md) | [Frontend README](./frontend/README.md)
- **Issues**: [GitHub Issues](https://github.com/todak2000/flowshare-v2/issues)
- **Email**: support@flowshare.com

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration features
- [ ] Advanced reporting dashboard
- [ ] Integration with more SCADA systems
- [ ] Multi-language support
- [ ] Blockchain-based audit trail
- [ ] Advanced ML models for forecasting

---

