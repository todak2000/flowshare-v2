import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { apiClient } from '@/lib/api-client'

export interface DashboardStats {
  total_production: number
  production_trend: number
  active_reconciliations: number
  pending_reconciliations: number
  anomalies_detected: number
  anomalies_trend: number
  total_entries_this_month: number
  total_entries_last_month: number
}

export interface AuditLog {
  id: string
  action: string
  user_name: string | null
  created_at: string
}

export interface FormattedActivity {
  action: string
  time: string
  status: 'success' | 'warning' | 'info'
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface DashboardState {
  // State
  stats: DashboardStats | null
  activities: FormattedActivity[]
  teamMembers: TeamMember[]
  isLoading: boolean
  lastFetchedAt: number | null
  error: string | null

  // Actions
  fetchDashboardData: (force?: boolean) => Promise<void>
  setStats: (stats: DashboardStats) => void
  setActivities: (activities: FormattedActivity[]) => void
  setTeamMembers: (members: TeamMember[]) => void
  invalidateCache: () => void
  clearError: () => void
}

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION = 5 * 60 * 1000

// Helper functions
const formatAction = (action: string, userName: string | null): string => {
  const actionMap: Record<string, string> = {
    production_entry_created: "Production entry submitted",
    production_entry_updated: "Production entry updated",
    production_entry_flagged: "Anomaly detected",
    reconciliation_created: "Reconciliation started",
    reconciliation_approved: "Reconciliation completed",
    user_invited: "Partner invited to tenant",
    user_login: "User logged in",
  }
  return actionMap[action] || action.replace(/_/g, " ")
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  return `${days} day${days > 1 ? "s" : ""} ago`
}

const getStatusFromAction = (action: string): 'success' | 'warning' | 'info' => {
  if (action.includes("flagged") || action.includes("anomaly")) return "warning"
  if (action.includes("approved") || action.includes("completed")) return "success"
  return "info"
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial State
      stats: null,
      activities: [],
      teamMembers: [],
      isLoading: false,
      lastFetchedAt: null,
      error: null,

      // Actions
      fetchDashboardData: async (force = false) => {
        const { lastFetchedAt, isLoading } = get()

        // Check if cache is still valid and not forcing refresh
        if (
          !force &&
          lastFetchedAt &&
          Date.now() - lastFetchedAt < CACHE_DURATION
        ) {
          console.log('Using cached dashboard data')
          return
        }

        // Prevent multiple simultaneous fetches
        if (isLoading) {
          console.log('Dashboard data fetch already in progress')
          return
        }

        set({ isLoading: true, error: null })

        try {
          // Fetch all data in parallel
          const [statsData, auditLogs, members] = await Promise.all([
            apiClient.get<DashboardStats>("/api/dashboard/stats"),
            apiClient.get<AuditLog[]>("/api/audit-logs/recent?limit=4"),
            apiClient.get<TeamMember[]>("/api/dashboard/team-members?limit=2"),
          ])

          // Format activities
          const formattedActivities = auditLogs.map((log) => ({
            action: formatAction(log.action, log.user_name),
            time: formatTime(log.created_at),
            status: getStatusFromAction(log.action),
          }))

          set({
            stats: statsData,
            activities: formattedActivities,
            teamMembers: members,
            lastFetchedAt: Date.now(),
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
          })
        }
      },

      setStats: (stats) => set({ stats }),

      setActivities: (activities) => set({ activities }),

      setTeamMembers: (members) => set({ teamMembers: members }),

      invalidateCache: () => {
        set({ lastFetchedAt: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'flowshare-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist these fields
        stats: state.stats,
        activities: state.activities,
        teamMembers: state.teamMembers,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
)
