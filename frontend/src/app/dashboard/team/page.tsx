import { PageLoader } from "@/components/layout/PageLoader";
import { TeamManagementContent } from "@/components/team";
import { Suspense } from "react";

export default function TeamManagementPage() {
  return (
    <Suspense
      fallback={
        <PageLoader />
      }
    >
      <TeamManagementContent />
    </Suspense>
  );
}
