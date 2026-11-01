import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Recording { id: string; title: string; file_url: string; duration_minutes: number; order_index: number; promotion_id: string }
interface Promotion { id: string; name: string; level: string }

export default function EspaceAdminVideos() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ title: '', file_url: '', promotion_id: '', duration_minutes: 0, order_index: 0 })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [recRes, promoRes] = await Promise.all([
      supabaseAdmin.from('recordings').select('*').order('order_index'),
      supabaseAdmin.from('promotions').select('id, name, level').order('name'),
    ])
    setRecordings(recRes.data || [])
    setPromotions(promoRes.data || [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.file_url || !form.promotion_id) return
    setSaving(true)
    const { error } = await supabaseAdmin.from('recordings').insert({ ...form, order_index: recordings.length + 1 })
    if (!error) { setForm({ title: '', file_url: '', promotion_id: '', duration_minutes: 0, order_index: 0 }); setShowForm(false); showToast('Enregistrement ajouté ✓'); load() }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabaseAdmin.from('recordings').delete().eq('id', id)
    setRecordings(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
    showToast('Supprimé')
  }

  const grouped = promotions.map(p => ({ ...p, recs: recordings.filter(r => r.promotion_id === p.id) })).filter(g => g.recs.length > 0)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <div style={{ paddingTop: 16 }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 100 }}>{toast}</div>}

      <div style={{ background: 'linear-gradient(135deg,#6C5CE7,#8B5CF6)', borderRadius: 20, padding: '20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Vidéos</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{recordings.length} enregistrement{recordings.length > 1 ? 's' : ''}</div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Nouvel enregistrement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={form.promotion_id} onChange={e => setForm(f => ({ ...f, promotion_id: e.target.value }))} required style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', background: '#fff' }}>
              <option value="">Choisir une promotion…</option>
              {promotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la séance" required style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="URL YouTube ou Supabase Storage" required style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <input type="number" value={form.duration_minutes || ''} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} placeholder="Durée (minutes)" style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <button type="submit" disabled={saving} style={{ padding: '14px', borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : 'Ajouter la vidéo'}
            </button>
          </div>
        </form>
      )}

      {grouped.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8B8AAA' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
          <div>Aucun enregistrement</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(group => (
            <div key={group.id}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{group.name} · {group.recs.length} vidéo{group.recs.length > 1 ? 's' : ''}</div>
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
                {group.recs.map((r, i) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #F5F4FF' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6C5CE7', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      {r.duration_minutes > 0 && <div style={{ fontSize: 11, color: '#8B8AAA' }}>{r.duration_minutes} min</div>}
                    </div>
                    <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4C2DD', padding: 4, flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
