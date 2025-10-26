"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useAuthActions } from "@/hooks/useAuthActions";
import { OrganizationCard } from "@/components/settings/organization-card";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { SettingsForm } from "@/components/settings/form";
import { LogoutModal } from "@/components/settings/logout-modal";
import { PageLoader } from "@/components/layout/PageLoader";

export default function SettingsPage() {
  const router = useRouter();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Call the hooks to get state and handlers
  const {
    tenant,
    formData,
    loading,
    saving,
    error,
    success,
    handleSaveSettings,
    handleInputChange,
  } = useTenantSettings();

  const { loggingOut, handleLogout } = useAuthActions();

  // --- Render States ---
  if (loading) {
    // Return a full-page loader
    return (
      <PageLoader />
    );
  }

  if (!tenant) {
    // Return a full-page error
    return <p>Failed to load tenant information</p>;
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <OrganizationCard tenant={tenant} />

          <SubscriptionCard subscriptionPlan={tenant.subscription_plan} />

          <SettingsForm formData={formData} onFormChange={handleInputChange} />

          {/* Error/Success Messages */}
          {error && (
            // <ErrorAlert message={error} />
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            // <SuccessAlert message={success} />
            <div className="p-4 border border-success/50 bg-success/10 rounded-lg">
              <p className="text-sm text-success">{success}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>

      <LogoutModal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
    </div>
  );
}
