import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Announcement {
  id: string
  content: string
  type: string
  target: string
  promotion_id: string | null
  learner_id: string | null
  created_at: string
}

interface Learner { id: string; participant_name: string }
interface Promotion { id: string; name: string }

const TYPE_OPTS = [
  { value: 'info', label: 'Information', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'rappel', label: 'Rappel', color: '#F59E0B', bg: '#FFFBEB' },
  { value: 'urgent', label: 'Urgent', color: '#EF4444', bg: '#FEF2F2' },
]

export default function EspaceAdminAnnonces() {
  const [annonces, setAnnonces] = useState<Announcement[]>([])
  const [learners, setLearners] = useState<Learner[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const [content, setContent] = useState('')
  const [type, setType] = useState('info')
  const [target, setTarget] = useState<'all' | 'session' | 'learner'>('all')
  const [sessionId, setSessionId] = useState('')
  const [learnerId, setLearnerId] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [annoRes, learnRes, promoRes] = await Promise.all([
      supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('learner_accounts').select('id, participant_name').neq('formation_level', 'admin').order('participant_name'),
      supabaseAdmin.from('promotions').select('id, name').order('name'),
    ])
    setAnnonces(annoRes.data || [])
    setLearners(learnRes.data || [])
    setPromotions(promoRes.data || [])
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSending(true)
    const { error } = await supabaseAdmin.from('announcements').insert({
      content: content.trim(),
      type,
      target,
      promotion_id: target === 'session' ? sessionId || null : null,
      learner_id: target === 'learner' ? learnerId || null : null,
    })
    if (!error) {
      setContent('')
      setTarget('all')
      setSessionId('')
      setLearnerId('')
      showToast('Annonce envoyée ✓')
      load()
    }
    setSending(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabaseAdmin.from('announcements').delete().eq('id', id)
    setAnnonces(prev => prev.filter(a => a.id !== id))
    setDeletingId(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 100 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6C5CE7,#8B5CF6)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Annonces</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{annonces.length} annonce{annonces.length > 1 ? 's' : ''} envoyée{annonces.length > 1 ? 's' : ''}</div>
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Nouvelle annonce</div>

        {/* Type */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {TYPE_OPTS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setType(opt.value)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${type === opt.value ? opt.color : '#EEECFF'}`, background: type === opt.value ? opt.bg : '#fff', color: type === opt.value ? opt.color : '#8B8AAA', transition: 'all 0.15s' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Destinataire */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'session', label: 'Promotion' },
            { value: 'learner', label: 'Individuel' },
          ].map(opt => (
            <button key={opt.value} type="button" onClick={() => setTarget(opt.value as any)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${target === opt.value ? '#6C5CE7' : '#EEECFF'}`, background: target === opt.value ? '#F0EEFF' : '#fff', color: target === opt.value ? '#6C5CE7' : '#8B8AAA' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {target === 'session' && (
          <select value={sessionId} onChange={e => setSessionId(e.target.value)} required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', marginBottom: 14, outline: 'none', background: '#fff' }}>
            <option value="">Choisir une promotion…</option>
            {promotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        {target === 'learner' && (
          <select value={learnerId} onChange={e => setLearnerId(e.target.value)} required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', marginBottom: 14, outline: 'none', background: '#fff' }}>
            <option value="">Choisir une apprenante…</option>
            {learners.map(l => <option key={l.id} value={l.id}>{l.participant_name}</option>)}
          </select>
        )}

        {/* Message */}
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Écrivez votre message ici…"
          rows={4}
          style={{ width: '100%', padding: '12px', borderRadius: 14, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', resize: 'none', outline: 'none', marginBottom: 14, boxSizing: 'border-box', fontFamily: 'inherit' }}
        />

        <button type="submit" disabled={sending || !content.trim()}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: (sending || !content.trim()) ? 0.6 : 1 }}>
          {sending ? 'Envoi…' : 'Envoyer l\'annonce'}
        </button>
      </form>

      {/* Historique */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Historique ({annonces.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {annonces.map(a => {
          const typeOpt = TYPE_OPTS.find(t => t.value === a.type) || TYPE_OPTS[0]
          const targetLabel = a.target === 'learner'
            ? (learners.find(l => l.id === a.learner_id)?.participant_name || 'Individuel')
            : a.target === 'session'
              ? (promotions.find(p => p.id === a.promotion_id)?.name || 'Promotion')
              : 'Toutes les apprenantes'
          return (
            <div key={a.id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <p style={{ fontSize: 13, color: '#1E1B4B', flex: 1, lineHeight: 1.5 }}>{a.content}</p>
                <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#C4C2DD', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, background: typeOpt.bg, color: typeOpt.color, padding: '2px 8px', borderRadius: 6 }}>{typeOpt.label}</span>
                <span style={{ fontSize: 11, color: '#8B8AAA', background: '#F5F4FF', padding: '2px 8px', borderRadius: 6 }}>{targetLabel}</span>
                <span style={{ fontSize: 11, color: '#C4C2DD' }}>{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          )
        })}
        {annonces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8B8AAA' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📣</div>
            <div>Aucune annonce envoyée</div>
          </div>
        )}
      </div>
    </div>
  )
}
