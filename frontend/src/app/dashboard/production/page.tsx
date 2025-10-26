"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { PageLoader } from "@/components/layout/PageLoader";
import { ProductionDataContent } from "@/components/production/production-data-content";

export default function ProductionPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <PageLoader message="Loading production data..." />;
  }

  return <ProductionDataContent user={user} />;
}