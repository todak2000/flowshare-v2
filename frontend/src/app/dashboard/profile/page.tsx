"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProfileOverviewCard } from "@/components/profile/overview-card";
import { ProfileSettingsForm } from "@/components/profile/settings-form";
import { Alert } from "@/components/layout/Alert";
import { PageLoader } from "@/components/layout/PageLoader";

export default function ProfilePage() {
  const router = useRouter();

  // 1. Consume the hook
  const {
    user,
    loading,
    saving,
    error,
    success,
    formData,
    notificationSettings,
    handleSaveProfile,
    handleInputChange,
    handleNotificationChange,
  } = useUserProfile();

  // 2. Render loading state
  if (loading) {
    return <PageLoader />;
  }

  // 3. Render error state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Failed to load user profile</p>
      </div>
    );
  }

  // 4. Render the page
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <ProfileOverviewCard user={user} />

          <ProfileSettingsForm
            email={user.email} // Pass non-editable email
            formData={formData}
            notificationSettings={notificationSettings}
            onInputChange={handleInputChange}
            onNotificationChange={handleNotificationChange}
          />

          {/* Error/Success Messages */}
          {error && <Alert variant="destructive" message={error} />}
          {success && <Alert variant="success" message={success} />}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
