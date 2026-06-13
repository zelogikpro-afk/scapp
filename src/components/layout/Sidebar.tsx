import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard, Users, UserCheck, Calendar, CreditCard,
  BarChart3, Settings, BookOpen, ClipboardList, FileText,
  Award, CheckSquare, Layers, ChevronRight, X, Compass
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

type NavItem = {
  label: string
  icon: any
  path: string
  roles: Role[]
  badge?: null
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/',          roles: ['super_admin', 'admin', 'sales_agent', 'coach', 'crm_manager'] },
  { label: 'CRM',             icon: Users,           path: '/crm',        roles: ['super_admin', 'admin', 'sales_agent', 'crm_manager'] },
  { label: 'Participants',    icon: UserCheck,        path: '/participants',roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
  {
    label: 'Coaching', icon: BookOpen, path: '/coaching', roles: ['super_admin', 'admin', 'coach', 'crm_manager'],
    children: [
      { label: 'Packs',    path: '/coaching/packs' },
      { label: 'Séances',  path: '/coaching/sessions' },
    ]
  },
  { label: 'Formations',  icon: Layers,       path: '/training',      roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
  { label: 'Paiements',   icon: CreditCard,   path: '/payments',      roles: ['super_admin', 'admin', 'crm_manager'] },
  { label: 'Calendrier',  icon: Calendar,     path: '/calendar',      roles: ['super_admin', 'admin', 'sales_agent', 'coach', 'crm_manager'] },
  { label: 'Tests',       icon: ClipboardList,path: '/tests',         roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
  { label: 'Documents',   icon: FileText,     path: '/documents',     roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
  { label: 'Certificats', icon: Award,        path: '/certificates',  roles: ['super_admin', 'admin', 'crm_manager'] },
  { label: 'Tâches',      icon: CheckSquare,  path: '/tasks',         roles: ['super_admin', 'admin', 'sales_agent', 'coach', 'crm_manager'] },
  { label: 'Rapports',    icon: BarChart3,    path: '/reports',       roles: ['super_admin', 'admin'] },
  { label: 'Paramètres',  icon: Settings,     path: '/settings',      roles: ['super_admin', 'admin'] },
]

function NavItemComp({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const location = useLocation()
  const hasChildren = 'children' in item && item.children

  if (hasChildren) {
    const isParentActive = location.pathname.startsWith(item.path)
    return (
      <div>
        <NavLink
          to={item.children![0].path}
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            isParentActive
              ? 'text-white bg-white/10'
              : 'text-sidebar-muted hover:text-white hover:bg-white/5'
          )}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
          <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', isParentActive && 'rotate-90')} />
        </NavLink>
        {isParentActive && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
            {item.children!.map(child => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'block px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive ? 'text-white bg-white/10' : 'text-sidebar-muted hover:text-white hover:bg-white/5'
                )}
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClose}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'text-white bg-white/10 shadow-sm'
          : 'text-sidebar-muted hover:text-white hover:bg-white/5'
      )}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
    </NavLink>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const role = user?.role as Role | undefined

  const visibleItems = role
    ? navItems.filter(item => item.roles.includes(role))
    : []

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-30 w-64 flex flex-col',
        'bg-sidebar border-r border-sidebar-border',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">Success Compass</div>
            <div className="text-sidebar-muted text-xs">Coaching & Formation</div>
          </div>
          <button onClick={onClose} className="text-sidebar-muted hover:text-white lg:hidden p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-0.5">
          {visibleItems.map(item => (
            <NavItemComp key={item.path} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="px-3 py-3 border-t border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">{user.name}</div>
                <div className="text-sidebar-muted text-xs truncate capitalize">{user.role.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
