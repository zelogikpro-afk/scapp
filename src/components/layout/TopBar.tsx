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
    <header className="sticky top-0 z-10 h-14 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
        <Menu className="w-5 h-5" />
      </button>

      {title && <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">{title}</h1>}

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto relative">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded hidden sm:inline">⌘K</kbd>
        </button>
        {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Dark mode */}
        <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>

        {/* User Menu */}
        {user && (
          <div ref={userRef} className="relative">
            <button
              onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Avatar name={user.name} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block max-w-28 truncate">{user.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {showUser && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 py-1.5">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setShowUser(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Paramètres
                </button>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
