import { useAuthStore, SubscriptionPlan } from '@/store/auth-store'
import { useRouter } from 'next/navigation'

interface PlanAccessOptions {
  redirectOnDenied?: boolean
}

export const usePlanAccess = () => {
  const { user, hasAccessToAnalytics, hasAccessToForecasting, getSubscriptionPlan } = useAuthStore()
  const router = useRouter()

  const currentPlan = getSubscriptionPlan()

  const checkFeatureAccess = (
    requiredPlans: SubscriptionPlan[],
    options: PlanAccessOptions = {}
  ): boolean => {
    const { redirectOnDenied = false } = options

    if (!user) {
      if (redirectOnDenied) {
        router.push('/auth/login')
      }
      return false
    }

    const hasAccess = requiredPlans.includes(currentPlan)

    if (!hasAccess && redirectOnDenied) {
      router.push('/payment/select-plan')
    }

    return hasAccess
  }

  const handleApiError = (error: any): boolean => {
    if (error?.response?.data?.detail?.error === 'plan_upgrade_required') {
      // Plan upgrade is required - redirect to upgrade page
      router.push('/dashboard/upgrade')
      return true
    }
    return false
  }

  return {
    currentPlan,
    hasAccessToAnalytics: hasAccessToAnalytics(),
    hasAccessToForecasting: hasAccessToForecasting(),
    checkFeatureAccess,
    handleApiError,
    canAccessAnalytics: checkFeatureAccess(['professional', 'enterprise']),
    canAccessForecasting: checkFeatureAccess(['professional', 'enterprise']),
  }
}
