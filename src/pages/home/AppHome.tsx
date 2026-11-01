import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { TrendingUp, Users, CreditCard, CalendarDays, ChevronRight, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Role } from '../../types'

const NAVY  = '#0D1F3C'
const TEAL  = '#1ABCAB'
const BG    = '#F7F8FA'
const CARD  = '#FFFFFF'
const DARK  = '#0D1F3C'
const MUTED = '#7A90A8'
const BORDER = '#E5E8EF'

interface Module {
  id: string
  label: string
  sub: string
  emoji: string
  color: string
  bg: string
  path: string
  roles: Role[]
}

const MODULES: Module[] = [
  { id: 'dashboard',  label: 'Tableau de bord',     sub: 'KPIs & activité',          emoji: '📊', color: NAVY,    bg: `${NAVY}12`,   path: '/dashboard',      roles: ['super_admin','admin','sales_agent','coach','crm_manager'] },
  { id: 'relations',  label: 'Relations',             sub: 'CRM & participants',        emoji: '👥', color: '#7C3AED', bg: '#F5F0FF', path: '/crm',            roles: ['super_admin','admin','sales_agent','crm_manager'] },
  { id: 'academie',   label: 'Académie',              sub: 'Formations & tests',        emoji: '🎓', color: '#F59E0B', bg: '#FFFBEB', path: '/training',       roles: ['super_admin','admin','coach','crm_manager'] },
  { id: 'coaching',   label: 'Coaching',              sub: 'Packs & séances',           emoji: '🎯', color: TEAL,     bg: `${TEAL}12`, path: '/coaching/packs', roles: ['super_admin','admin','coach','crm_manager'] },
  { id: 'finance',    label: 'Finance',               sub: 'Paiements & achats',        emoji: '💰', color: '#EF4444', bg: '#FEF2F2', path: '/payments',       roles: ['super_admin','admin','crm_manager'] },
  { id: 'espace',     label: 'Espace Apprenantes',    sub: 'Plateforme pédagogique',    emoji: '🏫', color: '#8B5CF6', bg: '#F5F3FF', path: '/espace/admin',  roles: ['super_admin','admin','coach','crm_manager'] },
  { id: 'planning',   label: 'Planning',              sub: 'Calendrier & tâches',       emoji: '📅', color: '#06B6D4', bg: '#ECFEFF', path: '/calendar',       roles: ['super_admin','admin','sales_agent','coach','crm_manager'] },
  { id: 'demandes',   label: 'Demandes',              sub: 'Inscriptions reçues',       emoji: '📬', color: '#EC4899', bg: '#FDF2F8', path: '/inscriptions',   roles: ['super_admin','admin','crm_manager'] },
  { id: 'digital',    label: 'Digital',               sub: 'Contenu & posts',           emoji: '✨', color: '#14B8A6', bg: '#F0FDFA', path: '/digital/accueil',roles: ['super_admin','admin','digital'] as Role[] },
  { id: 'rapports',   label: 'Rapports',              sub: 'Stats & exports',           emoji: '📈', color: '#6366F1', bg: '#EEF2FF', path: '/reports',        roles: ['super_admin','admin'] },
  { id: 'config',     label: 'Configuration',         sub: 'Équipe & paramètres',       emoji: '⚙️', color: '#64748B', bg: '#F8FAFC', path: '/settings',      roles: ['super_admin','admin'] },
]

export default function AppHome() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { leads, participants, payments } = useAppStore()
  const [search, setSearch] = useState('')
  const [time, setTime] = useState(new Date())
  const role = user?.role as Role | undefined
  const firstName = user?.name?.split(' ')[0] || ''

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t) }, [])

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const visible = MODULES.filter(m => {
    if (role && !m.roles.includes(role)) return false
    if (search.length >= 2) return m.label.toLowerCase().includes(search.toLowerCase()) || m.sub.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const quickStats = [
    { label: 'Leads',    value: leads?.length ?? 0,                                                           icon: TrendingUp,  color: NAVY,     path: '/crm' },
    { label: 'Clients',  value: participants?.length ?? 0,                                                     icon: Users,       color: TEAL,     path: '/participants' },
    { label: 'En attente', value: payments?.filter((p: any) => p.status === 'pending').length ?? 0,           icon: CreditCard,  color: '#EF4444', path: '/payments' },
    { label: 'Agenda',   value: '',                                                                            icon: CalendarDays,color: '#F59E0B', path: '/calendar' },
  ]

  return (
    <div style={{ background: BG, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Welcome banner ──────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(110deg, ${NAVY} 0%, #1A3360 55%, #0E4D3F 100%)`,
        padding: '32px 24px 28px', position: 'relative', overflow: 'hidden',
        margin: '-24px -20px 0', borderRadius: '0 0 20px 20px',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(26,188,171,0.08)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '-0.4px' }}>
            {greeting}, {firstName || 'Bienvenue'} 👋
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
            {MODULES.filter(m => role && m.roles.includes(role)).length} modules disponibles
          </div>

          {/* Quick stats in the banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {quickStats.map((s, i) => (
              <button key={i} onClick={() => navigate(s.path)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 8px', cursor: 'pointer', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                  <s.icon style={{ width: 14, height: 14, color: s.color === NAVY ? TEAL : s.color }} />
                </div>
                <div style={{ fontSize: s.value !== '' ? 18 : 14, fontWeight: 800, color: '#fff' }}>{s.value !== '' ? s.value : '—'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontWeight: 600 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 22 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un module…"
            style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: `1.5px solid ${BORDER}`, background: CARD, color: DARK, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>

        {/* Module icon pills (horizontal scroll, no search) */}
        {!search && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: DARK }}>Modules</span>
            </div>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
              {visible.map(m => (
                <button key={m.id} onClick={() => navigate(m.path)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, minWidth: 60 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: `0 4px 12px ${m.color}20` }}>
                    {m.emoji}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, textAlign: 'center', lineHeight: 1.2, maxWidth: 58 }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Module cards grid */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: DARK }}>{search ? `Résultats pour "${search}"` : 'Accès rapide'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10 }}>
            {visible.map(m => (
              <button key={m.id} onClick={() => navigate(m.path)}
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 8px rgba(13,31,60,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: m.color, borderRadius: '16px 16px 0 0' }} />
                <div style={{ width: 40, height: 40, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 8 }}>
                  {m.emoji}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: DARK, lineHeight: 1.2, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 10.5, color: MUTED, lineHeight: 1.3 }}>{m.sub}</div>
                <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
                  <ChevronRight style={{ width: 12, height: 12, color: BORDER }} />
                </div>
              </button>
            ))}
            {visible.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: MUTED }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
                Aucun module pour "{search}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
