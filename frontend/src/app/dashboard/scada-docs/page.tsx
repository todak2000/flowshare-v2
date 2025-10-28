"use client";

import { useAuthStore } from "@/store/auth-store";
import { SCADADocsContent } from "@/components/scada-docs/scada-docs-content";

export default function SCADADocsPage() {
  const { user } = useAuthStore();

  return <SCADADocsContent user={user} />;
}
