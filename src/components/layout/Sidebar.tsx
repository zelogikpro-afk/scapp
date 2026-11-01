import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, Calendar, CreditCard,
  BarChart3, Settings, BookOpen, ClipboardList, FileText,
  Award, CheckSquare, Layers, X, ShoppingCart, UserPlus,
  GraduationCap, Sparkles, Megaphone, LogOut, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

const NAVY   = '#0D1F3C'
const TEAL   = '#1ABCAB'
const TEAL_BG = 'rgba(26,188,171,0.13)'
const MUTED  = 'rgba(255,255,255,0.45)'
const BORDER = 'rgba(255,255,255,0.08)'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

type NavItem = {
  label: string
  icon: any
  path: string
  roles: Role[]
  children?: { label: string; path: string }[]
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'admin', 'sales_agent', 'coach', 'crm_manager'] },
      { label: 'Calendrier',      icon: Calendar,        path: '/calendar',  roles: ['super_admin', 'admin', 'sales_agent', 'coach', 'crm_manager'] },
      { label: 'Tâches',          icon: CheckSquare,     path: '/tasks',     roles: ['super_admin', 'admin', 'sales_agent', 'coach', 'crm_manager'] },
    ]
  },
  {
    label: 'Apprenants',
    items: [
      { label: 'CRM',                icon: Users,         path: '/crm',          roles: ['super_admin', 'admin', 'sales_agent', 'crm_manager'] },
      { label: 'Participants',        icon: UserCheck,     path: '/participants', roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
      { label: 'Inscription',         icon: UserPlus,      path: '/inscription',  roles: ['super_admin', 'admin', 'crm_manager'] },
      { label: 'Inscriptions reçues', icon: ClipboardList, path: '/inscriptions', roles: ['super_admin', 'admin', 'crm_manager'] },
      {
        label: 'Coaching', icon: BookOpen, path: '/coaching', roles: ['super_admin', 'admin', 'coach', 'crm_manager'],
        children: [
          { label: 'Packs',   path: '/coaching/packs' },
          { label: 'Séances', path: '/coaching/sessions' },
        ]
      },
      { label: 'Formations', icon: Layers, path: '/training', roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
    ]
  },
  {
    label: 'Finance',
    items: [
      { label: 'Paiements', icon: CreditCard,   path: '/payments',      roles: ['super_admin', 'admin', 'crm_manager'] },
      { label: 'Reçus',     icon: FileText,     path: '/recu-paiement', roles: ['super_admin', 'admin', 'crm_manager'] },
      { label: 'Achats',    icon: ShoppingCart, path: '/purchases',     roles: ['super_admin', 'admin', 'crm_manager'] },
    ]
  },
  {
    label: 'Ressources',
    items: [
      { label: 'Tests',       icon: ClipboardList, path: '/tests',        roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
      { label: 'Documents',   icon: FileText,      path: '/documents',    roles: ['super_admin', 'admin', 'coach', 'crm_manager'] },
      { label: 'Certificats', icon: Award,         path: '/certificates', roles: ['super_admin', 'admin', 'crm_manager'] },
    ]
  },
  {
    label: 'E-Learning',
    items: [
      { label: 'E-Learning', icon: GraduationCap, path: '/elearning',       roles: ['super_admin', 'admin'] },
      { label: 'Demandes',   icon: Megaphone,     path: '/demandes',        roles: ['super_admin', 'admin', 'coach'] },
      { label: 'Digital',    icon: Sparkles,      path: '/digital/accueil', roles: ['super_admin', 'admin', 'digital'] as Role[] },
    ]
  },
  {
    label: 'Système',
    items: [
      { label: 'Rapports',   icon: BarChart3, path: '/reports',  roles: ['super_admin', 'admin'] },
      { label: 'Paramètres', icon: Settings,  path: '/settings', roles: ['super_admin', 'admin'] },
    ]
  },
]

function NavItemComp({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const location = useLocation()
  const hasChildren = 'children' in item && item.children
  const isActive = hasChildren
    ? location.pathname.startsWith(item.path)
    : item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)

  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
    borderRadius: 9, fontSize: 13, fontWeight: 500, textDecoration: 'none',
    transition: 'all 0.15s', cursor: 'pointer', width: '100%', border: 'none',
    background: isActive ? TEAL_BG : 'transparent',
    color: isActive ? TEAL : 'rgba(255,255,255,0.72)',
  }

  if (hasChildren) {
    return (
      <div>
        <NavLink to={item.children![0].path} onClick={onClose} style={base}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: isActive ? TEAL : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <item.icon style={{ width: 13, height: 13, color: isActive ? '#fff' : 'rgba(255,255,255,0.45)' }} />
          </div>
          <span style={{ flex: 1 }}>{item.label}</span>
          <ChevronRight style={{ width: 12, height: 12, transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'rgba(255,255,255,0.25)' }} />
        </NavLink>
        {isActive && (
          <div style={{ marginLeft: 35, marginTop: 2, borderLeft: `2px solid ${TEAL}44`, paddingLeft: 10 }}>
            {item.children!.map(child => (
              <NavLink key={child.path} to={child.path} onClick={onClose}
                style={({ isActive: a }) => ({
                  display: 'block', padding: '5px 8px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  color: a ? TEAL : 'rgba(255,255,255,0.45)', background: a ? TEAL_BG : 'transparent',
                  textDecoration: 'none', marginBottom: 1,
                })}>
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink to={item.path} end={item.path === '/'} onClick={onClose}
      style={({ isActive: a }) => ({
        ...base,
        background: a ? TEAL_BG : 'transparent',
        color: a ? TEAL : 'rgba(255,255,255,0.72)',
      })}>
      {({ isActive: a }) => (
        <>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: a ? TEAL : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <item.icon style={{ width: 13, height: 13, color: a ? '#fff' : 'rgba(255,255,255,0.45)' }} />
          </div>
          <span style={{ flex: 1 }}>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = user?.role as Role | undefined

  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !role || item.roles.includes(role)),
  })).filter(g => g.items.length > 0)

  const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: NAVY }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 4px ${TEAL}30` }}>
            <img src="/logo.png" alt="SC" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.2px' }}>Success Compass</div>
            <div style={{ color: MUTED, fontSize: 10.5, marginTop: 1 }}>Coaching & Formation</div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, display: 'flex', borderRadius: 6 }}
            className="lg:hidden">
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', scrollbarWidth: 'none' }}>
        {visibleGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, paddingLeft: 10, marginBottom: 4 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map(item => (
                <NavItemComp key={item.path} item={item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div style={{ padding: '10px 8px 14px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${TEAL}, #0D9E90)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ color: MUTED, fontSize: 10.5, textTransform: 'capitalize', marginTop: 1 }}>{user.role?.replace('_', ' ')}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, display: 'flex', borderRadius: 6, transition: 'color 0.15s' }}
              title="Déconnexion"
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
              <LogOut style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20, backdropFilter: 'blur(2px)' }}
          className="lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 30,
          width: 230, display: 'flex', flexDirection: 'column',
          transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
          transform: open ? 'translateX(0)' : undefined,
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
        className={open ? '' : '-translate-x-full lg:translate-x-0'}
      >
        {content}
      </aside>
    </>
  )
}
