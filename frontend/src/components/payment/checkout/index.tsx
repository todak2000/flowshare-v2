"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Lock, Check } from "lucide-react";
import { INCLUDED_FEATURES, PLANS } from "../components";
import { formatLimit } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";

export function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "starter";
  const plan = PLANS[planId] || PLANS.starter;

  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "4242 4242 4242 4242",
    expiryDate: "12/25",
    cvv: "123",
    cardholderName: "John Doe",
  });

  const handleInputChange = (
    field: keyof typeof paymentData,
    value: string
  ) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // mock delay

    sessionStorage.setItem("paymentCompleted", "true");
    sessionStorage.setItem("selectedPlan", planId);
    sessionStorage.setItem(
      "paymentData",
      JSON.stringify({
        plan: planId,
        amount: plan.price,
        cardLast4: paymentData.cardNumber.replace(/\s+/g, "").slice(-4),
        timestamp: new Date().toISOString(),
      })
    );

    setLoading(false);
    router.push("/auth/register");
  };

  // Prevent enterprise users from reaching this page (optional safety)
  if (plan.price === null) {
    useEffect(() => {
      router.push("/payment/select-plan");
    }, [router]);
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      {/* Header */}
      <AppHeader backHref="/payment/select-plan" backLabel="Back to Plans" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Checkout
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Complete Your Payment</h1>
          <p className="text-muted-foreground">
            Secure mock payment • 14-day free trial included
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription>
                Enter your payment details below (Mock Payment)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={(e) =>
                    handleInputChange("cardNumber", e.target.value)
                  }
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={(e) =>
                      handleInputChange("expiryDate", e.target.value)
                    }
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={paymentData.cvv}
                    onChange={(e) => handleInputChange("cvv", e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  value={paymentData.cardholderName}
                  onChange={(e) =>
                    handleInputChange("cardholderName", e.target.value)
                  }
                  placeholder="John Doe"
                />
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 shadow-lg"
                size="lg"
              >
                {loading ? "Processing..." : `Pay $${plan.price}/month`}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By completing payment, you agree to our Terms of Service and
                Privacy Policy
              </p>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="border-2 sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your selected plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">
                    {plan.name} Plan
                  </span>
                  <Badge>{`$${plan.price}/mo`}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatLimit(plan.maxPartners)} partners •{" "}
                  {formatLimit(plan.maxEntries)} entries/month
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">What's included:</h4>
                <ul className="space-y-2">
                  {INCLUDED_FEATURES.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${plan.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    14-day trial discount
                  </span>
                  <span className="text-success">-${plan.price}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Due today</span>
                  <span>$0.00</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  You'll be charged ${plan.price} after your 14-day trial ends
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
