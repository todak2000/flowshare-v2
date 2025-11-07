"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { PlanCard, plans } from "@/components/payment/components"
import { useAuthStore } from "@/store/auth-store"
import { apiClient } from "@/lib/api-client"
import { PageLoader } from "@/components/layout/PageLoader"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UpgradePlanPage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentPlan = user?.subscription_plan || "starter"

  const handleSelectPlan = async (planId: string) => {
    if (!user || !user.tenant_ids.length) {
      setError("User or tenant not found")
      return
    }

    // Don't allow downgrade to same plan
    if (planId === currentPlan) {
      setError("You are already on this plan")
      return
    }

    if (planId === "enterprise") {
      window.location.href =
        "mailto:todak2000@gmail.com?subject=Enterprise Plan Upgrade Inquiry"
      return
    }

    setSelectedPlan(planId)
    setUpgrading(true)
    setError(null)

    try {
      const tenantId = user.tenant_ids[0]

      // Update tenant subscription plan
      await apiClient.patch(`/api/tenants/${tenantId}`, {
        subscription_plan: planId,
      })

      // Refresh user profile from backend to get updated subscription_plan
      const updatedUserProfile = await apiClient.get("/api/auth/me")
      updateUser(updatedUserProfile as any)

      // Show success and redirect
      alert(`Successfully upgraded to ${planId} plan!`)
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Upgrade error:", err)
      setError(
        err?.response?.data?.detail || "Failed to upgrade plan. Please try again."
      )
    } finally {
      setUpgrading(false)
    }
  }

  const handleContactSales = () => {
    window.location.href =
      "mailto:todak2000@gmail.com?subject=Enterprise Plan Inquiry"
  }

  if (!user) {
    return <PageLoader message="Loading..." />
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Upgrade Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock more features and increase your limits
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-center">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              onSelect={handleSelectPlan}
              onContactSales={handleContactSales}
            />
          ))}
        </div>

        {upgrading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card p-8 rounded-lg shadow-xl border">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-center">Upgrading your plan...</p>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Need help choosing? Contact our team at{" "}
            <a href="mailto:todak2000@gmail.com" className="text-primary hover:underline">
              todak2000@gmail.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
