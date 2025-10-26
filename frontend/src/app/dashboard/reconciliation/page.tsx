"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { PageLoader } from "@/components/layout/PageLoader";
import { AccessDenied } from "@/components/layout/AccessDenied";
import { ReconciliationContent } from "@/components/reconciliation/reconcilliation-content";

// Import our new components

export default function ReconciliationPage() {
  const router = useRouter();

  const {
    user: currentUser,
    isLoading: userLoading,
    getTenantId,
  } = useAuthStore();

  const tenantId = getTenantId();

  // --- Auth & Loading ---
  useEffect(() => {
    // Redirect if user is loaded and role is incorrect
    if (
      !userLoading &&
      (!currentUser || !["coordinator", "partner"].includes(currentUser.role))
    ) {
      router.push("/dashboard");
    }
  }, [currentUser, userLoading, router]);

  if (userLoading) {
    return <PageLoader message="Loading reconciliation..." />;
  }

  // This check prevents a flash of content before redirect
  if (!currentUser || !["coordinator", "partner"].includes(currentUser.role)) {
    return (
      <AccessDenied
        message="Only coordinators and partners can access reconciliation."
      />
    );
  }

  // --- Render ---
  // We've passed all checks. Render the main content component.
  // We can safely use tenantId! because the auth check implies a valid tenant.
  return <ReconciliationContent currentUser={currentUser} tenantId={tenantId!} />;
}