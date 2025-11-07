"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PlanCard, plans } from "@/components/payment/components";
import { AppHeader } from "@/components/layout/AppHeader";

export default function SelectPlanPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    sessionStorage.setItem("selectedPlan", planId);
    router.push(`/payment/checkout?plan=${planId}`);
  };

  const handleContactSales = () => {
    window.location.href =
      "mailto:todak2000@gmail.com?subject=Enterprise Plan Inquiry";
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      {/* Header */}
      <AppHeader backHref="/" backLabel="Back to Home" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the plan that fits your operation. All plans include a 14-day
            free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              onSelect={handleSelectPlan}
              onContactSales={handleContactSales}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required to
            start.
          </p>
        </div>
      </main>
    </div>
  );
}
