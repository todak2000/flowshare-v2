"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import { Logo } from "@/components/layout/Logo";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const slideInLeft = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const slideInRight = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

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
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Logo />

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
              <Link
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
              >
                How It Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {isAuthenticated ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </motion.div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost">Sign In</Button>
                    </motion.div>
                  </Link>
                  <Link href="/payment/select-plan">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        Get Started Free
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
        />

        <div className="container mx-auto relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div variants={fadeIn}>
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                <Sparkles className="w-4 h-4 mr-2 inline-block" />
                AI-Powered Reconciliation Platform
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
            >
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Hydrocarbon Allocation,
              </span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent inline-block"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% auto",
                }}
              >
                Automated & Precise
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Transform weeks of manual reconciliation into minutes with
              AI-powered automation.
              <span className="block mt-2 text-lg">
                API MPMS 11.1 compliant • Real-time anomaly detection •
                Production-grade accuracy
              </span>
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link href="/payment/select-plan">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-lg px-10 py-7 rounded-xl shadow-xl shadow-primary/20 group"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#demo">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 py-7 rounded-xl border-2"
                  >
                    Watch Demo
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              {["No credit card required", "14-day free trial", "Cancel anytime"].map((text, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Check className="h-4 w-4 text-success" />
                  <span>{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="py-20 bg-gradient-to-br from-primary via-violet-600 to-primary relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-primary-foreground">
            {[
              { value: "95%", label: "Faster Processing" },
              { value: "99.9%", label: "Accuracy Rate" },
              { value: "500+", label: "JVs Managed" },
              { value: "$2M+", label: "Saved Annually" },
            ].map((stat, i) => (
              <motion.div key={i} variants={scaleIn} className="space-y-2">
                <motion.div
                  className="text-5xl md:text-6xl font-bold"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-primary-foreground/80 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
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
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {[
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
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeIn}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group bg-card/50 backdrop-blur h-full">
                    <CardHeader>
                      <motion.div
                        className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon className="h-7 w-7 text-primary" />
                      </motion.div>
                      <CardTitle className="text-2xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.desc}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                      {feature.detail}
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <Badge variant="secondary" className="mb-4">
              Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, automated, accurate
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-16">
            {[
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
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={i % 2 === 0 ? slideInLeft : slideInRight}
                className="flex flex-col md:flex-row items-start gap-8 group"
              >
                <motion.div
                  className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary to-violet-600 text-primary-foreground rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {item.step}
                </motion.div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-2xl md:text-3xl font-bold">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <Badge variant="secondary" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground">
              See what operators are saying about FlowShare
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {[
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
            ].map((testimonial, i) => (
              <motion.div key={i} variants={fadeIn}>
                <motion.div
                  whileHover={{ y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="border-2 hover:shadow-xl transition-all h-full">
                    <CardContent className="pt-8">
                      <div className="flex mb-6">
                        {[...Array(5)].map((_, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-warning text-xl"
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                      <div className="font-bold text-lg">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your operation
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {/* Starter Plan */}
            <motion.div variants={scaleIn}>
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 hover:shadow-xl transition-all h-full">
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
                      {[
                        "Up to 200 production entries/month",
                        "API MPMS 11.1 calculations",
                        "AI anomaly detection",
                        "Email notifications",
                        "Excel export",
                      ].map((feature, i) => (
                        <motion.li
                          key={i}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Check className="h-5 w-5 text-success shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <Link href="/payment/select-plan">
                      <Button className="w-full" variant="outline" size="lg">
                        Start Free Trial
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Professional Plan (Popular) */}
            <motion.div variants={scaleIn}>
              <motion.div
                whileHover={{ scale: 1.05, y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-4 border-primary shadow-2xl relative scale-105 h-full">
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-5 left-1/2 transform -translate-x-1/2"
                  >
                    <Badge className="px-6 py-2 text-sm shadow-lg">
                      Most Popular
                    </Badge>
                  </motion.div>
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
                      {[
                        "Up to 800 production entries/month",
                        "SCADA API integration",
                        "Advanced forecasting",
                        "Priority support",
                        "Custom allocation models",
                        "Multi-tenant management",
                      ].map((feature, i) => (
                        <motion.li
                          key={i}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Check className="h-5 w-5 text-success flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </motion.li>
                      ))}
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
              </motion.div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div variants={scaleIn}>
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 hover:shadow-xl transition-all h-full">
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
                      {[
                        "Unlimited entries",
                        "Dedicated account manager",
                        "Custom integrations",
                        "SLA guarantee",
                        "On-premise deployment",
                        "White-label options",
                      ].map((feature, i) => (
                        <motion.li
                          key={i}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Check className="h-5 w-5 text-success flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <Button className="w-full" variant="outline" size="lg">
                      Contact Sales
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-32 px-6 bg-gradient-to-br from-primary via-violet-600 to-primary text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent blur-3xl"
        />
        <div className="container mx-auto text-center relative">
          <motion.h2
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-8"
          >
            Ready to Revolutionize Your Reconciliation?
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed"
          >
            Join hundreds of operators who have eliminated manual reconciliation.
            Start your 14-day free trial today.
          </motion.p>
          <Link href="/payment/select-plan">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-12 py-7 rounded-xl shadow-2xl group"
              >
                Start Free Trial - No Credit Card Required
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.75 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-sm mt-8"
          >
            Questions? Email us at sales@flowshare.com
          </motion.p>
        </div>
      </motion.section>

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
                {["Features", "Pricing", "Documentation", "API Reference"].map(
                  (item, i) => (
                    <li key={i}>
                      <Link
                        href={`#${item.toLowerCase()}`}
                        className="hover:text-primary transition-colors flex items-center gap-1 group"
                      >
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {["About Us", "Careers", "Blog", "Contact"].map((item, i) => (
                  <li key={i}>
                    <Link
                      href="#"
                      className="hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {["Privacy Policy", "Terms of Service", "Security", "Compliance"].map(
                  (item, i) => (
                    <li key={i}>
                      <Link
                        href="#"
                        className="hover:text-primary transition-colors flex items-center gap-1 group"
                      >
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {item}
                      </Link>
                    </li>
                  )
                )}
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
