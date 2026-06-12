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
          <Route path="crm" element={<CRM />} />
          <Route path="participants" element={<Participants />} />
          <Route path="coaching/packs" element={<CoachingPacks />} />
          <Route path="coaching/sessions" element={<CoachingSessions />} />
          <Route path="training" element={<Training />} />
          <Route path="payments" element={<Payments />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tests" element={<Tests />} />
          <Route path="documents" element={<Documents />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
