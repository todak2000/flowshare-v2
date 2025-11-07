"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { LandingNavigation } from "@/components/landing-page/landing-navigation";
import { HeroSection } from "@/components/landing-page/hero-section";
import { PricingSection } from "@/components/landing-page/pricing-section";
import { LandingFooter } from "@/components/landing-page/landing-footer";
import { SeoSchema } from "@/components/landing-page/seo-schema";
import { FeaturesSection } from "@/components/landing-page/features-section";
import { StatsSection } from "@/components/landing-page/stats-section";
import { AIAgentsSection } from "@/components/landing-page/ai-agents-section";
import { FlowshareGptSection } from "@/components/landing-page/flowsharegpt-section";
import { HowItWorksSection } from "@/components/landing-page/how-it-works-section";
import { TestimonialsSection } from "@/components/landing-page/testimonials-section";
import { UseCasesSection } from "@/components/landing-page/use-cases-section";
import { RoiCalculatorSection } from "@/components/landing-page/roi-calculator-section";
import { TrustSecuritySection } from "@/components/landing-page/trust-security-section";
import { ScadaIntegrationSection } from "@/components/landing-page/scada-integration-section";
import { FinalCtaSection } from "@/components/landing-page/final-cta-section";
import { FaqSection } from "@/components/landing-page/faq-section";
import { ExplainerVideoSection } from "@/components/landing-page/explainer-video-section";
import { DemoVideoSection } from "@/components/landing-page/demo-video-section";

export default function LandingPage() {
  const { user } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      <LandingNavigation isAuthenticated={isAuthenticated} />
      <HeroSection />
      <StatsSection />
      <ExplainerVideoSection />
      <AIAgentsSection />
      <FlowshareGptSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoVideoSection />
      <TestimonialsSection />
      <UseCasesSection />
      <RoiCalculatorSection />
      <TrustSecuritySection />
      <ScadaIntegrationSection />
      <PricingSection />
      <FinalCtaSection />
      <FaqSection />
      <LandingFooter />
      <SeoSchema />
    </div>
  );
}
