import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Learner {
  id: string
  participant_name: string
  username: string
  formation_level: string
  is_active: boolean
  last_login: string | null
  login_count: number
  promotion_id: string | null
}

const LEVEL_COLOR: Record<string, { bg: string; text: string }> = {
  N1: { bg: '#EFF6FF', text: '#3B82F6' },
  N2: { bg: '#F0EEFF', text: '#6C5CE7' },
  N3: { bg: '#FFFBEB', text: '#F59E0B' },
  digital: { bg: '#ECFDF5', text: '#10B981' },
}

export default function EspaceAdminApprenantes() {
  const [learners, setLearners] = useState<Learner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabaseAdmin
      .from('learner_accounts')
      .select('id, participant_name, username, formation_level, is_active, last_login, login_count, promotion_id')
      .neq('formation_level', 'admin')
      .order('participant_name')
    setLearners(data || [])
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    setTogglingId(id)
    await supabaseAdmin.from('learner_accounts').update({ is_active: !current }).eq('id', id)
    setLearners(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l))
    setTogglingId(null)
  }

  const filtered = learners.filter(l =>
    l.participant_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.username?.toLowerCase().includes(search.toLowerCase())
  )

  const actives = learners.filter(l => l.is_active).length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6C5CE7,#8B5CF6)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Apprenantes</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{learners.length} comptes · {actives} actif{actives > 1 ? 's' : ''}</div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#8B8AAA' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou identifiant…"
          style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 14, border: '1px solid #EEECFF', background: '#fff', fontSize: 13, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(l => {
          const levelStyle = LEVEL_COLOR[l.formation_level] || { bg: '#F5F4FF', text: '#8B8AAA' }
          const lastLogin = l.last_login
            ? new Date(l.last_login).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            : 'Jamais'
          return (
            <div key={l.id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(108,92,231,0.06)', opacity: l.is_active ? 1 : 0.55 }}>
              {/* Avatar */}
              <div style={{ width: 40, height: 40, borderRadius: 12, background: levelStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: levelStyle.text }}>
                {(l.participant_name || '?').charAt(0).toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.participant_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: levelStyle.bg, color: levelStyle.text, padding: '1px 7px', borderRadius: 6 }}>{l.formation_level?.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: '#8B8AAA' }}>{l.login_count || 0} connexions · {lastLogin}</span>
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggleActive(l.id, l.is_active)}
                disabled={togglingId === l.id}
                style={{
                  width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: l.is_active ? '#6C5CE7' : '#E2E0F0',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: l.is_active ? 20 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8B8AAA' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div>Aucun résultat</div>
          </div>
        )}
      </div>
    </div>
  )
}
