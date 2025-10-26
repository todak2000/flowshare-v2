import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"; // Adjust paths as needed
import { Badge } from "@/components/ui/badge";

// 1. Define the type for the optional tenant prop
interface Tenant {
  subscription_plan: string;
}

// 2. Define the props for the component
interface CapacityUsageCardProps {
  /** The role of the current user (e.g., "partner") to customize the title */
  userRole: string;
  /** The current count of used seats/partners */
  currentPartnerCount: number;
  /** The maximum number of seats/partners allowed. Use -1 for unlimited. */
  maxPartners: number;
  /** Optional tenant object to display the subscription plan badge */
  tenant?: Tenant | null;
  /** The path for the "Upgrade" link. Defaults to "/dashboard/settings" */
  upgradePath?: string;
}

export const CapacityUsageCard: React.FC<CapacityUsageCardProps> = ({
  userRole,
  currentPartnerCount,
  maxPartners,
  tenant,
  upgradePath = "/dashboard/settings", // Provide a default value
}) => {
  // 3. Derive internal state from props for cleaner JSX
  const isUnlimited = maxPartners === -1;
  const isLimitReached = !isUnlimited && currentPartnerCount >= maxPartners;
  
  // Calculate percentage, ensuring no division by zero and capping at 100%
  const percentage = isUnlimited
    ? 0
    : Math.min(100, (currentPartnerCount / maxPartners) * 100);

  // Determine card title and description
  const title = `${userRole === "partner" ? "Field Operator" : "Partner"} Capacity`;
  const description = isUnlimited
    ? "Unlimited partners on your plan"
    : `${currentPartnerCount} of ${maxPartners} partners`;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {tenant && (
            <Badge variant="default" className="capitalize">
              {tenant.subscription_plan} Plan
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {/* 4. Conditionally render the progress bar section only if not unlimited */}
      {!isUnlimited && (
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                isLimitReached ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          {/* 5. Conditionally render the upgrade message */}
          {isLimitReached && (
            <p className="text-sm text-destructive mt-2">
              You've reached your partner limit.{" "}
              <Link href={upgradePath} className="underline">
                Upgrade your plan
              </Link>{" "}
              to add more partners.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};