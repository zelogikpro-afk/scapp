import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { getLearnerSession, clearLearnerSession, type LearnerSession } from '../../../lib/learnerSession'

const NAV = [
  {
    path: '/espace/admin',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    path: '/espace/admin/apprenantes',
    label: 'Apprenantes',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    path: '/espace/admin/annonces',
    label: 'Annonces',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
  {
    path: '/espace/admin/agenda',
    label: 'Agenda',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    path: '/espace/admin/plus',
    label: 'Plus',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#6C5CE7' : '#B0AECF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    ),
  },
]

export default function EspaceAdminLayout() {
  const [session, setSession] = useState<LearnerSession | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const s = getLearnerSession()
    if (!s || s.formationLevel !== 'admin') {
      clearLearnerSession()
      navigate('/espace/login', { replace: true })
      return
    }
    setSession(s)
  }, [])

  if (!session) return null

  const isActive = (path: string) =>
    path === '/espace/admin'
      ? location.pathname === '/espace/admin'
      : location.pathname.startsWith(path)

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
          {NAV.map(({ path, label, icon }) => {
            const active = isActive(path)
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
