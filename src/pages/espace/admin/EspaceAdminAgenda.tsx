import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface ScheduleItem {
  id: string
  promotion_id: string
  title: string
  seance_date: string
  seance_time: string
  location_or_link: string
  notes: string
}

interface Promotion { id: string; name: string; level: string }

export default function EspaceAdminAgenda() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    promotion_id: '',
    title: '',
    seance_date: '',
    seance_time: '09:00',
    location_or_link: '',
    notes: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [itemsRes, promoRes] = await Promise.all([
      supabaseAdmin.from('schedule_items').select('*').order('seance_date').order('seance_time'),
      supabaseAdmin.from('promotions').select('id, name, level').order('name'),
    ])
    setItems(itemsRes.data || [])
    setPromotions(promoRes.data || [])
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.promotion_id || !form.title || !form.seance_date) return
    setSaving(true)
    const { error } = await supabaseAdmin.from('schedule_items').insert({ ...form })
    if (!error) {
      setForm({ promotion_id: '', title: '', seance_date: '', seance_time: '09:00', location_or_link: '', notes: '' })
      setShowForm(false)
      showToast('Séance ajoutée ✓')
      load()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabaseAdmin.from('schedule_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = items.filter(i => i.seance_date >= today)
  const past = items.filter(i => i.seance_date < today)

  const promoName = (id: string) => promotions.find(p => p.id === id)?.name || 'Promotion inconnue'

  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 100 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6C5CE7,#8B5CF6)', borderRadius: 20, padding: '20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Agenda</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{upcoming.length} séance{upcoming.length > 1 ? 's' : ''} à venir</div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 16 }}>Nouvelle séance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select value={form.promotion_id} onChange={e => setForm(f => ({ ...f, promotion_id: e.target.value }))} required
              style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', background: '#fff' }}>
              <option value="">Choisir une promotion…</option>
              {promotions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la séance" required
              style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input type="date" value={form.seance_date} onChange={e => setForm(f => ({ ...f, seance_date: e.target.value }))} required
                style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
              <input type="time" value={form.seance_time} onChange={e => setForm(f => ({ ...f, seance_time: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            </div>
            <input value={form.location_or_link} onChange={e => setForm(f => ({ ...f, location_or_link: e.target.value }))} placeholder="Lieu ou lien Teams/Zoom"
              style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (facultatif)" rows={2}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
            <button type="submit" disabled={saving}
              style={{ padding: '14px', borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : 'Ajouter la séance'}
            </button>
          </div>
        </form>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>À venir ({upcoming.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 14, boxShadow: '0 2px 8px rgba(108,92,231,0.08)' }}>
                <div style={{ background: '#6C5CE7', borderRadius: 12, padding: '8px 10px', textAlign: 'center', flexShrink: 0, minWidth: 46 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{new Date(item.seance_date + 'T12:00:00').getDate()}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
                    {new Date(item.seance_date + 'T12:00:00').toLocaleString('fr-FR', { month: 'short' })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#8B8AAA', marginTop: 2 }}>{promoName(item.promotion_id)} · {item.seance_time?.slice(0, 5)}</div>
                  {item.location_or_link && <div style={{ fontSize: 12, color: '#6C5CE7', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location_or_link}</div>}
                </div>
                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#C4C2DD', flexShrink: 0, alignSelf: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Passées ({past.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {past.slice().reverse().map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E1B4B' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: '#8B8AAA' }}>{formatDate(item.seance_date)} · {promoName(item.promotion_id)}</div>
                </div>
                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#C4C2DD' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8B8AAA' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div>Aucune séance planifiée</div>
          <button onClick={() => setShowForm(true)} style={{ marginTop: 12, padding: '10px 20px', background: '#6C5CE7', color: '#fff', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Ajouter une séance
          </button>
        </div>
      )}
    </div>
  )
}
