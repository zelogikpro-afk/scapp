import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabaseAdmin } from '../../../lib/supabase'
import { type LearnerSession } from '../../../lib/learnerSession'
import { clearLearnerSession } from '../../../lib/learnerSession'
import { useNavigate } from 'react-router-dom'

export default function EspaceAdminDashboard() {
  const session = useOutletContext<LearnerSession>()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ apprenantes: 0, actives: 0, annonces: 0, prochaines: 0 })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [learnersRes, annoncesRes, agendaRes, activityRes] = await Promise.all([
      supabaseAdmin.from('learner_accounts').select('id, is_active', { count: 'exact' }).neq('formation_level', 'admin'),
      supabaseAdmin.from('announcements').select('id', { count: 'exact' }),
      supabaseAdmin.from('schedule_items').select('id, seance_date').gte('seance_date', new Date().toISOString().split('T')[0]),
      supabaseAdmin.from('activity_logs').select('learner_id, action, page, created_at, learner_accounts(participant_name)').order('created_at', { ascending: false }).limit(10),
    ])

    const learners = learnersRes.data || []
    setStats({
      apprenantes: learnersRes.count || 0,
      actives: learners.filter((l: any) => l.is_active).length,
      annonces: annoncesRes.count || 0,
      prochaines: (agendaRes.data || []).length,
    })
    setRecentActivity(activityRes.data || [])
    setLoading(false)
  }

  function logout() {
    clearLearnerSession()
    navigate('/espace/login', { replace: true })
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: '#8B8AAA', fontWeight: 500 }}>{greeting} 👋</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B' }}>Admin SC Academy</div>
        </div>
        <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 10, background: '#F0EEFF', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6C5CE7' }}>
          Déco.
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Apprenantes', value: stats.apprenantes, sub: `${stats.actives} actives`, color: '#6C5CE7', bg: '#F0EEFF' },
          { label: 'Annonces', value: stats.annonces, sub: 'envoyées', color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Séances à venir', value: stats.prochaines, sub: 'planifiées', color: '#10B981', bg: '#ECFDF5' },
          { label: 'E-learning', value: '→', sub: 'Vidéos & docs', color: '#8B5CF6', bg: '#F5F3FF', link: '/elearning' },
        ].map((s, i) => (
          s.link ? (
            <a key={i} href={s.link} style={{ background: s.bg, borderRadius: 16, padding: '16px', textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#8B8AAA', marginTop: 1 }}>{s.sub}</div>
            </a>
          ) : (
            <div key={i} style={{ background: s.bg, borderRadius: 16, padding: '16px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#8B8AAA', marginTop: 1 }}>{s.sub}</div>
            </div>
          )
        ))}
      </div>

      {/* Raccourcis */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Accès rapide</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Nouvelle annonce', sub: 'Envoyer un message à toutes', path: '/espace/admin/annonces', color: '#6C5CE7', bg: '#F0EEFF' },
            { label: 'Ajouter une séance', sub: 'Planifier une session', path: '/espace/admin/agenda', color: '#10B981', bg: '#ECFDF5' },
            { label: 'Voir les apprenantes', sub: 'Gérer les comptes', path: '/espace/admin/apprenantes', color: '#F59E0B', bg: '#FFFBEB' },
          ].map((item) => (
            <a key={item.path} href={item.path} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#8B8AAA' }}>{item.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4C2DD" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          ))}
        </div>
      </div>

      {/* Activité récente */}
      {recentActivity.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Activité récente</div>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
            {recentActivity.slice(0, 6).map((a: any, i) => {
              const name = (a.learner_accounts as any)?.participant_name || 'Apprenante'
              const page = a.page || a.action
              const time = new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #F5F4FF' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6C5CE7' }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#8B8AAA' }}>{page}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#C4C2DD', flexShrink: 0 }}>{time}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
