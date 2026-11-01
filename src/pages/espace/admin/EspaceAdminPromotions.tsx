import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Promotion { id: string; name: string; level: string; start_date: string; end_date: string; is_active: boolean }

const LEVEL_META: Record<string, { color: string; bg: string }> = {
  N1: { color: '#3B82F6', bg: '#EFF6FF' },
  N2: { color: '#6C5CE7', bg: '#F0EEFF' },
  N3: { color: '#F59E0B', bg: '#FFFBEB' },
}

export default function EspaceAdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ name: '', level: 'N1', start_date: '', end_date: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabaseAdmin.from('promotions').select('*').order('start_date', { ascending: false })
    setPromotions(data || [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    const { error } = await supabaseAdmin.from('promotions').insert({ ...form, is_active: true })
    if (!error) { setForm({ name: '', level: 'N1', start_date: '', end_date: '' }); setShowForm(false); showToast('Promotion créée ✓'); load() }
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    setTogglingId(id)
    await supabaseAdmin.from('promotions').update({ is_active: !current }).eq('id', id)
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    setTogglingId(null)
  }

  const active = promotions.filter(p => p.is_active)
  const inactive = promotions.filter(p => !p.is_active)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <div style={{ paddingTop: 16 }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 100 }}>{toast}</div>}

      <div style={{ background: 'linear-gradient(135deg,#F59E0B,#6C5CE7)', borderRadius: 20, padding: '20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Promotions</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{active.length} active{active.length > 1 ? 's' : ''} · {promotions.length} total</div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? 'Annuler' : '+ Créer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Nouvelle promotion</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom de la promotion (ex: Promo Mars 2026)" required style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {['N1', 'N2', 'N3'].map(l => {
                const m = LEVEL_META[l]
                return (
                  <button key={l} type="button" onClick={() => setForm(f => ({ ...f, level: l }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${form.level === l ? m.color : '#EEECFF'}`, background: form.level === l ? m.bg : '#fff', color: form.level === l ? m.color : '#8B8AAA' }}>
                    {l}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>Date début</div>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8B8AAA', marginBottom: 4 }}>Date fin</div>
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button type="submit" disabled={saving} style={{ padding: '14px', borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Création…' : 'Créer la promotion'}
            </button>
          </div>
        </form>
      )}

      {[{ label: 'Actives', list: active }, { label: 'Inactives', list: inactive }].map(({ label, list }) => list.length > 0 && (
        <div key={label} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{label} ({list.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(p => {
              const meta = LEVEL_META[p.level] || { color: '#8B8AAA', bg: '#F5F4FF' }
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(108,92,231,0.06)', opacity: p.is_active ? 1 : 0.6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: meta.color, flexShrink: 0 }}>{p.level}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    {p.start_date && <div style={{ fontSize: 11, color: '#8B8AAA' }}>{new Date(p.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}{p.end_date ? ` → ${new Date(p.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</div>}
                  </div>
                  <button onClick={() => toggleActive(p.id, p.is_active)} disabled={togglingId === p.id}
                    style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: p.is_active ? '#6C5CE7' : '#E2E0F0', position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: p.is_active ? 20 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {promotions.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8B8AAA' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div>
          <div>Aucune promotion</div>
        </div>
      )}
    </div>
  )
}
