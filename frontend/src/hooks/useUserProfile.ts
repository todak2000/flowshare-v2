import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, UserProfile } from "@/store/auth-store"; // Import UserProfile

// Define the shape for notification settings
interface NotificationSettings {
  email_reports: boolean;
  email_anomaly_alerts: boolean;
}

// Define the shape for the form data
interface ProfileFormData {
  full_name: string;
  phone_number: string;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email_reports: true,
  email_anomaly_alerts: true,
};

export function useUserProfile() {
  // 1. Connect to the global auth store
  const { user: storeUser, updateUser: updateStoreUser } = useAuthStore();

  // 2. Local state for the page
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 3. Form state, initialized from the store user
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: storeUser?.full_name ?? "",
    phone_number: storeUser?.phone_number ?? "",
  });
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(
      storeUser?.notification_settings ?? DEFAULT_NOTIFICATIONS
    );

  // 4. Data fetching logic
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<UserProfile>("/api/auth/me");

      // Update local form state
      setFormData({
        full_name: data.full_name ?? "",
        phone_number: data.phone_number ?? "",
      });
      setNotificationSettings(
        data.notification_settings ?? DEFAULT_NOTIFICATIONS
      );

      // Update the global store
      updateStoreUser(data);
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Fetch fresh data on mount
  useEffect(() => {
    loadUserProfile();
    // We only want this to run once on mount, so we disable the linter warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6. Form handlers
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (success) setSuccess(""); // Clear success message on change
  };

  const handleNotificationChange = (
    field: keyof NotificationSettings,
    value: boolean
  ) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }));
    if (success) setSuccess("");
  };

  // 7. Save logic
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiClient.patch("/api/users/me", {
        ...formData,
        notification_settings: notificationSettings,
      });

      setSuccess("Profile updated successfully!");
      // Reload profile to get fresh data and update the global store
      await loadUserProfile();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    user: storeUser, // Provide the user from the store
    loading,
    saving,
    error,
    success,
    formData,
    notificationSettings,
    handleSaveProfile,
    handleInputChange,
    handleNotificationChange,
  };
}