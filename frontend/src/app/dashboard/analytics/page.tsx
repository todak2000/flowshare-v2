"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanUpgradePrompt } from "@/components/shared/PlanUpgradePrompt"
import { usePlanAccess } from "@/hooks/usePlanAccess"
import { useAuthStore } from "@/store/auth-store"
import { apiClient } from "@/lib/api-client"
import { BarChart3, TrendingUp, Users, AlertCircle } from "lucide-react"
import { PageLoader } from "@/components/layout/PageLoader"

interface AnalyticsData {
  total_partners: number
  total_entries: number
  total_production: number
  avg_bsw: number
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const { canAccessAnalytics, handleApiError } = usePlanAccess()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !canAccessAnalytics) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const tenantId = user.tenant_ids[0]

        // For partners, only show their own data
        let url = `/api/analytics/summary?tenant_id=${tenantId}`
        if (user.role === "partner" && user.partner_id) {
          url += `&partner_id=${user.partner_id}`
        }

        const data = await apiClient.get<AnalyticsData>(url)
        setAnalytics(data)
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
  }, [user, canAccessAnalytics])

  if (loading) {
    return <PageLoader message="Loading analytics..." />
  }

  // Show upgrade prompt if user doesn't have access
  if (!canAccessAnalytics) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Production Analytics</h1>
        <PlanUpgradePrompt
          feature="Advanced Analytics"
          description="Get deep insights into your production data with advanced analytics, trends, and forecasting."
          requiredPlans={["professional", "enterprise"]}
        />
      </div>
    )
  }

  const isPartner = user?.role === "partner"

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg md:text-2xl font-bold mb-2">Production Analytics</h1>
        <p className="text-xs md:text-base text-muted-foreground">
          {isPartner
            ? "View your production data and performance metrics"
            : "View comprehensive analytics and insights for your joint venture"
          }
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Analytics
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {!isPartner && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_partners}</div>
                <p className="text-xs text-muted-foreground">Active in joint venture</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPartner ? "Your Entries" : "Total Entries"}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_entries}</div>
              <p className="text-xs text-muted-foreground">
                {isPartner ? "Your production records" : "Production records"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPartner ? "Your Production" : "Total Production"}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_production.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Barrels</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPartner ? "Your Avg BSW" : "Average BSW"}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avg_bsw.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Basic sediment & water</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Production Trends</CardTitle>
          <CardDescription>
            View detailed production trends over time (Coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Chart visualization will be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
