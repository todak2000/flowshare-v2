import {
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Database,
  Bell,
  Check,
  ArrowRight,
  BarChart3,
  Users,
  FileCheck,
  LayoutDashboard,
  ChevronRight,
  Bot,
  Brain,
  Calculator,
  Mail,
  Lock,
  Cloud,
  LineChart,
  FileSpreadsheet,
  Workflow,
  Play,
  Star,
  Building2,
  Award,
  Globe,
  Layers,
  LucideIcon,
} from "lucide-react";

// --- Types ---
export interface NavLink {
  href: string;
  label: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface AiAgent {
  icon: LucideIcon;
  name: string;
  role: string;
  color: string;
  capabilities: string[];
  trigger: string;
}

export interface GptExample {
  question: string;
  answer: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  detail: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  desc: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface UseCase {
  icon: LucideIcon;
  role: string;
  challenge: string;
  solution: string;
}

export interface RoiMetric {
  metric: string;
  before: string;
  after: string;
  savings: string;
}

export interface SecurityFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface TechBadge {
  name: string;
  icon: LucideIcon;
}

export interface ScadaFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  pricePeriod: string;
  isPopular: boolean;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline" | "ghost";
  href: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

// --- Data ---

export const navLinks: NavLink[] = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

export const heroTrialFeatures: string[] = [
  "No credit card required",
  "14-day free trial",
  "Cancel anytime",
];

export const stats: Stat[] = [
  { value: "95%", label: "Faster Processing" },
  { value: "99.9%", label: "Accuracy Rate" },
  { value: "500+", label: "JVs Managed" },
  { value: "$2M+", label: "Saved Annually" },
];

export const aiAgents: AiAgent[] = [
  {
    icon: Brain,
    name: "Auditor Agent",
    role: "Data Validation Expert",
    color: "from-blue-500 to-cyan-500",
    capabilities: [
      "Real-time anomaly detection using ML",
      "Statistical z-score analysis (>3σ)",
      "Historical pattern recognition",
      "AI-powered insights via Google Gemini",
      "Automatic flagging of suspicious entries",
    ],
    trigger: "Triggers on every production entry",
  },
  {
    icon: Calculator,
    name: "Accountant Agent",
    role: "Allocation Calculation Engine",
    color: "from-primary to-violet-600",
    capabilities: [
      "API MPMS 11.1 petroleum standards",
      "Temperature & API gravity corrections",
      "BSW% water cut calculations",
      "Partner ownership allocation",
      "Complete audit trail generation",
    ],
    trigger: "Triggers on reconciliation requests",
  },
  {
    icon: Mail,
    name: "Communicator Agent",
    role: "Notification Manager",
    color: "from-emerald-500 to-teal-500",
    capabilities: [
      "Smart email notifications",
      "Customizable alert preferences",
      "Anomaly alerts for coordinators",
      "Reconciliation report distribution",
      "Partner-specific communications",
    ],
    trigger: "Triggers on anomalies & completions",
  },
];

export const flowshareGptExamples: GptExample[] = [
  {
    question: "Why is my BSW% higher this month?",
    answer: "Context-aware analysis of your production trends",
  },
  {
    question: "Show me partner allocations for Q4",
    answer: "Instant breakdown with visualizations",
  },
  {
    question: "What anomalies were detected last week?",
    answer: "AI-generated summary with recommendations",
  },
];

export const features: Feature[] = [
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "95% reduction in reconciliation time",
    detail:
      "Automated data ingestion, validation, and calculation using industry-standard API MPMS 11.1 allocation formulas. Process hundreds of entries in seconds.",
  },
  {
    icon: TrendingUp,
    title: "AI-Powered Intelligence",
    desc: "Proactive anomaly detection & forecasting",
    detail:
      "Machine learning validates every entry in real-time and predicts production trends using Google Vertex AI. Catch errors before they become costly.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Multi-tenant, role-based, fully auditable",
    detail:
      "Bank-grade encryption, secure data isolation, granular permissions, and complete audit trails. Export to Excel for verification and compliance.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Interactive dashboards & insights",
    detail:
      "Visualize production trends, partner allocations, and shrinkage analysis with interactive charts. Make data-driven decisions instantly.",
  },
  {
    icon: Database,
    title: "SCADA Integration",
    desc: "Seamless data synchronization",
    detail:
      "Connect directly to your SCADA systems via secure APIs. Automatic data ingestion eliminates manual entry and reduces human error to zero.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Stay informed, automatically",
    detail:
      "Customizable email alerts for anomalies, reconciliation completion, and critical events. Keep all stakeholders informed without lifting a finger.",
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Connect Your Data Sources",
    desc: "Integrate with SCADA systems or upload production data via our secure API. Support for manual entry, CSV imports, and real-time feeds.",
  },
  {
    step: 2,
    title: "AI Validates Every Entry",
    desc: "Our Auditor Agent analyzes each production entry using machine learning to detect anomalies, outliers, and potential errors before they impact your reconciliation.",
  },
  {
    step: 3,
    title: "Automated Allocation Calculation",
    desc: "Our Accountant Agent applies API MPMS 11.1 formulas to calculate partner allocations with production-grade accuracy, including BSW, temperature, and API gravity corrections.",
  },
  {
    step: 4,
    title: "Stakeholder Notifications",
    desc: "Automatic email notifications sent to coordinators and partners with detailed reports, Excel exports, and allocation breakdowns. Full transparency for all parties.",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "FlowShare reduced our monthly reconciliation from 3 weeks to 2 hours. The AI catches errors we used to miss, saving us thousands monthly.",
    name: "Sarah Johnson",
    role: "Production Manager, Apex Energy",
  },
  {
    quote:
      "The SCADA integration is seamless. We went from manual spreadsheets to fully automated reconciliation. Game changer for our operations.",
    name: "Michael Chen",
    role: "Operations Director, Titan Oil & Gas",
  },
  {
    quote:
      "Finally, a reconciliation platform that understands API MPMS 11.1. Accurate, fast, and the partner portal keeps everyone on the same page.",
    name: "David Martinez",
    role: "JV Coordinator, Summit Resources",
  },
];

export const useCases: UseCase[] = [
  {
    icon: Users,
    role: "JV Coordinators",
    challenge:
      "Managing 20+ partners, reconciling 500+ entries monthly, spending weeks on manual calculations",
    solution:
      "Automate 95% of reconciliation work. Trigger reconciliation in one click. AI validates all entries before calculation. Export audit-ready reports instantly.",
  },
  {
    icon: Building2,
    role: "JV Partners",
    challenge:
      "No visibility into allocation process, disputes over calculations, delayed settlement reports",
    solution:
      "Real-time access to your production data. View allocation breakdowns with formulas shown. Get automated email reports. Chat with FlowshareGPT for instant insights.",
  },
  {
    icon: FileCheck,
    role: "Field Operators",
    challenge:
      "Manual data entry errors, no validation feedback, duplicate submissions, time-consuming paperwork",
    solution:
      "Submit via SCADA API or mobile-friendly form. AI validates every entry instantly. Get immediate feedback on anomalies. Eliminate paperwork completely.",
  },
  {
    icon: Shield,
    role: "Auditors & Compliance",
    challenge:
      "No audit trail, unclear calculation methodology, difficulty verifying allocations, regulatory risk",
    solution:
      "Complete audit trail with timestamps. Excel exports with step-by-step API MPMS 11.1 calculations. Immutable records. Regulatory compliance guaranteed.",
  },
];

export const roiMetrics: RoiMetric[] = [
  {
    metric: "Time Saved Per Reconciliation",
    before: "2-3 weeks",
    after: "2 hours",
    savings: "95% reduction",
  },
  {
    metric: "Annual Labor Cost Savings",
    before: "$200,000+",
    after: "$9,588/year",
    savings: "$190,000+",
  },
  {
    metric: "Error Rate",
    before: "5-10% manual errors",
    after: "<0.1% with AI",
    savings: "99% improvement",
  },
  {
    metric: "Reconciliations Per Year",
    before: "24 (monthly)",
    after: "52+ (weekly)",
    savings: "116% increase",
  },
];

export const securityFeatures: SecurityFeature[] = [
  {
    icon: Lock,
    title: "Multi-Tenant Isolation",
    desc: "Complete data separation between tenants with Firestore security rules",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Granular permissions - 4 user roles with scoped data access",
  },
  {
    icon: FileCheck,
    title: "Complete Audit Trail",
    desc: "Every action logged with timestamps for regulatory compliance",
  },
  {
    icon: Award,
    title: "API MPMS 11.1",
    desc: "Petroleum industry standard allocation formulas certified",
  },
];

export const techBadges: TechBadge[] = [
  { name: "Google Cloud", icon: Cloud },
  { name: "Firebase Auth", icon: Shield },
  { name: "Vertex AI", icon: Brain },
  { name: "MPMS 11.1", icon: Award },
];

export const scadaFeatures: ScadaFeature[] = [
  {
    icon: Zap,
    title: "Real-Time Data Sync",
    desc: "Production entries submitted automatically as they're measured",
  },
  {
    icon: Lock,
    title: "Secure API Keys",
    desc: "Test & production environments with revocable authentication",
  },
  {
    icon: FileSpreadsheet,
    title: "Comprehensive Docs",
    desc: "Code examples in Python, JavaScript, cURL for quick integration",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    description: "Perfect for small joint ventures",
    price: "499",
    pricePeriod: "/month",
    isPopular: false,
    features: [
      "Up to 200 production entries/month",
      "API MPMS 11.1 calculations",
      "AI anomaly detection",
      "Email notifications",
      "Excel export",
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "outline",
    href: "/payment/select-plan",
  },
  {
    name: "Professional",
    description: "For growing operations",
    price: "999",
    pricePeriod: "/month",
    isPopular: true,
    features: [
      "Up to 800 production entries/month",
      "SCADA API integration",
      "Advanced forecasting",
      "Priority support",
      "Custom allocation models",
      "Multi-tenant management",
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default",
    href: "/payment/select-plan",
  },
  {
    name: "Enterprise",
    description: "For large-scale operations",
    price: "Custom",
    pricePeriod: "",
    isPopular: false,
    features: [
      "Unlimited entries",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment",
      "White-label options",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline",
    href: "#", // Link to contact page or modal
  },
];

export const faqs: FaqItem[] = [
  {
    question: "What is API MPMS 11.1 and why does it matter?",
    answer:
      "API Manual of Petroleum Measurement Standards Chapter 11.1 is the petroleum industry standard for hydrocarbon allocation calculations. It defines how to correct volumes for temperature, pressure, API gravity, and water content. FlowShare V2 implements these formulas exactly, ensuring regulatory compliance and industry acceptance.",
  },
  {
    question: "How does the AI validation work?",
    answer:
      "Our Auditor Agent uses statistical machine learning (z-score analysis) to compare every new production entry against historical data. If an entry deviates significantly (>3 standard deviations) from expected values, it's flagged for review and analyzed by Google Gemini AI to provide context-aware insights.",
  },
  {
    question: "Can I integrate FlowShare with my existing SCADA system?",
    answer:
      "Yes! FlowShare V2 provides a secure REST API for automated data ingestion. You'll get API keys with test and production environments, comprehensive documentation, and code examples in Python, JavaScript, and cURL. Setup typically takes less than 1 hour.",
  },
  {
    question: "What happens to my data? Is it secure?",
    answer:
      "Your data is protected with bank-grade security on Google Cloud Platform. We use multi-tenant isolation (complete data separation), Firebase Authentication, role-based access control, and maintain a complete audit trail. Partners can only see their own data, while coordinators have full access to their JV.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Most customers are fully operational within 1-2 weeks. Setup involves: (1) Creating your tenant account (5 minutes), (2) Inviting partners and assigning roles (30 minutes), (3) Importing historical data or connecting SCADA (1-2 days), (4) Running your first reconciliation (5 minutes). We provide onboarding support for Professional and Enterprise plans.",
  },
  {
    question: "What if our allocation model isn't standard API MPMS 11.1?",
    answer:
      "FlowShare V2 supports custom allocation models. Professional and Enterprise plans allow you to configure calculation parameters, add custom correction factors, and implement specialized formulas. Our team can help adapt the engine to your specific requirements.",
  },
  {
    question: "Can auditors verify the calculations?",
    answer:
      "Absolutely. FlowShare V2 exports Excel workbooks with three sheets: Summary, Partner Allocations, and Step-by-Step Calculations. Every formula is shown explicitly with intermediate values, making it easy for auditors to verify accuracy and maintain compliance.",
  },
  {
    question: "What's included in the 14-day free trial?",
    answer:
      "The free trial includes full access to all features in your chosen plan (Starter or Professional). No credit card required. You can invite partners, submit production data, run reconciliations, use FlowshareGPT, and export reports. If you're not satisfied, simply cancel before the trial ends.",
  },
];

export const footerLinks: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security", href: "#" },
      { label: "Compliance", href: "#" },
    ],
  },
];

export const seoSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FlowShare V2",
  applicationCategory: "BusinessApplication",
  description:
    "AI-powered hydrocarbon allocation platform for Oil & Gas joint ventures. Automate reconciliation with 95% time savings. API MPMS 11.1 compliant.",
  operatingSystem: "Web-based",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "499",
    highPrice: "999",
    offerCount: "3",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
  },
  featureList: [
    "AI-powered anomaly detection",
    "API MPMS 11.1 compliance",
    "SCADA integration",
    "Real-time validation",
    "FlowshareGPT AI assistant",
    "Multi-tenant architecture",
    "Role-based access control",
    "Complete audit trail",
  ],
  provider: {
    "@type": "Organization",
    name: "FlowShare",
    url: "https://flowshare.com",
  },
};