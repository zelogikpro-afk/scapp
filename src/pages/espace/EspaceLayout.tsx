import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { getLearnerSession, setLearnerSession, clearLearnerSession, type LearnerSession } from '../../lib/learnerSession'
import { learnerApiCall, learnerApi } from '../../lib/learnerApi'

const BETA_USERNAMES = ['a.successcompass']

const BOTTOM_NAV = [
  { path: '/espace/accueil', label: 'Accueil', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { path: '/espace/agenda', label: 'Agenda', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { path: '/espace/progression', label: 'Progression', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
  { path: '/espace/messages', label: 'Messages', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )},
  { path: '/espace/profil', label: 'Profil', icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
]

export default function EspaceLayout() {
  const [session, setSession] = useState<LearnerSession | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const s = getLearnerSession()
    if (!s) { navigate('/espace/login', { replace: true }); return }
    if (!s.allPromotionIds?.length || !s.participantId) {
      enrichSession(s)
    } else {
      setSession(s)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    learnerApi.logActivity(location.pathname.replace('/espace/', ''), 'page_view')
  }, [location.pathname, session?.id])

  async function enrichSession(s: LearnerSession) {
    try {
      const data = await learnerApiCall<{ acc: any; allPromotionIds: string[]; allLevels: string[] }>({ action: 'get_profile' })
      const enriched: LearnerSession = {
        ...s,
        participantId: data.acc?.participant_id || s.participantId,
        allPromotionIds: data.allPromotionIds,
        allLevels: data.allLevels,
        formationLevel: data.allLevels[data.allLevels.length - 1] || s.formationLevel,
      }
      setLearnerSession(enriched)
      setSession(enriched)
    } catch {
      clearLearnerSession()
      navigate('/espace/login', { replace: true })
    }
  }

  if (!session) return null

  const isBeta = BETA_USERNAMES.includes(session.username)

  return (
    <div style={{ background: '#F5F4FF', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, position: 'relative', minHeight: '100vh', background: '#F5F4FF' }}>

        {/* CONTENT */}
        <div style={{ paddingBottom: 80, paddingLeft: 16, paddingRight: 16 }}>
          <Outlet context={session} />
        </div>

        {/* BOTTOM NAV */}
        <nav style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430,
          background: '#fff', borderTop: '1px solid #EEECFF',
          display: 'flex', paddingTop: 10, paddingBottom: 16,
          boxShadow: '0 -4px 20px rgba(108,92,231,0.10)',
          zIndex: 50,
        }}>
          {BOTTOM_NAV.filter(n => n.path !== '/espace/messages' || isBeta).map(({ path, label, icon }) => {
            const active = location.pathname === path || (path === '/espace/accueil' && location.pathname === '/espace')
            return (
              <Link key={path} to={path} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                {icon(active)}
                <span style={{ fontSize: 9, fontWeight: 600, color: active ? '#6C5CE7' : '#B0AECF' }}>{label}</span>
                {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6C5CE7', marginTop: -1 }} />}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
