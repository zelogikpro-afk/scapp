import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '../types'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isDark: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  toggleDark: () => void
  hasPermission: (permission: Permission) => boolean
  init: () => Promise<void>
}

export type Permission =
  | 'manage_users' | 'manage_settings' | 'view_all_leads' | 'view_all_clients'
  | 'view_payments' | 'view_finance_reports' | 'manage_leads' | 'convert_lead'
  | 'view_coaching' | 'manage_coaching' | 'view_training' | 'manage_training'
  | 'delete_data' | 'export_data' | 'view_dashboard'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'manage_users', 'manage_settings', 'view_all_leads', 'view_all_clients',
    'view_payments', 'view_finance_reports', 'manage_leads', 'convert_lead',
    'view_coaching', 'manage_coaching', 'view_training', 'manage_training',
    'delete_data', 'export_data', 'view_dashboard'
  ],
  admin: [
    'view_all_leads', 'view_all_clients', 'view_payments', 'view_finance_reports',
    'manage_leads', 'convert_lead', 'view_coaching', 'manage_coaching',
    'view_training', 'manage_training', 'delete_data', 'export_data', 'view_dashboard'
  ],
  crm_manager: [
    'view_all_leads', 'view_all_clients', 'view_payments',
    'manage_leads', 'convert_lead', 'view_coaching', 'manage_coaching',
    'view_training', 'manage_training', 'export_data', 'view_dashboard'
  ],
  sales_agent: ['manage_leads', 'convert_lead', 'view_dashboard'],
  coach: ['view_coaching', 'manage_coaching', 'view_dashboard'],
  digital: [],
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isDark: false,
      loading: true,

      init: async () => {
        set({ loading: true })
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile) {
            set({
              user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role, isActive: profile.is_active, createdAt: profile.created_at },
              isAuthenticated: true,
            })
          }
        }
        set({ loading: false })

        supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (profile) {
              set({
                user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role, isActive: profile.is_active, createdAt: profile.created_at },
                isAuthenticated: true,
              })
            }
          } else {
            set({ user: null, isAuthenticated: false })
          }
        })
      },

      login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { ok: false, error: error.message }
        if (!data.user) return { ok: false, error: 'Connexion échouée' }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profile) {
          set({
            user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role, isActive: profile.is_active, createdAt: profile.created_at },
            isAuthenticated: true,
          })
        }
        return { ok: true }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false })
      },

      toggleDark: () => {
        const next = !get().isDark
        set({ isDark: next })
        document.documentElement.classList.toggle('dark', next)
      },

      hasPermission: (permission: Permission) => {
        const { user } = get()
        if (!user) return false
        return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
      },
    }),
    {
      name: 'sc-auth',
      partialize: (state) => ({ isDark: state.isDark }),
    }
  )
)
