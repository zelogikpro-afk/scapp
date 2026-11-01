import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, LogOut, ChevronDown, Check } from 'lucide-react'
import { cn, timeAgo } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'

interface TopBarProps {
  onMenuClick: () => void
  title?: string
}

const notifTypeColors: Record<string, 'info' | 'danger' | 'success' | 'warning'> = {
  new_lead: 'info',
  payment_overdue: 'danger',
  new_registration: 'success',
  appointment: 'warning',
  task_assigned: 'info',
  certificate: 'success',
  general: 'info',
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, markAllRead } = useAppStore()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
        <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          <Check className="w-3 h-3" /> Tout marquer lu
        </button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800/60 max-h-80 overflow-y-auto">
        {notifications.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">Aucune notification</div>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => {
              markNotificationRead(n.id)
              if (n.link) { navigate(n.link); onClose() }
            }}
            className={cn(
              'flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
              !n.isRead && 'bg-blue-50/50 dark:bg-blue-900/10'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', !n.isRead ? 'bg-blue-500' : 'bg-transparent')} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const { leads, participants, payments } = useAppStore()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const q = query.toLowerCase().trim()

  const results = q.length < 2 ? [] : [
    ...leads.filter(l => `${l.firstName} ${l.lastName} ${l.phone} ${l.email}`.toLowerCase().includes(q))
      .slice(0, 3).map(l => ({ type: 'Lead', label: `${l.firstName} ${l.lastName}`, sub: l.phone, path: '/crm' })),
    ...participants.filter(p => `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(q))
      .slice(0, 3).map(p => ({ type: 'Participant', label: `${p.firstName} ${p.lastName}`, sub: p.email, path: '/participants' })),
    ...payments.filter(p => p.participantName.toLowerCase().includes(q))
      .slice(0, 2).map(p => ({ type: 'Paiement', label: p.participantName, sub: `${p.totalAmount} MAD`, path: '/payments' })),
  ]

  return (
    <div ref={ref} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher leads, participants, paiements…"
          className="flex-1 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
        />
        <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Échap</kbd>
      </div>
      {results.length > 0 ? (
        <div className="divide-y divide-gray-50 dark:divide-gray-800/60 py-1">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { navigate(r.path); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium flex-shrink-0">{r.type}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">{r.label}</span>
              <span className="text-xs text-gray-400">{r.sub}</span>
            </button>
          ))}
        </div>
      ) : q.length >= 2 ? (
        <div className="p-6 text-center text-sm text-gray-500">Aucun résultat pour "{query}"</div>
      ) : (
        <div className="p-6 text-center text-sm text-gray-400">Tapez au moins 2 caractères…</div>
      )}
    </div>
  )
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  const { user, logout, isDark, toggleDark } = useAuthStore()
  const { notifications } = useAppStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const unread = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotifs(false); setShowUser(false) }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 10, height: 56, background: '#fff', borderBottom: '1px solid #D4E6FF', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, boxShadow: '0 1px 8px rgba(26,115,232,0.06)' }}>
      {/* Hamburger mobile */}
      <button onClick={onMenuClick} className="lg:hidden" style={{ padding: 6, borderRadius: 8, background: '#E8F1FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <Menu style={{ width: 18, height: 18, color: '#1A73E8' }} />
      </button>

      {title && <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', display: 'none', margin: 0 }} className="sm:block">{title}</h1>}

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 440, margin: '0 auto', position: 'relative' }}>
        <button
          onClick={() => setShowSearch(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #D4E6FF', background: '#F0F7FF', color: '#6B88A8', fontSize: 13, cursor: 'text' }}
        >
          <Search style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left' }}>Rechercher…</span>
          <kbd style={{ fontSize: 11, background: '#fff', border: '1px solid #D4E6FF', padding: '1px 6px', borderRadius: 5 }} className="hidden sm:inline">⌘K</kbd>
        </button>
        {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
        {/* Dark mode */}
        <button onClick={toggleDark} style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6B88A8' }}>
          {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
            style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6B88A8', position: 'relative', display: 'flex' }}
          >
            <Bell style={{ width: 16, height: 16 }} />
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#EF4444', borderRadius: '50%', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>

        {/* User Menu */}
        {user && (
          <div ref={userRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 10, background: '#F0F7FF', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#1A73E8,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0A1628', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden sm:block">{user.name.split(' ')[0]}</span>
              <ChevronDown style={{ width: 13, height: 13, color: '#6B88A8' }} />
            </button>
            {showUser && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(26,115,232,0.15)', border: '1px solid #D4E6FF', zIndex: 50, padding: '8px' }}>
                <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid #F0F7FF', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', margin: 0 }}>{user.name}</p>
                  <p style={{ fontSize: 11, color: '#6B88A8', margin: '2px 0 0' }}>{user.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setShowUser(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 10px', fontSize: 13, color: '#0A1628', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}
                >
                  Paramètres
                </button>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 10px', fontSize: 13, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <LogOut style={{ width: 13, height: 13 }} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
