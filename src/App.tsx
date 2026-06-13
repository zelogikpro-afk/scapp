import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { Layout } from './components/layout/Layout'
import { useAuthStore } from './store/authStore'
import { useAppStore } from './store/appStore'

import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import CRM from './pages/crm/CRM'
import Participants from './pages/participants/Participants'
import CoachingPacks from './pages/coaching/CoachingPacks'
import CoachingSessions from './pages/coaching/CoachingSessions'
import Training from './pages/training/Training'
import Payments from './pages/payments/Payments'
import CalendarPage from './pages/calendar/Calendar'
import Tests from './pages/tests/Tests'
import Documents from './pages/documents/Documents'
import Certificates from './pages/certificates/Certificates'
import Tasks from './pages/tasks/Tasks'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'
import Purchases from './pages/purchases/Purchases'

import type { Role } from './types'

const ROLE_ACCESS: Record<string, Role[]> = {
  '/crm':               ['super_admin', 'admin', 'sales_agent', 'crm_manager'],
  '/participants':      ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/coaching/packs':    ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/coaching/sessions': ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/training':          ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/payments':          ['super_admin', 'admin', 'crm_manager'],
  '/tests':             ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/documents':         ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/certificates':      ['super_admin', 'admin', 'crm_manager'],
  '/purchases':         ['super_admin', 'admin', 'crm_manager'],
  '/reports':           ['super_admin', 'admin'],
  '/settings':          ['super_admin', 'admin'],
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ path, children }: { path: string; children: React.ReactNode }) {
  const { user } = useAuthStore()
  const allowed = ROLE_ACCESS[path]
  if (allowed && user && !allowed.includes(user.role as Role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { isDark, init, user } = useAuthStore()
  const { fetchAll } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="crm"               element={<RequireRole path="/crm"><CRM /></RequireRole>} />
          <Route path="participants"      element={<RequireRole path="/participants"><Participants /></RequireRole>} />
          <Route path="coaching/packs"    element={<RequireRole path="/coaching/packs"><CoachingPacks /></RequireRole>} />
          <Route path="coaching/sessions" element={<RequireRole path="/coaching/sessions"><CoachingSessions /></RequireRole>} />
          <Route path="training"          element={<RequireRole path="/training"><Training /></RequireRole>} />
          <Route path="payments"          element={<RequireRole path="/payments"><Payments /></RequireRole>} />
          <Route path="calendar"          element={<CalendarPage />} />
          <Route path="tests"             element={<RequireRole path="/tests"><Tests /></RequireRole>} />
          <Route path="documents"         element={<RequireRole path="/documents"><Documents /></RequireRole>} />
          <Route path="certificates"      element={<RequireRole path="/certificates"><Certificates /></RequireRole>} />
          <Route path="tasks"             element={<Tasks />} />
          <Route path="purchases"         element={<RequireRole path="/purchases"><Purchases /></RequireRole>} />
          <Route path="reports"           element={<RequireRole path="/reports"><Reports /></RequireRole>} />
          <Route path="settings"          element={<RequireRole path="/settings"><Settings /></RequireRole>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
