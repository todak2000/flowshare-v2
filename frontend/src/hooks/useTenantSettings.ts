import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

// Define your types in a shared file (e.g., types/tenant.ts)
// and import them here. For this example, they are inline.
export interface TenantSettings {
  allocation_model: string;
  default_temperature_standard: number;
  default_pressure_standard: number;
}

export interface Tenant {
  id: string;
  name: string;
  subscription_plan: string;
  settings: TenantSettings;
  status: string;
}

const DEFAULT_SETTINGS: TenantSettings = {
  allocation_model: "api_mpms_11_1",
  default_temperature_standard: 60.0,
  default_pressure_standard: 14.696,
};

export function useTenantSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTenantSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Tenant>("/api/tenants/me");
      setTenant(response);
      setFormData(response.settings || DEFAULT_SETTINGS);
    } catch (err: any) {
      console.error("Failed to load tenant settings:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await apiClient.patch("/api/tenants/me", { settings: formData });
      setSuccess("Settings saved successfully!");
      await loadTenantSettings(); // Re-fetch to confirm
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof TenantSettings,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (success) setSuccess(""); // Clear success message on change
  };

  return {
    tenant,
    formData,
    loading,
    saving,
    error,
    success,
    handleSaveSettings,
    handleInputChange,
  };
}