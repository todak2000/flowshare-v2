"use client";

import { UserProfile } from "@/store/auth-store";
import { useSCADADocs } from "@/hooks/useSCADADocs";
import { SCADADocsHeader } from "./scada-docs-header";
import { SCADADocsSidebar } from "./scada-docs-sidebar";
import { SCADADocsOverview } from "./scada-docs-overview";
import { SCADADocsEnvironments } from "./scada-docs-environments";
import { SCADADocsAuthentication } from "./scada-docs-authentication";
import { SCADADocsInteractiveTest } from "./scada-docs-interactive-test";
import { SCADADocsCodeExamples } from "./scada-docs-code-examples";
import { SCADADocsApiReference } from "./scada-docs-api-reference";
import { SCADADocsErrorHandling } from "./scada-docs-error-handling";

interface SCADADocsContentProps {
  user: UserProfile | null;
}

export function SCADADocsContent({ user }: SCADADocsContentProps) {
  const {
    selectedLanguage,
    setSelectedLanguage,
    testApiKey,
    setTestApiKey,
    testPartnerId,
    setTestPartnerId,
    partners,
    loadingPartners,
    testData,
    setTestData,
    testResponse,
    testing,
    testError,
    handleTestAPI,
    copyCode,
    getCodeExamples,
  } = useSCADADocs(user);

  const codeExamples = getCodeExamples();

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <SCADADocsHeader />

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <SCADADocsSidebar />
          </div>

          {/* Main Content - Full width on mobile */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            <SCADADocsOverview />

            <SCADADocsEnvironments />

            <SCADADocsAuthentication
              testApiKey={testApiKey}
              onApiKeyChange={setTestApiKey}
            />

            <SCADADocsInteractiveTest
              testApiKey={testApiKey}
              onApiKeyChange={setTestApiKey}
              testPartnerId={testPartnerId}
              onPartnerIdChange={setTestPartnerId}
              partners={partners}
              loadingPartners={loadingPartners}
              testData={testData}
              onTestDataChange={setTestData}
              testResponse={testResponse}
              testing={testing}
              testError={testError}
              onTestAPI={handleTestAPI}
              onCopyCode={copyCode}
              userRole={user?.role}
            />

            <SCADADocsCodeExamples
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              codeExamples={codeExamples}
              onCopyCode={copyCode}
            />

            <SCADADocsApiReference />

            <SCADADocsErrorHandling />
          </div>
        </div>
      </div>
    </div>
  );
}
