# FlowShare V2 - Frontend

> **Modern Next.js 15 Application for Automated Hydrocarbon Allocation Management**

FlowShare V2 Frontend is a production-grade web application built with Next.js 15, React 19, and TypeScript. It provides an intuitive, responsive interface for Oil & Gas joint ventures to manage production data, trigger reconciliations, and view AI-powered analytics.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Features](#features)
- [Components](#components)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Styling & Theming](#styling--theming)
- [Forms & Validation](#forms--validation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

### What is FlowShare V2 Frontend?

The frontend application provides:

- **Landing Page** - SEO-optimized marketing page with smooth animations
- **Authentication** - Firebase-based login/register with enhanced UX
- **Dashboard** - Role-based dashboard with real-time stats and activity feeds
- **Production Management** - Submit, view, and manage production data with AI validation
- **Reconciliation** - Trigger reconciliations and view detailed allocation results
- **Team Management** - Invite partners, field operators, and auditors
- **Analytics** - Production trends, forecasts, and partner breakdowns
- **FlowshareGPT** - AI chat interface for data analysis
- **SCADA Integration** - API key management and documentation

### Key Features

✅ **Server & Client Components** - Next.js 15 App Router with optimal rendering
✅ **Real-time Validation** - Instant feedback on form inputs
✅ **Responsive Design** - Mobile-first approach with Tailwind CSS
✅ **Dark/Light Mode** - Theme toggle with next-themes
✅ **Role-Based UI** - Dynamic interface based on user role
✅ **AI-Powered Insights** - Gemini-powered anomaly detection and chat
✅ **Excel Export** - Download reconciliation reports with full calculations
✅ **Smooth Animations** - Framer Motion for delightful interactions

---

## Technology Stack

### Core Framework

- **[Next.js](https://nextjs.org/) 15.1.3** - React meta-framework with App Router
- **[React](https://react.dev/) 19.0.0** - UI component library
- **[TypeScript](https://www.typescriptlang.org/) 5.7** - Static typing

### UI & Styling

- **[Tailwind CSS](https://tailwindcss.com/) 4.0** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Headless component primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React components
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark/light mode

### Data Management & API

- **[Axios](https://axios-http.com/)** - HTTP client with interceptors
- **[TanStack Query](https://tanstack.com/query/latest)** - Server state management (React Query)
- **[TanStack Table](https://tanstack.com/table/latest)** - Powerful data tables
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight client state management

### Forms & Validation

- **[React Hook Form](https://react-hook-form.com/)** - Performant form state management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Integration layer

### Charts & Visualization

- **[Recharts](https://recharts.org/)** - Composable charting library

### File Handling

- **[xlsx](https://sheetjs.com/)** - Excel file generation and parsing

### Firebase

- **[firebase](https://firebase.google.com/) 11.2.0** - Authentication and real-time features

### Development Tools

- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[ESLint](https://eslint.org/)** - Code linting

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout with theme provider
│   │   ├── page.tsx                 # Landing page
│   │   ├── error.tsx                # Global error boundary
│   │   │
│   │   ├── auth/                    # Authentication pages
│   │   │   ├── login/page.tsx      # Login page
│   │   │   └── register/page.tsx    # Registration page
│   │   │
│   │   ├── payment/                 # Payment flow
│   │   │   ├── select-plan/page.tsx # Plan selection
│   │   │   └── checkout/page.tsx    # Payment processing
│   │   │
│   │   ├── invitation/              # Invitation acceptance
│   │   │   └── [id]/page.tsx       # Accept invitation
│   │   │
│   │   └── dashboard/               # Protected dashboard
│   │       ├── layout.tsx          # Dashboard layout with sidebar
│   │       ├── page.tsx            # Dashboard home
│   │       ├── production/page.tsx  # Production data management
│   │       ├── reconciliation/page.tsx # Reconciliation management
│   │       ├── team/page.tsx       # Team management
│   │       ├── profile/page.tsx    # User profile
│   │       ├── settings/page.tsx   # Tenant settings
│   │       ├── flowsharegpt/page.tsx # AI chat
│   │       ├── scada-setup/page.tsx # SCADA API keys
│   │       ├── scada-docs/page.tsx  # SCADA documentation
│   │       └── upgrade/page.tsx    # Plan upgrade
│   │
│   ├── components/                   # React components
│   │   ├── ui/                      # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (30+ components)
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Logo.tsx
│   │   │   └── PageLoader.tsx
│   │   │
│   │   ├── auth/                    # Auth components
│   │   │   ├── EnhancedAuthInput.tsx
│   │   │   └── PasswordStrengthMeter.tsx
│   │   │
│   │   ├── production/              # Production data components
│   │   │   ├── ProductionTableWrapper.tsx
│   │   │   ├── ProductionEntryModal.tsx
│   │   │   ├── EditEntryModal.tsx
│   │   │   ├── ApproveEntryModal.tsx
│   │   │   └── AIAnalysisModal.tsx
│   │   │
│   │   ├── reconciliation/          # Reconciliation components
│   │   │   ├── ReconciliationsTable.tsx
│   │   │   ├── ReconciliationHeader.tsx
│   │   │   ├── TerminalReceiptForm.tsx
│   │   │   └── ReportViewModal.tsx
│   │   │
│   │   ├── team/                    # Team components
│   │   │   ├── TeamList.tsx
│   │   │   ├── InviteForm.tsx
│   │   │   └── PendingInvitation.tsx
│   │   │
│   │   ├── settings/                # Settings components
│   │   │   ├── SettingsForm.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   └── OrganizationCard.tsx
│   │   │
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── WelcomeHeader.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── ActionCard.tsx
│   │   │   └── RecentActivityCard.tsx
│   │   │
│   │   └── invitation/              # Invitation components
│   │       ├── InvitationCard.tsx
│   │       ├── StatusCheck.tsx
│   │       ├── Active.tsx
│   │       └── Missed.tsx
│   │
│   ├── lib/                         # Utilities & configuration
│   │   ├── firebase.ts             # Firebase initialization
│   │   ├── api-client.ts           # HTTP client with auth
│   │   ├── validation.ts           # Input validation rules
│   │   ├── error-handler.ts        # API error handling
│   │   └── utils.ts                # Helper functions
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProduction.ts
│   │   └── useReconciliation.ts
│   │
│   ├── store/                       # Zustand stores
│   │   ├── auth-store.ts           # Authentication state
│   │   └── dashboard-store.ts      # Dashboard cache
│   │
│   ├── types/                       # TypeScript interfaces
│   │   ├── user.ts
│   │   ├── production.ts
│   │   ├── reconciliation.ts
│   │   └── tenant.ts
│   │
│   └── public/                      # Static assets
│       ├── images/
│       └── favicon.ico
│
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── next.config.ts                   # Next.js configuration
├── .env.local                       # Environment variables
└── README.md                        # This file
```

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Yarn** (recommended) or npm
- **Backend API** running on `http://localhost:8000` (see backend README)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/flowshare-v2.git
cd flowshare-v2/frontend
```

#### 2. Install Dependencies

```bash
yarn install
# or
npm install
```

#### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flowshare-v2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=flowshare-v2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flowshare-v2.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

#### 4. Start Development Server

```bash
yarn dev
# or
npm run dev
```

Visit `http://localhost:3000` to see the application.

#### 5. Build for Production

```bash
yarn build
# or
npm run build
```

#### 6. Start Production Server

```bash
yarn start
# or
npm start
```

---

## Features

### 1. Landing Page

**Location**: `src/app/page.tsx`

**Features**:
- Hero section with gradient background
- Feature highlights with icons
- Pricing table with 3 tiers
- Testimonials section
- CTA buttons for sign up / demo
- Fully responsive design
- SEO optimized with metadata

### 2. Authentication

**Location**: `src/app/auth/`

**Features**:
- **Login**: Email/password with Firebase Auth
- **Register**: Sign up + create tenant
- **Invitation Accept**: Register via invitation link
- **Password Strength Meter**: Real-time password validation
- **Enhanced Inputs**: Live validation feedback
- **Error Handling**: Friendly error messages
- **Animated Particles**: Smooth background animations

**User Roles**:
- Coordinator (Admin)
- Partner
- Field Operator
- Auditor

### 3. Dashboard

**Location**: `src/app/dashboard/`

**Features**:
- **Welcome Header**: Personalized greeting with role badge
- **Stat Cards**: Total entries, reconciliations, team size, pending approvals
- **Quick Actions**: Production data entry, reconciliation trigger
- **Recent Activity**: Timeline of recent events
- **Team Overview**: Current team members with roles
- **Responsive Sidebar**: Collapsible navigation

### 4. Production Data Management

**Location**: `src/app/dashboard/production/page.tsx`

**Features**:
- **Data Table**: Sortable, filterable, paginated production entries
- **Create Entry**: Modal form with validation
- **Edit Entry**: Coordinator can edit entries
- **Approve/Reject**: Coordinator approval workflow
- **AI Analysis**: View Gemini-powered anomaly detection
- **Status Filters**: Pending, Approved, Flagged
- **Partner Filter**: Filter by partner organization
- **Date Range Filter**: Filter by measurement date

**Data Fields**:
- Gross Volume (barrels)
- BSW% (Basic Sediment & Water)
- Temperature (°F)
- API Gravity
- Pressure (psia)
- Meter Factor

### 5. Reconciliation Management

**Location**: `src/app/dashboard/reconciliation/page.tsx`

**Features**:
- **Trigger Reconciliation**: Select date range and terminal volume
- **Reconciliation History**: List of all reconciliations
- **View Results**: Detailed allocation for each partner
- **Excel Export**: Download full reconciliation report
- **AI Analysis**: Gemini-generated insights
- **Status Tracking**: Pending, Processing, Completed, Failed
- **Terminal Receipts**: Historical terminal volume entries

**Allocation Details**:
- Total Gross Volume
- Total Net Standard Volume
- Shrinkage Percentage
- Partner-wise Allocation
- Ownership Percentages
- Intermediate Calculations

### 6. Team Management

**Location**: `src/app/dashboard/team/page.tsx`

**Features**:
- **Team List**: Display all team members with roles
- **Invite Users**: Send invitations via email
- **Notification Settings**: Configure per-user email preferences
- **Pending Invitations**: View and manage pending invites
- **Role Assignment**: Partner, Field Operator, Auditor
- **Partner Limits**: Based on subscription plan

### 7. Analytics & Forecasting

**Location**: `src/app/dashboard/` (integrated)

**Features**:
- **Production Trends**: Line charts showing production over time
- **Partner Breakdown**: Pie chart of allocation percentages
- **ML Forecasting**: Vertex AI-powered production predictions
- **Shrinkage Tracking**: Historical shrinkage trends
- **Anomaly Detection**: AI-flagged entries with explanations

### 8. FlowshareGPT Chat

**Location**: `src/app/dashboard/flowsharegpt/page.tsx`

**Features**:
- **AI Chat Interface**: Ask questions about production data
- **Gemini Integration**: Powered by Google Gemini API
- **Context-Aware**: Understands reconciliation results
- **Real-time Responses**: Streaming AI responses

### 9. SCADA Integration

**Location**: `src/app/dashboard/scada-setup/` & `scada-docs/`

**Features**:
- **API Key Management**: Create, view, revoke API keys
- **Documentation**: Complete API reference for SCADA systems
- **Code Examples**: curl, Python, JavaScript examples
- **Security**: Hashed keys with last-used tracking

### 10. Settings & Profile

**Location**: `src/app/dashboard/settings/` & `profile/`

**Features**:
- **Allocation Model Selection**: API MPMS 11.1, Model B, Model C
- **Subscription Management**: View current plan and limits
- **Organization Details**: Tenant name and settings
- **User Profile**: Update name, email, phone
- **Notification Preferences**: Email reports, anomaly alerts
- **Logout**: Secure logout with confirmation

---

## Components

### UI Components (shadcn/ui)

Located in `src/components/ui/`:

- **Button** - Primary, secondary, destructive, outline variants
- **Input** - Text, email, password, number inputs
- **Select** - Dropdown select with search
- **Dialog** - Modal dialogs for forms and confirmations
- **Table** - Data tables with sorting and filtering
- **Tabs** - Tabbed navigation
- **Badge** - Status badges (approved, pending, flagged)
- **Alert** - Success, error, warning, info alerts
- **Skeleton** - Loading placeholders
- **Avatar** - User profile pictures
- **Dropdown Menu** - Context menus and action menus
- **Label** - Form field labels
- **Textarea** - Multi-line text input
- **Separator** - Horizontal/vertical dividers
- **Card** - Container for content sections
- **Sheet** - Slide-out panels

### Layout Components

Located in `src/components/layout/`:

- **Header** - Top navigation bar with user menu
- **Sidebar** - Left navigation sidebar (role-aware)
- **Logo** - FlowShare logo component
- **PageLoader** - Full-page loading spinner
- **LayoutSkeleton** - Skeleton for async data
- **Alert** - Alert notifications
- **AccessDenied** - Permission denied screen

### Feature Components

**Production** (`src/components/production/`):
- **ProductionTableWrapper** - Main data table with filters
- **ProductionEntryModal** - Form for new entries
- **EditEntryModal** - Edit existing entries
- **ApproveEntryModal** - Approve/reject workflow
- **AIAnalysisModal** - Display Gemini analysis
- **ProductionCharts** - Trend visualizations
- **ProductionDataHeader** - Header with stats

**Reconciliation** (`src/components/reconciliation/`):
- **ReconciliationsTable** - List of reconciliation runs
- **ReconciliationHeader** - Period selector & trigger button
- **TerminalReceiptForm** - Enter terminal volume
- **TerminalReceiptsTable** - Historical receipts
- **ReportViewModal** - Display results
- **ReconciliationContent** - Main page layout

**Team** (`src/components/team/`):
- **TeamList** - Display team members
- **InviteForm** - Invite users with settings
- **PendingInvitation** - Pending invites list
- **PartnerLimit** - Show partner count vs plan limit

**Settings** (`src/components/settings/`):
- **SettingsForm** - Allocation model selection
- **SubscriptionCard** - Current plan info
- **OrganizationCard** - Tenant details
- **LogoutModal** - Logout confirmation

**Dashboard** (`src/components/dashboard/`):
- **WelcomeHeader** - Greeting message
- **StatCard** - Metric display with trend
- **ActionCard** - Quick action button
- **RecentActivityCard** - Activity feed
- **TeamManagementCard** - Team overview

---

## State Management

### Zustand Stores

#### 1. Auth Store (`src/store/auth-store.ts`)

```typescript
interface AuthStore {
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  clearUser: () => void
  getUserRole: () => string | null
  isAuthenticated: boolean
}
```

**Usage**:
```typescript
import { useAuthStore } from '@/store/auth-store'

const { user, setUser, clearUser, getUserRole } = useAuthStore()
```

#### 2. Dashboard Store (`src/store/dashboard-store.ts`)

```typescript
interface DashboardStore {
  stats: DashboardStats | null
  activities: Activity[]
  teamMembers: TeamMember[]
  isLoading: boolean
  fetchDashboardData: (tenantId: string) => Promise<void>
}
```

**Usage**:
```typescript
import { useDashboardStore } from '@/store/dashboard-store'

const { stats, activities, fetchDashboardData } = useDashboardStore()
```

### Server State Management

**TanStack Query (React Query)** for API data caching:

```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['production-entries', tenantId],
  queryFn: () => apiClient.get('/api/production/entries', {
    params: { tenant_id: tenantId }
  }),
  staleTime: 60000, // 1 minute
})
```

---

## API Integration

### API Client

**Location**: `src/lib/api-client.ts`

**Features**:
- Axios instance with baseURL
- Request interceptor: Auto-adds Firebase ID token
- Response interceptor: Handles 401/403, token refresh
- Token storage: sessionStorage with expiry tracking

**Usage**:
```typescript
import { apiClient } from '@/lib/api-client'

// GET request
const entries = await apiClient.get('/api/production/entries', {
  params: { tenant_id: 'xyz', status: 'approved' }
})

// POST request
const newEntry = await apiClient.post('/api/production/entries', {
  partner_id: 'abc',
  gross_volume: 10000,
  bsw_percent: 5,
  // ...
})

// PATCH request
const updated = await apiClient.patch('/api/production/entries/123', {
  status: 'approved'
})
```

### Error Handling

**Location**: `src/lib/error-handler.ts`

```typescript
import { handleApiError } from '@/lib/error-handler'

try {
  const data = await apiClient.get('/api/production/entries')
} catch (error) {
  const friendlyMessage = handleApiError(error)
  toast.error(friendlyMessage)
}
```

---

## Authentication

### Firebase Auth Integration

**Location**: `src/lib/firebase.ts`

**Setup**:
```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ...
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

### Auth Flow

**Login**:
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const handleLogin = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await userCredential.user.getIdToken()

  // Store token for API requests
  sessionStorage.setItem('firebase_token', idToken)

  // Fetch user profile from backend
  const user = await apiClient.get('/api/auth/me')
  setUser(user)
}
```

**Register**:
```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth'

const handleRegister = async (email: string, password: string, fullName: string) => {
  // Create Firebase user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)

  // Register in backend (creates user + tenant)
  await apiClient.post('/api/auth/register', {
    email, full_name: fullName, organization: 'My Company'
  })
}
```

**Logout**:
```typescript
import { signOut } from 'firebase/auth'

const handleLogout = async () => {
  await signOut(auth)
  sessionStorage.removeItem('firebase_token')
  clearUser()
  router.push('/auth/login')
}
```

### Protected Routes

**Middleware** (`src/app/dashboard/layout.tsx`):
```typescript
'use client'

export default function DashboardLayout({ children }: { children: React.Node }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated])

  if (!user) return <PageLoader />

  return (
    <div>
      <Sidebar />
      <Header />
      <main>{children}</main>
    </div>
  )
}
```

---

## Styling & Theming

### Tailwind CSS

**Configuration** (`tailwind.config.ts`):
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ...
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### Dark/Light Mode

**Provider** (`src/app/layout.tsx`):
```typescript
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Theme Toggle**:
```typescript
import { useTheme } from 'next-themes'

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

### CSS Variables

**Global Styles** (`src/app/globals.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... */
  }
}
```

---

## Forms & Validation

### React Hook Form + Zod

**Example**: Production Entry Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const productionEntrySchema = z.object({
  gross_volume: z.number().min(1, 'Gross volume must be positive'),
  bsw_percent: z.number().min(0).max(100, 'BSW% must be between 0 and 100'),
  temperature: z.number().min(32).max(200, 'Temperature out of safe range'),
  api_gravity: z.number().min(1),
  pressure: z.number().optional(),
  meter_factor: z.number().min(0.8).max(1.2).optional(),
})

type ProductionEntryFormData = z.infer<typeof productionEntrySchema>

const ProductionEntryForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductionEntryFormData>({
    resolver: zodResolver(productionEntrySchema),
  })

  const onSubmit = async (data: ProductionEntryFormData) => {
    await apiClient.post('/api/production/entries', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('gross_volume', { valueAsNumber: true })}
        placeholder="Gross Volume (BBL)"
        error={errors.gross_volume?.message}
      />
      {/* ... other fields */}
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Validation Rules

**Location**: `src/lib/validation.ts`

```typescript
export const emailValidation = {
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: 'Invalid email format',
}

export const passwordValidation = {
  minLength: 8,
  requirements: {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[@$!%*?&]/,
  },
}

export const normalizeEmail = (email: string) => email.toLowerCase().trim()
```

---

## Deployment

### Production Build

```bash
yarn build
# or
npm run build
```

This creates an optimized production build in `.next/`.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/flowshare-v2/tree/main/frontend)

**Environment Variables on Vercel**:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Deploy to Google Cloud Run

#### 1. Build Docker Image

```bash
docker build -t gcr.io/flowshare-v2/frontend:latest .
docker push gcr.io/flowshare-v2/frontend:latest
```

#### 2. Deploy to Cloud Run

```bash
gcloud run deploy flowshare-frontend \
  --image gcr.io/flowshare-v2/frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://api.flowshare.com"
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run linting and type checking:
   ```bash
   yarn lint
   yarn type-check
   ```
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- **ESLint** for code linting
- **Prettier** for code formatting (via ESLint)
- **TypeScript** strict mode enabled
- Follow React best practices
- Use functional components with hooks
- Prefer named exports over default exports

### Commit Messages

Use conventional commits:

```
feat: Add production data export feature
fix: Correct reconciliation date picker bug
docs: Update README with deployment instructions
style: Format components with Prettier
test: Add tests for API client
```

---

## Testing

### Run All Tests

```bash
cd frontend
yarn test --run
# or
npm run test -- --run
```

### Run Tests in Watch Mode

```bash
yarn test
# or
npm run test
```

### Run Tests with UI

```bash
yarn test:ui
# or
npm run test:ui
```

### Run Specific Test File

```bash
yarn test utils.test
yarn test validation.test
yarn test error-handler.test
```

### Type Check

```bash
yarn type-check
# or
npm run type-check
```

### Test Status

✅ **All Tests Passing: 120 tests (100%)**

**Test Files**:
- `src/lib/__tests__/utils.test.ts` (51 tests) - Utility functions
- `src/lib/__tests__/validation.test.ts` (38 tests) - Input validation
- `src/lib/__tests__/error-handler.test.ts` (31 tests) - Error handling

### Test Execution Time

- Total Duration: **~2.4 seconds**
- Transform: 740ms
- Tests: 295ms

### Test Structure

```
frontend/src/
├── lib/
│   ├── __tests__/              # Unit tests
│   │   ├── utils.test.ts       # Utility functions (51 tests)
│   │   ├── validation.test.ts  # Validation (38 tests)
│   │   └── error-handler.test.ts # Error handling (31 tests)
│   ├── utils.ts
│   ├── validation.ts
│   └── error-handler.ts
├── test/
│   └── setup.ts                # Test configuration & mocks
└── vitest.config.ts             # Vitest configuration
```

### Viewing Test Report

See [TEST_REPORT.md](./TEST_REPORT.md) for detailed test documentation.

### Key Test Features

- ✅ Comprehensive coverage on core utilities (120 tests)
- ✅ Security testing (XSS prevention, sanitization)
- ✅ Edge cases (null, empty, invalid inputs)
- ✅ Fast execution (< 3 seconds)
- ✅ Proper mocking (Firebase, Next.js, DOMPurify)
- ✅ CI/CD ready

### E2E Tests (Playwright) - Coming Soon

```bash
yarn test:e2e
# or
npm run test:e2e
```

---

## License

Copyright © 2025 FlowShare V2. All rights reserved.

---

## Support

For questions or issues:

- **Email**: support@flowshare.com
- **Documentation**: https://docs.flowshare.com
- **GitHub Issues**: https://github.com/yourusername/flowshare-v2/issues

---

**Built with ❤️ for the Oil & Gas Industry**
