"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

// ✅ Define Plan type for safety
export interface Plan {
  id: string;
  name: string;
  price: number | null;
  description: string;
  maxPartners: number;
  maxEntries: number;
  popular?: boolean;
  features: string[];
}

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 499,
    description: "Perfect for small joint ventures",
    maxPartners: 5,
    maxEntries: 100,
    features: [
      "Up to 5 partners",
      "Up to 200 production entries/month",
      "API MPMS 11.1 calculations",
      "AI anomaly detection",
      "Email notifications",
      "Excel export",
      "Basic support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 999,
    description: "For growing operations",
    maxPartners: 20,
    maxEntries: 500,
    popular: true,
    features: [
      "Up to 20 partners",
      "Up to 800 production entries/month",
      "SCADA API integration",
      "Advanced forecasting",
      "Priority support",
      "Custom allocation models",
      "Multi-tenant management",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "For large-scale operations",
    maxPartners: -1,
    maxEntries: -1,
    features: [
      "Unlimited partners",
      "Unlimited entries",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment",
      "White-label options",
      "24/7 phone support",
    ],
  },
];

// ✅ Define Plan type
export interface Plann {
  name: string;
  price: number | null;
  maxPartners: number;
  maxEntries: number;
}

export const PLANS: Record<string, Plann> = {
  starter: {
    name: 'Starter',
    price: 499,
    maxPartners: 5,
    maxEntries: 100,
  },
  professional: {
    name: 'Professional',
    price: 999,
    maxPartners: 20,
    maxEntries: 500,
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    maxPartners: -1,
    maxEntries: -1,
  },
};

// ✨ Extract included features (DRY)
export const INCLUDED_FEATURES = [
  "14-day free trial period",
  "API MPMS 11.1 calculations",
  "AI-powered anomaly detection",
  "Email notifications & alerts",
  "Excel export for auditing",
  "Cancel anytime, no commitment"
];

// ✨ Extract PlanCard component (local, KISS)
export function PlanCard({
  plan,
  isSelected,
  onSelect,
  onContactSales,
}: {
  plan: Plan;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onContactSales: () => void;
}) {
  const isPopular = plan.popular;
  const isEnterprise = plan.price === null;

  return (
    <Card
      className={`border-2 hover:shadow-xl transition-all ${
        isPopular ? "border-primary shadow-2xl relative scale-105" : ""
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
          <Badge className="px-6 py-2 text-sm shadow-lg">Most Popular</Badge>
        </div>
      )}
      <CardHeader className={`space-y-4 ${isPopular ? "pt-8" : ""}`}>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-base">
          {plan.description}
        </CardDescription>
        <div className="pt-4">
          {isEnterprise ? (
            <span className="text-5xl font-bold">Custom</span>
          ) : (
            <>
              <span className="text-5xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground text-lg">/month</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-success flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        {isEnterprise ? (
          <Button
            onClick={onContactSales}
            className="w-full"
            variant="outline"
            size="lg"
          >
            Contact Sales
          </Button>
        ) : (
          <Button
            onClick={() => onSelect(plan.id)}
            className={`w-full ${
              isPopular ? "bg-primary hover:bg-primary/90 shadow-lg" : ""
            }`}
            variant={isPopular ? "default" : "outline"}
            size="lg"
          >
            Start Free Trial
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
