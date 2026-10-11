import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { FlaskConical, PlayCircle, FileText, LogOut, Menu, X, GraduationCap, Users, LayoutDashboard, Megaphone, UserCircle } from 'lucide-react'
import { getTrainerSession, clearTrainerSession, type TrainerSession } from '../../lib/trainerApi'

const NAV = [
  { path: '/formateur/dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/formateur/apprenants',      label: 'Apprenants',       icon: Users },
  { path: '/formateur/tests',           label: 'Tests',            icon: FlaskConical },
  { path: '/formateur/enregistrements', label: 'Enregistrements',  icon: PlayCircle },
  { path: '/formateur/ressources',      label: 'Ressources',       icon: FileText },
  { path: '/formateur/annonces',        label: 'Annonces',         icon: Megaphone },
  { path: '/formateur/profil',          label: 'Profil',           icon: UserCircle },
]

export default function TrainerLayout() {
  const [session, setSession] = useState<TrainerSession | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const s = getTrainerSession()
    if (!s) { navigate('/formateur/login', { replace: true }); return }
    setSession(s)
  }, [])

  function logout() {
    clearTrainerSession()
    navigate('/formateur/login', { replace: true })
  }

  if (!session) return null

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{session.name}</p>
            <p className="text-xs text-emerald-600 font-medium">Formateur</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-72 h-full bg-white shadow-xl">
            <button className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          <span className="text-sm font-semibold text-gray-900">Espace Formateur</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet context={session} />
        </main>
      </div>
    </div>
  )
}
