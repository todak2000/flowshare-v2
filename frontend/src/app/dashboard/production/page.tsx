"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { PageLoader } from "@/components/layout/PageLoader";
import { ProductionDataContent } from "@/components/production/production-data-content";
import { Button } from "@/components/ui/button";
import { TestTube, Database } from "lucide-react";

export default function ProductionPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [environment, setEnvironment] = React.useState<"test" | "production">("production");

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <PageLoader message="Loading production data..." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Environment Toggle Banner */}
      <div className="shrink-0 border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Environment:</span>
            <div className="flex gap-2">
              <Button
                variant={environment === "production" ? "default" : "outline"}
                size="sm"
                onClick={() => setEnvironment("production")}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Live Data
              </Button>
              <Button
                variant={environment === "test" ? "default" : "outline"}
                size="sm"
                onClick={() => setEnvironment("test")}
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test Data
              </Button>
            </div>
          </div>
          {environment === "test" && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <TestTube className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Viewing Test Data</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ">
        <ProductionDataContent user={user} environment={environment} />
      </div>
    </div>
  );
}