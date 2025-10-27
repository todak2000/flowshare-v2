"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import { Logo } from "@/components/layout/Logo";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Logo />

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                How It Works
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Pricing
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {isAuthenticated ? (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/payment/select-plan">
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <div className="container mx-auto relative">
          <div className="max-w-5xl mx-auto text-center">
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-2 text-sm font-medium shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-2 inline-block" />
              AI-Powered Reconciliation Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Hydrocarbon Allocation,
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent">
                Automated & Precise
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform weeks of manual reconciliation into minutes with
              AI-powered automation.
              <span className="block mt-2 text-lg">
                API MPMS 11.1 compliant • Real-time anomaly detection •
                Production-grade accuracy
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/payment/select-plan">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg px-10 py-7 rounded-xl shadow-xl shadow-primary/20 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-7 rounded-xl border-2"
                >
                  Watch Demo
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-violet-600 to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-primary-foreground">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold">95%</div>
              <div className="text-primary-foreground/80 font-medium">
                Faster Processing
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold">99.9%</div>
              <div className="text-primary-foreground/80 font-medium">
                Accuracy Rate
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold">500+</div>
              <div className="text-primary-foreground/80 font-medium">
                JVs Managed
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold">$2M+</div>
              <div className="text-primary-foreground/80 font-medium">
                Saved Annually
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for Modern Operations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to streamline joint venture reconciliation and
              eliminate manual errors
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Lightning Fast</CardTitle>
                <CardDescription className="text-base">
                  95% reduction in reconciliation time
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Automated data ingestion, validation, and calculation using
                industry-standard API MPMS 11.1 allocation formulas. Process
                hundreds of entries in seconds.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  AI-Powered Intelligence
                </CardTitle>
                <CardDescription className="text-base">
                  Proactive anomaly detection & forecasting
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Machine learning validates every entry in real-time and predicts
                production trends using Google Vertex AI. Catch errors before
                they become costly.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Enterprise Security</CardTitle>
                <CardDescription className="text-base">
                  Multi-tenant, role-based, fully auditable
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Bank-grade encryption, secure data isolation, granular
                permissions, and complete audit trails. Export to Excel for
                verification and compliance.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Real-Time Analytics</CardTitle>
                <CardDescription className="text-base">
                  Interactive dashboards & insights
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Visualize production trends, partner allocations, and shrinkage
                analysis with interactive charts. Make data-driven decisions
                instantly.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Database className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">SCADA Integration</CardTitle>
                <CardDescription className="text-base">
                  Seamless data synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Connect directly to your SCADA systems via secure APIs.
                Automatic data ingestion eliminates manual entry and reduces
                human error to zero.
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Bell className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Smart Notifications</CardTitle>
                <CardDescription className="text-base">
                  Stay informed, automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Customizable email alerts for anomalies, reconciliation
                completion, and critical events. Keep all stakeholders informed
                without lifting a finger.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4">
              Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, automated, accurate
            </p>
          </div>
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row items-start gap-8 group">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary to-violet-600 text-primary-foreground rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold">
                  Connect Your Data Sources
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Integrate with SCADA systems or upload production data via our
                  secure API. Support for manual entry, CSV imports, and
                  real-time feeds.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start gap-8 group">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary to-violet-600 text-primary-foreground rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold">
                  AI Validates Every Entry
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Our Auditor Agent analyzes each production entry using machine
                  learning to detect anomalies, outliers, and potential errors
                  before they impact your reconciliation.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start gap-8 group">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary to-violet-600 text-primary-foreground rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold">
                  Automated Allocation Calculation
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Our Accountant Agent applies API MPMS 11.1 formulas to
                  calculate partner allocations with production-grade accuracy,
                  including BSW, temperature, and API gravity corrections.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start gap-8 group">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary to-violet-600 text-primary-foreground rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                4
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold">
                  Stakeholder Notifications
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Automatic email notifications sent to coordinators and
                  partners with detailed reports, Excel exports, and allocation
                  breakdowns. Full transparency for all parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground">
              See what operators are saying about FlowShare
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="pt-8">
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-warning text-xl">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  "FlowShare reduced our monthly reconciliation from 3 weeks to
                  2 hours. The AI catches errors we used to miss, saving us
                  thousands monthly."
                </p>
                <div className="font-bold text-lg">Sarah Johnson</div>
                <div className="text-sm text-muted-foreground">
                  Production Manager, Apex Energy
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="pt-8">
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-warning text-xl">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  "The SCADA integration is seamless. We went from manual
                  spreadsheets to fully automated reconciliation. Game changer
                  for our operations."
                </p>
                <div className="font-bold text-lg">Michael Chen</div>
                <div className="text-sm text-muted-foreground">
                  Operations Director, Titan Oil & Gas
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="pt-8">
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-warning text-xl">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  "Finally, a reconciliation platform that understands API MPMS
                  11.1. Accurate, fast, and the partner portal keeps everyone on
                  the same page."
                </p>
                <div className="font-bold text-lg">David Martinez</div>
                <div className="text-sm text-muted-foreground">
                  JV Coordinator, Summit Resources
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your operation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardHeader className="space-y-4">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription className="text-base">
                  Perfect for small joint ventures
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">$499</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success shrink-0" />
                    <span className="text-muted-foreground">
                      Up to 200 production entries/month
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success shrink-0" />
                    <span className="text-muted-foreground">
                      API MPMS 11.1 calculations
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      AI anomaly detection
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Email notifications
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">Excel export</span>
                  </li>
                </ul>
                <Link href="/payment/select-plan">
                  <Button className="w-full" variant="outline" size="lg">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-4 border-primary shadow-2xl relative scale-105">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <Badge className="px-6 py-2 text-sm shadow-lg">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="space-y-4 pt-8">
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription className="text-base">
                  For growing operations
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">$999</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Up to 800 production entries/month
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      SCADA API integration
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Advanced forecasting
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Priority support
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Custom allocation models
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Multi-tenant management
                    </span>
                  </li>
                </ul>
                <Link href="/payment/select-plan">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 shadow-lg"
                    size="lg"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardHeader className="space-y-4">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription className="text-base">
                  For large-scale operations
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Unlimited entries
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Dedicated account manager
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Custom integrations
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">SLA guarantee</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      On-premise deployment
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">
                      White-label options
                    </span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" size="lg">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-primary via-violet-600 to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Ready to Revolutionize Your Reconciliation?
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Join hundreds of operators who have eliminated manual
            reconciliation. Start your 14-day free trial today.
          </p>
          <Link href="/payment/select-plan">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-12 py-7 rounded-xl shadow-2xl group"
            >
              Start Free Trial - No Credit Card Required
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-sm mt-8 opacity-75">
            Questions? Email us at sales@flowshare.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered hydrocarbon allocation for the modern oil & gas
                industry.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    API Reference
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 FlowShare V2. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
