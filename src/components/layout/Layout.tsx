import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Search, Bell, Moon, Sun, LogOut, ChevronDown, Check, Menu } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { timeAgo } from '../../lib/utils'
import { Sidebar } from './Sidebar'
import {
  LayoutDashboard, Users, CreditCard, BookmarkPlus,
  GraduationCap
} from 'lucide-react'

const NAVY  = '#0D1F3C'
const TEAL  = '#1ABCAB'
const DARK  = '#0D1F3C'
const MUTED = '#7A90A8'
const BG    = '#F7F8FA'
const BORDER = '#E5E8EF'

// ─── Bottom nav tabs ───────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'home',     icon: LayoutDashboard, label: 'Accueil',   path: '/' },
  { id: 'crm',      icon: Users,           label: 'Relations', path: '/crm' },
  { id: 'fab',      icon: BookmarkPlus,    label: '',          path: '' },
  { id: 'payments', icon: CreditCard,      label: 'Finance',   path: '/payments' },
  { id: 'espace',   icon: GraduationCap,   label: 'Espace',    path: '/espace/admin' },
]

function getActiveTab(pathname: string): string {
  if (pathname === '/' || pathname === '/dashboard') return 'home'
  if (pathname.startsWith('/crm') || pathname.startsWith('/participants')) return 'crm'
  if (pathname.startsWith('/payments') || pathname.startsWith('/purchases') || pathname.startsWith('/recu-paiement')) return 'payments'
  if (pathname.startsWith('/espace')) return 'espace'
  return ''
}

// ─── Notification panel ───────────────────────────────────────────────────
function NotifPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, markAllRead } = useAppStore()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return (
    <div ref={ref} style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(13,31,60,0.16)', border: `1px solid ${BORDER}`, zIndex: 100, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>Notifications</span>
        <button onClick={markAllRead} style={{ fontSize: 11, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check style={{ width: 12, height: 12 }} /> Tout lu
        </button>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0
          ? <div style={{ padding: 28, textAlign: 'center', fontSize: 13, color: MUTED }}>Aucune notification</div>
          : notifications.map(n => (
            <div key={n.id} onClick={() => { markNotificationRead(n.id); if (n.link) { navigate(n.link); onClose() } }}
              style={{ display: 'flex', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, background: n.isRead ? 'transparent' : `${TEAL}0D` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: n.isRead ? 'transparent' : TEAL }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{n.title}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: '#C0D0E0', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// ─── Search panel ─────────────────────────────────────────────────────────
function SearchPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const { leads, participants, payments } = useAppStore()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const hc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const hk = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', hc); document.addEventListener('keydown', hk)
    return () => { document.removeEventListener('mousedown', hc); document.removeEventListener('keydown', hk) }
  }, [onClose])
  const query = q.toLowerCase().trim()
  const results = query.length < 2 ? [] : [
    ...leads.filter(l => `${l.firstName} ${l.lastName} ${l.phone}`.toLowerCase().includes(query)).slice(0, 3).map(l => ({ type: 'Lead', label: `${l.firstName} ${l.lastName}`, sub: l.phone, path: '/crm' })),
    ...participants.filter(p => `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(query)).slice(0, 3).map(p => ({ type: 'Participant', label: `${p.firstName} ${p.lastName}`, sub: p.email, path: '/participants' })),
    ...payments.filter(p => p.participantName.toLowerCase().includes(query)).slice(0, 2).map(p => ({ type: 'Paiement', label: p.participantName, sub: `${p.totalAmount} MAD`, path: '/payments' })),
  ]
  return (
    <div ref={ref} style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 'min(500px, 90vw)', background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(13,31,60,0.16)', border: `1px solid ${BORDER}`, zIndex: 100, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <Search style={{ width: 15, height: 15, color: MUTED, flexShrink: 0 }} />
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher leads, participants, paiements…"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: DARK, background: 'transparent', fontFamily: 'inherit' }} />
        <kbd style={{ fontSize: 11, background: BG, border: `1px solid ${BORDER}`, padding: '2px 6px', borderRadius: 5, color: MUTED }}>Échap</kbd>
      </div>
      {results.length > 0 ? results.map((r, i) => (
        <button key={i} onClick={() => { navigate(r.path); onClose() }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, textAlign: 'left', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: `${TEAL}18`, color: TEAL }}>{r.type}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: DARK }}>{r.label}</span>
          <span style={{ fontSize: 11, color: MUTED }}>{r.sub}</span>
        </button>
      )) : query.length >= 2
        ? <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: MUTED }}>Aucun résultat</div>
        : <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#C0D0E0' }}>Tapez au moins 2 caractères…</div>
      }
    </div>
  )
}

// ─── Bottom nav (mobile only) ─────────────────────────────────────────────
function BottomNav({ active }: { active: string }) {
  const navigate = useNavigate()
  return (
    <nav className="sc-bottom" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff', borderTop: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '6px 0 calc(6px + env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 20px rgba(13,31,60,0.08)',
    }}>
      {BOTTOM_TABS.map(tab => {
        const isActive = active === tab.id
        if (tab.id === 'fab') return (
          <button key="fab" onClick={() => navigate('/dashboard')}
            style={{ width: 48, height: 48, borderRadius: '50%', background: NAVY, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 4px 16px ${NAVY}60`, marginTop: -14, flexShrink: 0 }}>
            <tab.icon style={{ width: 20, height: 20 }} />
          </button>
        )
        return (
          <button key={tab.id} onClick={() => navigate(tab.path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', minWidth: 52 }}>
            <tab.icon style={{ width: 20, height: 20, color: isActive ? TEAL : '#B0BEC5', transition: 'color 0.15s' }} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? TEAL : '#B0BEC5', transition: 'color 0.15s' }}>{tab.label}</span>
            {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: TEAL }} />}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Main layout ──────────────────────────────────────────────────────────
export function Layout() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout, isDark, toggleDark } = useAuthStore()
  const { notifications } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [showSearch,  setShowSearch]  = useState(false)
  const [showUser,    setShowUser]    = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const unread = notifications.filter(n => !n.isRead).length
  const activeTab = getActiveTab(location.pathname)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotifs(false); setShowUser(false) }
    }
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h)
  }, [])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @media (min-width: 1024px) {
          .sc-topbar { margin-left: 230px !important; }
          .sc-main   { margin-left: 230px !important; }
          .sc-bottom { display: none !important; }
        }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="sc-topbar" style={{
        position: 'sticky', top: 0, zIndex: 10, height: 58,
        background: '#fff', borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 10,
        paddingLeft: 16, paddingRight: 16,
        boxShadow: '0 1px 8px rgba(13,31,60,0.05)',
      }}>

        {/* Hamburger (mobile) */}
        <button onClick={() => setSidebarOpen(true)}
          style={{ width: 36, height: 36, borderRadius: 10, background: BG, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: NAVY }}
          className="lg:hidden">
          <Menu style={{ width: 17, height: 17 }} />
        </button>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 400, margin: '0 auto', position: 'relative' }}>
          <button onClick={() => setShowSearch(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: BG, color: MUTED, fontSize: 13, cursor: 'text', fontFamily: 'inherit' }}>
            <Search style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left' }}>Rechercher…</span>
            <kbd style={{ fontSize: 11, background: '#fff', border: `1px solid ${BORDER}`, padding: '1px 5px', borderRadius: 4 }} className="hidden sm:inline">⌘K</kbd>
          </button>
          {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <button onClick={toggleDark}
            style={{ width: 34, height: 34, borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isDark ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
          </button>

          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
              style={{ width: 34, height: 34, borderRadius: 9, background: showNotifs ? `${TEAL}15` : 'none', border: 'none', cursor: 'pointer', color: showNotifs ? TEAL : MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Bell style={{ width: 15, height: 15 }} />
              {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: '50%', background: '#EF4444', border: '2px solid white' }} />}
            </button>
            {showNotifs && <NotifPanel onClose={() => setShowNotifs(false)} />}
          </div>

          {user && (
            <div ref={userRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 10, background: showUser ? `${NAVY}08` : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${NAVY}, #1A3360)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: DARK, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden sm:block">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown style={{ width: 12, height: 12, color: MUTED }} />
              </button>
              {showUser && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(13,31,60,0.16)', border: `1px solid ${BORDER}`, zIndex: 50, padding: 8 }}>
                  <div style={{ padding: '8px 10px 10px', borderBottom: `1px solid ${BORDER}`, marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: 0 }}>{user.name}</p>
                    <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>{user.email}</p>
                  </div>
                  <button onClick={() => { navigate('/settings'); setShowUser(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 10px', fontSize: 13, color: DARK, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, fontFamily: 'inherit' }}>
                    Paramètres
                  </button>
                  <button onClick={() => { logout(); navigate('/login') }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 10px', fontSize: 13, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                    <LogOut style={{ width: 13, height: 13 }} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────── */}
      <main className="sc-main" style={{ minHeight: 'calc(100vh - 58px)' }}>
        <div style={{ padding: '24px 20px 100px', maxWidth: 1300, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      {/* ── Bottom nav (mobile only) ─────────────────────────────── */}
      <BottomNav active={activeTab} />
    </div>
  )
}
