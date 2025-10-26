import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Tenant } from "@/components/team/components"; // Adjust path to your types

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);

  const fetchTenant = useCallback(async () => {
    try {
      setLoadingTenant(true);
      const tenantData = await apiClient.get<Tenant>("/api/tenants/me");
      setTenant(tenantData);
    } catch (error) {
      console.error("Failed to fetch tenant:", error);
      setTenant(null); // Clear on error
    } finally {
      setLoadingTenant(false);
    }
  }, []);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  return { tenant, loadingTenant, refetchTenant: fetchTenant };
}