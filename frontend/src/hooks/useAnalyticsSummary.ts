"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/store/auth-store"
import { usePlanAccess } from "@/hooks/usePlanAccess" // Assuming this provides handleApiError

interface AnalyticsSummaryData {
  total_partners: number
  total_entries: number
  total_production: number
  avg_bsw: number
}

export const useAnalyticsSummary = () => {
  const { user, getTenantId, getPartnerId, hasAccessToAnalytics } = useAuthStore()
  const { handleApiError } = usePlanAccess() // Get the specific error handler
  const canAccessAnalytics = hasAccessToAnalytics()

  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !canAccessAnalytics) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const tenantId = getTenantId() // Use the getter from the store
        if (!tenantId) {
          setLoading(false)
          setError("Tenant ID not found.")
          return
        }

        let url = `/api/analytics/summary?tenant_id=${tenantId}`
        const partnerId = getPartnerId() // Use the getter
        if (user.role === "partner" && partnerId) {
          url += `&partner_id=${partnerId}`
        }

        const data = await apiClient.get<AnalyticsSummaryData>(url)
        setSummary(data)
        setError(null)
      } catch (err: any) {
        if (!handleApiError(err)) {
          setError(err?.response?.data?.detail || "Failed to load analytics")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, canAccessAnalytics, handleApiError, getTenantId, getPartnerId])

  return { summary, isLoading, error }
}