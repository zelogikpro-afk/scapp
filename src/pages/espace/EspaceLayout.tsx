import { useEffect, useState } from 'react'
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { Home, PlayCircle, FileText, FlaskConical, BookOpen, Award, LogOut, Menu, X } from 'lucide-react'
import { getLearnerSession, clearLearnerSession, type LearnerSession } from '../../lib/learnerSession'

const NAV = [
  { path: '/espace/accueil',         label: 'Accueil',         icon: Home },
  { path: '/espace/enregistrements', label: 'Enregistrements', icon: PlayCircle },
  { path: '/espace/documents',       label: 'Documents',       icon: FileText },
  { path: '/espace/tests',           label: 'Tests',           icon: FlaskConical },
  { path: '/espace/notes',           label: 'Notes',           icon: BookOpen },
  { path: '/espace/certificat',      label: 'Certificat',      icon: Award },
]

export default function EspaceLayout() {
  const [session, setSession] = useState<LearnerSession | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const s = getLearnerSession()
    if (!s) { navigate('/espace', { replace: true }); return }
    setSession(s)
  }, [])

  function logout() {
    clearLearnerSession()
    navigate('/espace')
  }

  if (!session) return null

  const initials = session.participantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const levelLabel = session.formationLevel === 'N1' ? 'Niveau 1' : session.formationLevel === 'N2' ? 'Niveau 2' : 'Niveau 3'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SC" className="h-8 w-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="font-bold text-gray-900 text-sm">Success Compass</span>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{session.participantName}</p>
              <p className="text-xs text-gray-400">{levelLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              {({ isActive }) => (<><Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />{label}</>)}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />Se déconnecter
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900 text-sm flex-1">
            {NAV.find(n => n.path === location.pathname)?.label || 'Mon Espace'}
          </span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full">
          <Outlet context={session} />
        </main>

        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
          Success Compass Academy · {session.username}
        </footer>
      </div>
    </div>
  )
}
