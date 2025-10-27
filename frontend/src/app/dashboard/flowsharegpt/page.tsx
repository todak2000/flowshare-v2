"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { PageLoader } from "@/components/layout/PageLoader";
import { FlowshareGPTChat } from "@/components/flowsharegpt/flowsharegpt-chat";

export default function FlowshareGPTPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <PageLoader message="Loading FlowshareGPT..." />;
  }

  return (
    <div className="h-screen flex flex-col">
      <FlowshareGPTChat user={user} />
    </div>
  );
}
