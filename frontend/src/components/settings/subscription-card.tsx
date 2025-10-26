import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Crown } from "lucide-react";

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_LIMITS: Record<
  string,
  { maxPartners: number; maxEntries: number; price: number | null }
> = {
  starter: { maxPartners: 5, maxEntries: 200, price: 499 },
  professional: { maxPartners: 20, maxEntries: 800, price: 999 },
  enterprise: { maxPartners: -1, maxEntries: -1, price: null },
};

interface SubscriptionCardProps {
  subscriptionPlan: string;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscriptionPlan,
}) => {
  const currentPlan = PLAN_LIMITS[subscriptionPlan] || PLAN_LIMITS.starter;
  const planName = PLAN_NAMES[subscriptionPlan] || "Starter";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Subscription Plan</CardTitle>
        </div>
        <CardDescription>Your current plan and limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-lg">{planName}</p>
              {currentPlan.price !== null ? (
                <p className="text-sm text-muted-foreground">
                  ${currentPlan.price}/month
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Custom Pricing</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/payment/select-plan">Upgrade Plan</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Max Partners</p>
            <p className="text-2xl font-bold">
              {currentPlan.maxPartners === -1
                ? "Unlimited"
                : currentPlan.maxPartners}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Max Entries/Month
            </p>
            <p className="text-2xl font-bold">
              {currentPlan.maxEntries === -1
                ? "Unlimited"
                : currentPlan.maxEntries}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};