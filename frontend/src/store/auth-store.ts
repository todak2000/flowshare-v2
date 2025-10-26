import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UserProfile {
  id: string
  email: string
  role: 'coordinator' | 'partner' | 'field_operator' | 'auditor'
  tenant_ids: string[]  // Backend returns array of tenant IDs
  partner_id?: string
  full_name?: string
  firebase_uid?: string
  phone_number?: string
  created_at?: string
  updated_at?: string
  notification_settings?: {email_reports: boolean, email_anomaly_alerts: boolean}
}

interface AuthState {
  // State
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: UserProfile) => void
  clearUser: () => void
  updateUser: (updates: Partial<UserProfile>) => void
  setLoading: (isLoading: boolean) => void

  // Getters (computed values)
  getTenantId: () => string | null
  getPartnerId: () => string | null
  getUserRole: () => string | null
  isCoordinator: () => boolean
  isPartner: () => boolean
  isFieldOperator: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setUser: (user) => {

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      // Getters
      getTenantId: () => {
        const user = get().user
        // Return first tenant_id from tenant_ids array
        return user?.tenant_ids?.[0] ?? null
      },

      getPartnerId: () => get().user?.partner_id ?? null,

      getUserRole: () => get().user?.role ?? null,

      isCoordinator: () => get().user?.role === 'coordinator',

      isPartner: () => get().user?.role === 'partner',

      isFieldOperator: () => get().user?.role === 'field_operator',
    }),
    {
      name: 'flowshare-auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
