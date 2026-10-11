import { useState } from 'react'
import { Outlet, useNavigate, NavLink, useLocation, Navigate } from 'react-router-dom'
import { Home, CheckSquare, Sparkles, LayoutList, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { path: '/digital/accueil', label: 'Tableau de bord', icon: Home },
  { path: '/digital/taches',  label: 'Mes tâches',       icon: CheckSquare },
  { path: '/digital/creer',   label: 'Créer un post',    icon: Sparkles },
  { path: '/digital/posts',   label: 'Mes posts',         icon: LayoutList },
]

export default function DigitalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout: authLogout } = useAuthStore()

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (user.role !== 'digital' && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  function logout() {
    authLogout()
    navigate('/login')
  }

  const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-purple-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-purple-100 flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-5 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Success Compass</p>
              <p className="text-xs text-purple-500 mt-0.5">Digital Studio</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
              <p className="text-xs text-purple-400">Chargée Digital</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-purple-50/50 hover:text-gray-900'}`
              }>
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-purple-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />Se déconnecter
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-purple-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900 text-sm flex-1">
            {NAV.find(n => n.path === location.pathname)?.label || 'Digital Studio'}
          </span>
          <button onClick={() => setSidebarOpen(false)} className={sidebarOpen ? 'block' : 'hidden'}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full">
          <Outlet context={user} />
        </main>

        <footer className="text-center text-xs text-gray-400 py-4 border-t border-purple-100">
          Success Compass Digital Studio · {user.email}
        </footer>
      </div>
    </div>
  )
}
