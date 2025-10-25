'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, Sparkles } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    description: 'Perfect for small joint ventures',
    maxPartners: 5,
    maxEntries: 100,
    features: [
      'Up to 5 partners',
      'Up to 200 production entries/month',
      'API MPMS 11.1 calculations',
      'AI anomaly detection',
      'Email notifications',
      'Excel export',
      'Basic support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 999,
    description: 'For growing operations',
    maxPartners: 20,
    maxEntries: 500,
    popular: true,
    features: [
      'Up to 20 partners',
      'Up to 800 production entries/month',
      'SCADA API integration',
      'Advanced forecasting',
      'Priority support',
      'Custom allocation models',
      'Multi-tenant management',
      'API access'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    description: 'For large-scale operations',
    maxPartners: -1,
    maxEntries: -1,
    features: [
      'Unlimited partners',
      'Unlimited entries',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment',
      'White-label options',
      '24/7 phone support'
    ]
  }
];

export default function SelectPlanPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Store selected plan in sessionStorage
    sessionStorage.setItem('selectedPlan', planId);
    // Redirect to checkout
    router.push(`/payment/checkout?plan=${planId}`);
  };

  const handleContactSales = () => {
    window.location.href = 'mailto:sales@flowshare.com?subject=Enterprise Plan Inquiry';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              FlowShare
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the plan that fits your operation. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`border-2 hover:shadow-xl transition-all ${
                plan.popular ? 'border-primary shadow-2xl relative scale-105' : ''
              } ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-6 py-2 text-sm shadow-lg">Most Popular</Badge>
                </div>
              )}
              <CardHeader className={`space-y-4 ${plan.popular ? 'pt-8' : ''}`}>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="pt-4">
                  {plan.price ? (
                    <>
                      <span className="text-5xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground text-lg">/month</span>
                    </>
                  ) : (
                    <span className="text-5xl font-bold">Custom</span>
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
                {plan.price ? (
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${
                      plan.popular ? 'bg-primary hover:bg-primary/90 shadow-lg' : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    Start Free Trial
                  </Button>
                ) : (
                  <Button onClick={handleContactSales} className="w-full" variant="outline" size="lg">
                    Contact Sales
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </main>
    </div>
  );
}
