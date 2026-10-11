import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

const Router = BrowserRouter

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
import RecuPaiement from './pages/payments/RecuPaiement'
import CalendarPage from './pages/calendar/Calendar'
import Tests from './pages/tests/Tests'
import Documents from './pages/documents/Documents'
import Certificates from './pages/certificates/Certificates'
import Tasks from './pages/tasks/Tasks'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'
import Purchases from './pages/purchases/Purchases'
import TestMappingPage from './pages/test/TestMappingPage'
import TestIEPage from './pages/test/TestIEPage'
import TestQSPage from './pages/test/TestQSPage'
import TestCompassPage from './pages/test/TestCompassPage'
import QuizCoachPage from './pages/test/QuizCoachPage'
import QuizCoachN2Page from './pages/test/QuizCoachN2Page'
import QuizDevPersPage from './pages/test/QuizDevPersPage'
import TestValeursPage from './pages/test/TestValeursPage'
import Inscription from './pages/inscription/Inscription'
import InscriptionClassesAvenir from './pages/inscription/InscriptionClassesAvenir'
import InscriptionPublique from './pages/inscription/InscriptionPublique'
import InscriptionClassesAvenirPublique from './pages/inscription/InscriptionClassesAvenirPublique'
import ProspectsList from './pages/inscription/ProspectsList'
import EspaceLogin from './pages/espace/EspaceLogin'
import EspaceLayout from './pages/espace/EspaceLayout'
import EspaceAccueil from './pages/espace/EspaceAccueil'
import EspaceEnregistrements from './pages/espace/EspaceEnregistrements'
import EspaceDocuments from './pages/espace/EspaceDocuments'
import EspaceTests from './pages/espace/EspaceTests'
import EspaceNotes from './pages/espace/EspaceNotes'
import EspaceCertificat from './pages/espace/EspaceCertificat'
import EspaceAgenda from './pages/espace/EspaceAgenda'
import EspaceMessages from './pages/espace/EspaceMessages'
import EspaceProgression from './pages/espace/EspaceProgression'
import EspaceDevoirs from './pages/espace/EspaceDevoirs'
import EspaceObjectifs from './pages/espace/EspaceObjectifs'
import EspaceProfil from './pages/espace/EspaceProfil'
import EspaceCoaching from './pages/espace/EspaceCoaching'
import EspaceInscriptionNiveau from './pages/espace/EspaceInscriptionNiveau'
import Demandes from './pages/admin/Demandes'
import ElearningAdmin from './pages/elearning/ElearningAdmin'
import TrainerLogin from './pages/formateur/TrainerLogin'
import TrainerLayout from './pages/formateur/TrainerLayout'
import TrainerDashboard from './pages/formateur/TrainerDashboard'
import TrainerApprenants from './pages/formateur/TrainerApprenants'
import TrainerTests from './pages/formateur/TrainerTests'
import TrainerEnregistrements from './pages/formateur/TrainerEnregistrements'
import TrainerRessources from './pages/formateur/TrainerRessources'
import TrainerAnnonces from './pages/formateur/TrainerAnnonces'
import TrainerProfil from './pages/formateur/TrainerProfil'
import DigitalLayout from './pages/digital/DigitalLayout'
import DigitalAccueil from './pages/digital/DigitalAccueil'
import DigitalTaches from './pages/digital/DigitalTaches'
import DigitalCreer from './pages/digital/DigitalCreer'
import DigitalPosts from './pages/digital/DigitalPosts'

import { getLearnerSession } from './lib/learnerSession'
import type { Role } from './types'

const ROLE_ACCESS: Record<string, Role[]> = {
  '/inscription':       ['super_admin', 'admin', 'crm_manager'],
  '/inscription-classes-avenir': ['super_admin', 'admin', 'crm_manager'],
  '/inscriptions':      ['super_admin', 'admin', 'crm_manager'],
  '/crm':               ['super_admin', 'admin', 'sales_agent', 'crm_manager'],
  '/participants':      ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/coaching/packs':    ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/coaching/sessions': ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/training':          ['super_admin', 'admin', 'coach', 'crm_manager'],
  '/payments':          ['super_admin', 'admin', 'crm_manager'],
  '/recu-paiement':    ['super_admin', 'admin', 'crm_manager'],
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

function RequireLearner({ children }: { children: React.ReactNode }) {
  const session = getLearnerSession()
  const location = useLocation()
  if (!session) {
    return <Navigate to={`/espace/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
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
    if (user?.id) fetchAll(user.id, user.role)
  }, [user?.id])

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/s/inscription" element={<InscriptionPublique />} />
        <Route path="/s/classes-avenir" element={<InscriptionClassesAvenirPublique />} />
        <Route path="/test/mapping" element={<RequireLearner><TestMappingPage /></RequireLearner>} />
        <Route path="/test/ie" element={<RequireLearner><TestIEPage /></RequireLearner>} />
        <Route path="/test/qs" element={<RequireLearner><TestQSPage /></RequireLearner>} />
        <Route path="/test/compass" element={<RequireLearner><TestCompassPage /></RequireLearner>} />
        <Route path="/test/quiz-coach" element={<RequireLearner><QuizCoachPage /></RequireLearner>} />
        <Route path="/test/quiz-coach-n2" element={<RequireLearner><QuizCoachN2Page /></RequireLearner>} />
        <Route path="/test/quiz-dev-pers" element={<RequireLearner><QuizDevPersPage /></RequireLearner>} />
        <Route path="/test/valeurs" element={<RequireLearner><TestValeursPage /></RequireLearner>} />
        <Route path="/espace/login" element={<EspaceLogin />} />
        <Route path="/formateur/login" element={<TrainerLogin />} />
        <Route path="/formateur" element={<TrainerLayout />}>
          <Route path="dashboard"       element={<TrainerDashboard />} />
          <Route path="apprenants"      element={<TrainerApprenants />} />
          <Route path="tests"           element={<TrainerTests />} />
          <Route path="enregistrements" element={<TrainerEnregistrements />} />
          <Route path="ressources"      element={<TrainerRessources />} />
          <Route path="annonces"        element={<TrainerAnnonces />} />
          <Route path="profil"          element={<TrainerProfil />} />
          <Route index                  element={<Navigate to="/formateur/dashboard" replace />} />
        </Route>
        <Route path="/digital" element={<DigitalLayout />}>
          <Route path="accueil" element={<DigitalAccueil />} />
          <Route path="taches"  element={<DigitalTaches />} />
          <Route path="creer"   element={<DigitalCreer />} />
          <Route path="posts"   element={<DigitalPosts />} />
          <Route index           element={<Navigate to="/digital/accueil" replace />} />
        </Route>
        <Route path="/espace" element={<EspaceLayout />}>
          <Route path="accueil"          element={<EspaceAccueil />} />
          <Route path="agenda"           element={<EspaceAgenda />} />
          <Route path="progression"      element={<EspaceProgression />} />
          <Route path="enregistrements"  element={<EspaceEnregistrements />} />
          <Route path="documents"        element={<EspaceDocuments />} />
          <Route path="tests"            element={<EspaceTests />} />
          <Route path="devoirs"          element={<EspaceDevoirs />} />
          <Route path="objectifs"        element={<EspaceObjectifs />} />
          <Route path="notes"            element={<EspaceNotes />} />
          <Route path="messages"         element={<EspaceMessages />} />
          <Route path="certificat"       element={<EspaceCertificat />} />
          <Route path="profil"                element={<EspaceProfil />} />
          <Route path="coaching"              element={<EspaceCoaching />} />
          <Route path="inscription-niveau"    element={<EspaceInscriptionNiveau />} />
          <Route index                        element={<Navigate to="/espace/accueil" replace />} />
        </Route>
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="crm"               element={<RequireRole path="/crm"><CRM /></RequireRole>} />
          <Route path="participants"      element={<RequireRole path="/participants"><Participants /></RequireRole>} />
          <Route path="coaching/packs"    element={<RequireRole path="/coaching/packs"><CoachingPacks /></RequireRole>} />
          <Route path="coaching/sessions" element={<RequireRole path="/coaching/sessions"><CoachingSessions /></RequireRole>} />
          <Route path="training"          element={<RequireRole path="/training"><Training /></RequireRole>} />
          <Route path="payments"          element={<RequireRole path="/payments"><Payments /></RequireRole>} />
          <Route path="recu-paiement"    element={<RequireRole path="/recu-paiement"><RecuPaiement /></RequireRole>} />
          <Route path="calendar"          element={<CalendarPage />} />
          <Route path="tests"             element={<RequireRole path="/tests"><Tests /></RequireRole>} />
          <Route path="documents"         element={<RequireRole path="/documents"><Documents /></RequireRole>} />
          <Route path="certificates"      element={<RequireRole path="/certificates"><Certificates /></RequireRole>} />
          <Route path="tasks"             element={<Tasks />} />
          <Route path="purchases"         element={<RequireRole path="/purchases"><Purchases /></RequireRole>} />
          <Route path="inscription"         element={<RequireRole path="/inscription"><Inscription /></RequireRole>} />
          <Route path="inscription-classes-avenir" element={<RequireRole path="/inscription"><InscriptionClassesAvenir /></RequireRole>} />
          <Route path="inscriptions"        element={<RequireRole path="/inscriptions"><ProspectsList /></RequireRole>} />
          <Route path="reports"           element={<RequireRole path="/reports"><Reports /></RequireRole>} />
          <Route path="settings"          element={<RequireRole path="/settings"><Settings /></RequireRole>} />
          <Route path="elearning"         element={<ElearningAdmin />} />
          <Route path="demandes"          element={<Demandes />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
