"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/store/auth-store"

export interface TrendData {
  date: string
  partner_id: string
  total_gross_volume: number
  avg_bsw: number
  avg_api_gravity: number
}

export const useAnalyticsTrends = () => {
  const { user, getTenantId, getPartnerId, hasAccessToAnalytics } = useAuthStore()
  const canAccessAnalytics = hasAccessToAnalytics()

  const [trends, setTrends] = useState<TrendData[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrends = async () => {
      if (!user || !canAccessAnalytics) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const tenantId = getTenantId() // Use the getter
        if (!tenantId) {
          setLoading(false)
          return
        }
        
        let url = `/api/analytics/trends?tenant_id=${tenantId}&days=30`
        const partnerId = getPartnerId() // Use the getter
        if (user.role === "partner" && partnerId) {
          url += `&partner_id=${partnerId}`
        }

        const response = await apiClient.get<{ data: TrendData[] }>(url)
        setTrends(response.data || [])
      } catch (err: any) {
        console.error("Failed to load trends:", err)
        // Per original logic, we don't set a user-facing error for trends
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [user, canAccessAnalytics, getTenantId, getPartnerId])

  return { trends, isLoading }
}