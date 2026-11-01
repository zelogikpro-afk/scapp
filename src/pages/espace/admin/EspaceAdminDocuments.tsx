import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Doc { id: string; title: string; file_url: string; level: string; is_visible: boolean; order_index: number }

const LEVELS = ['N1', 'N2', 'N3']
const LEVEL_META: Record<string, { color: string; bg: string }> = {
  N1: { color: '#3B82F6', bg: '#EFF6FF' },
  N2: { color: '#6C5CE7', bg: '#F0EEFF' },
  N3: { color: '#F59E0B', bg: '#FFFBEB' },
}

export default function EspaceAdminDocuments() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [expandedLevel, setExpandedLevel] = useState<string | null>('N1')
  const [form, setForm] = useState({ title: '', file_url: '', level: 'N1' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabaseAdmin.from('elearning_docs').select('*').order('level').order('order_index')
    setDocs(data || [])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.file_url) return
    setSaving(true)
    const levelDocs = docs.filter(d => d.level === form.level)
    const { error } = await supabaseAdmin.from('elearning_docs').insert({ ...form, is_visible: true, order_index: levelDocs.length + 1 })
    if (!error) { setForm({ title: '', file_url: '', level: 'N1' }); setShowForm(false); showToast('Document ajouté ✓'); load() }
    setSaving(false)
  }

  async function toggleVisible(id: string, current: boolean) {
    await supabaseAdmin.from('elearning_docs').update({ is_visible: !current }).eq('id', id)
    setDocs(prev => prev.map(d => d.id === id ? { ...d, is_visible: !current } : d))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabaseAdmin.from('elearning_docs').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
    showToast('Supprimé')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <div style={{ paddingTop: 16 }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 100 }}>{toast}</div>}

      <div style={{ background: 'linear-gradient(135deg,#3B82F6,#6C5CE7)', borderRadius: 20, padding: '20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Documents</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{docs.length} ressource{docs.length > 1 ? 's' : ''}</div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(108,92,231,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Nouveau document</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {LEVELS.map(l => {
                const m = LEVEL_META[l]
                return (
                  <button key={l} type="button" onClick={() => setForm(f => ({ ...f, level: l }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${form.level === l ? m.color : '#EEECFF'}`, background: form.level === l ? m.bg : '#fff', color: form.level === l ? m.color : '#8B8AAA' }}>
                    {l}
                  </button>
                )
              })}
            </div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre du document" required style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="URL du fichier (Supabase Storage ou lien PDF)" required style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, color: '#1E1B4B', outline: 'none' }} />
            <button type="submit" disabled={saving} style={{ padding: '14px', borderRadius: 14, background: '#6C5CE7', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : 'Ajouter le document'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LEVELS.map(level => {
          const levelDocs = docs.filter(d => d.level === level)
          const meta = LEVEL_META[level]
          const isOpen = expandedLevel === level
          return (
            <div key={level} style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(108,92,231,0.06)' }}>
              <button onClick={() => setExpandedLevel(isOpen ? null : level)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: isOpen ? meta.bg : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: isOpen ? `1px solid ${meta.color}22` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isOpen ? meta.color : meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: isOpen ? '#fff' : meta.color, flexShrink: 0 }}>{level}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>Niveau {level.replace('N', '')}</div>
                  <div style={{ fontSize: 12, color: '#8B8AAA' }}>{levelDocs.length} document{levelDocs.length > 1 ? 's' : ''}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2">
                  {isOpen ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                </svg>
              </button>
              {isOpen && (
                <div style={{ background: '#fff' }}>
                  {levelDocs.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#8B8AAA', fontSize: 13 }}>Aucun document pour ce niveau</div>
                  ) : levelDocs.map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #F5F4FF', opacity: d.is_visible ? 1 : 0.5 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                        <div style={{ fontSize: 11, color: d.is_visible ? '#10B981' : '#8B8AAA' }}>{d.is_visible ? 'Visible' : 'Masqué'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => toggleVisible(d.id, d.is_visible)} style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: d.is_visible ? '#ECFDF5' : '#F5F4FF', color: d.is_visible ? '#10B981' : '#8B8AAA' }}>
                          {d.is_visible ? 'Masquer' : 'Afficher'}
                        </button>
                        <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4C2DD', padding: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
