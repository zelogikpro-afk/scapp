import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'

interface Participant {
  id: string
  name: string
  packs: PackItem[]
}

interface PackItem {
  id: string
  name: string
  used_sessions: number
  total_sessions: number
}

interface CoachingSession {
  id: string
  participant_id: string
  date: string
  time: string
  duration: number
  notes: string
  status: 'planned' | 'done' | 'cancelled'
}

export default function EspaceAdminCoaching() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<CoachingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ participant_id: '', pack_id: '', date: '', time: '10:00', duration: 60, notes: '', status: 'planned' as const })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'planifier' | 'historique'>('planifier')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [pRes, packRes, sesRes] = await Promise.all([
      supabaseAdmin.from('participants').select('id, first_name, last_name').order('first_name'),
      supabaseAdmin.from('coaching_packs').select('id, participant_id, name, used_sessions, total_sessions'),
      supabaseAdmin.from('coaching_sessions_admin').select('*').order('date', { ascending: false }).limit(200),
    ])
    if (pRes.error) { showToast('Erreur participants : ' + pRes.error.message); setLoading(false); return }
    const packsByPart: Record<string, PackItem[]> = {}
    for (const p of (packRes.data || []) as any[]) {
      if (!packsByPart[p.participant_id]) packsByPart[p.participant_id] = []
      packsByPart[p.participant_id].push({ id: p.id, name: p.name, used_sessions: p.used_sessions, total_sessions: p.total_sessions })
    }
    const list: Participant[] = (pRes.data || []).map((p: any) => ({
      id: p.id, name: `${p.first_name} ${p.last_name}`.trim(),
      packs: packsByPart[p.id] || [],
    }))
    setParticipants(list)
    setSessions((sesRes.data || []) as CoachingSession[])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.participant_id || !form.date) return
    setSaving(true)
    const { error } = await supabaseAdmin.from('coaching_sessions_admin').insert({
      participant_id: form.participant_id,
      pack_id: form.pack_id || null,
      date: form.date,
      time: form.time,
      duration: form.duration,
      notes: form.notes,
      status: form.status,
    })
    if (!error) {
      if (form.pack_id) {
        const pack = participants.find(p => p.id === form.participant_id)?.packs.find(pk => pk.id === form.pack_id)
        if (pack) {
          await supabaseAdmin.from('coaching_packs').update({ used_sessions: pack.used_sessions + 1 }).eq('id', form.pack_id)
        }
      }
      setForm({ participant_id: '', pack_id: '', date: '', time: '10:00', duration: 60, notes: '', status: 'planned' })
      setSearch('')
      setShowForm(false)
      showToast('Séance planifiée ✓')
      load()
    } else {
      showToast('Erreur : ' + error.message)
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: 'planned' | 'done' | 'cancelled') {
    await supabaseAdmin.from('coaching_sessions_admin').update({ status }).eq('id', id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    showToast(status === 'done' ? 'Marquée comme faite ✓' : status === 'cancelled' ? 'Annulée' : 'Replanifiée')
  }

  const filtered = participants.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const packHolders = participants.filter(p => p.packs.length > 0)
  const upcoming = sessions.filter(s => s.status === 'planned').slice(0, 20)
  const past = sessions.filter(s => s.status !== 'planned').slice(0, 50)

  function getName(id: string) { return participants.find(p => p.id === id)?.name || id.slice(0, 8) }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const STATUS_META = {
    planned:   { label: 'Planifiée', color: '#6C5CE7', bg: '#F0EEFF' },
    done:      { label: 'Faite',     color: '#10B981', bg: '#ECFDF5' },
    cancelled: { label: 'Annulée',   color: '#EF4444', bg: '#FEF2F2' },
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0EEFF', borderTopColor: '#6C5CE7', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 16 }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E1B4B', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 100, whiteSpace: 'nowrap' }}>{toast}</div>}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#10B981,#059669)', borderRadius: 20, padding: '20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Coaching individuel</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{participants.length} apprenantes · {packHolders.length} avec pack</div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? 'Annuler' : '+ Planifier'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(16,185,129,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Nouvelle séance</div>

          {/* Search participant */}
          <div style={{ marginBottom: 10, position: 'relative' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8B8AAA', marginBottom: 4, display: 'block' }}>Apprenante *</label>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setForm(f => ({ ...f, participant_id: '' })) }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Cliquer ou taper un nom…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${form.participant_id ? '#10B981' : '#EEECFF'}`, fontSize: 13, color: '#1E1B4B', outline: 'none', boxSizing: 'border-box' }}
            />
            {form.participant_id
              ? <span style={{ position: 'absolute', right: 12, top: 32, fontSize: 14 }}>✓</span>
              : null}
            {searchFocused && !form.participant_id && (
              <div style={{ position: 'absolute', left: 0, right: 0, background: '#fff', border: '1px solid #EEECFF', borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50 }}>
                {filtered.length === 0
                  ? <div style={{ padding: '12px 14px', fontSize: 12, color: '#8B8AAA' }}>Aucun résultat</div>
                  : filtered.slice(0, 15).map(p => (
                    <div key={p.id}
                      onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, participant_id: p.id })); setSearch(p.name) }}
                      style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F5F4FF' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B', flex: 1 }}>{p.name}</span>
                      {p.packs.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#ECFDF5', color: '#10B981', borderRadius: 6, padding: '2px 7px' }}>{p.packs[0].name}</span>}
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Pack selector — shown only if selected participant has packs */}
          {form.participant_id && (() => {
            const packs = participants.find(p => p.id === form.participant_id)?.packs || []
            if (packs.length === 0) return null
            return (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#8B8AAA', marginBottom: 4, display: 'block' }}>Pack à décompter</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div onMouseDown={() => setForm(f => ({ ...f, pack_id: '' }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${!form.pack_id ? '#6C5CE7' : '#EEECFF'}`, background: !form.pack_id ? '#F0EEFF' : '#fff', cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, color: !form.pack_id ? '#6C5CE7' : '#8B8AAA', fontWeight: 600 }}>Séance sans pack</span>
                  </div>
                  {packs.map(pk => (
                    <div key={pk.id} onMouseDown={() => setForm(f => ({ ...f, pack_id: pk.id }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${form.pack_id === pk.id ? '#10B981' : '#EEECFF'}`, background: form.pack_id === pk.id ? '#ECFDF5' : '#fff', cursor: 'pointer' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{pk.name}</div>
                        <div style={{ fontSize: 11, color: '#8B8AAA' }}>{pk.used_sessions}/{pk.total_sessions} séances utilisées</div>
                      </div>
                      {form.pack_id === pk.id && <span style={{ color: '#10B981', fontSize: 14 }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8B8AAA', marginBottom: 4, display: 'block' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8B8AAA', marginBottom: 4, display: 'block' }}>Heure</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8B8AAA', marginBottom: 4, display: 'block' }}>Durée</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([{ v: 15, l: '15min' }, { v: 30, l: '30min' }, { v: 50, l: '50min' }, { v: 100, l: '1h40' }]).map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setForm(f => ({ ...f, duration: v }))}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid', borderColor: form.duration === v ? '#10B981' : '#EEECFF', background: form.duration === v ? '#ECFDF5' : '#fff', color: form.duration === v ? '#10B981' : '#8B8AAA' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes / objectifs de la séance (optionnel)"
            rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #EEECFF', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />

          <button type="submit" disabled={saving || !form.participant_id}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#10B981', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: (saving || !form.participant_id) ? 0.6 : 1 }}>
            {saving ? 'Enregistrement…' : 'Planifier la séance'}
          </button>
        </form>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { val: 'planifier', label: `À venir (${upcoming.length})` },
          { val: 'historique', label: `Historique (${past.length})` },
        ] as const).map(t => (
          <button key={t.val} onClick={() => setActiveTab(t.val)}
            style={{ flex: 1, padding: '10px', borderRadius: 14, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: activeTab === t.val ? '#10B981' : '#fff', color: activeTab === t.val ? '#fff' : '#8B8AAA', boxShadow: '0 1px 4px rgba(16,185,129,0.08)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Packs actifs */}
      {activeTab === 'planifier' && packHolders.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Packs actifs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {packHolders.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(16,185,129,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', marginBottom: 6 }}>{p.name}</div>
                {p.packs.map(pk => {
                  const pct = pk.total_sessions > 0 ? Math.round((pk.used_sessions / pk.total_sessions) * 100) : 0
                  return (
                    <div key={pk.id} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#8B8AAA' }}>{pk.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>{pk.used_sessions}/{pk.total_sessions}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 10, background: '#F0FFF4', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#10B981', borderRadius: 10 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste séances */}
      {activeTab === 'planifier' && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8B8AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Séances planifiées</div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#8B8AAA' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontWeight: 600 }}>Aucune séance planifiée</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(16,185,129,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>{getName(s.participant_id)}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: STATUS_META[s.status].bg, color: STATUS_META[s.status].color, borderRadius: 6, padding: '2px 7px' }}>{STATUS_META[s.status].label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8B8AAA', marginBottom: s.notes ? 8 : 0 }}>{formatDate(s.date)} · {s.time} · {s.duration}min</div>
                  {s.notes && <div style={{ fontSize: 11, color: '#6C5CE7', background: '#F5F4FF', borderRadius: 8, padding: '6px 10px' }}>{s.notes}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button onClick={() => updateStatus(s.id, 'done')}
                      style={{ flex: 1, padding: '7px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: '#ECFDF5', color: '#10B981' }}>
                      ✓ Faite
                    </button>
                    <button onClick={() => updateStatus(s.id, 'cancelled')}
                      style={{ flex: 1, padding: '7px', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: '#FEF2F2', color: '#EF4444' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'historique' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {past.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#8B8AAA' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 600 }}>Aucun historique</div>
            </div>
          ) : past.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', opacity: s.status === 'cancelled' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>{getName(s.participant_id)}</div>
                <span style={{ fontSize: 10, fontWeight: 700, background: STATUS_META[s.status].bg, color: STATUS_META[s.status].color, borderRadius: 6, padding: '2px 7px' }}>{STATUS_META[s.status].label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8B8AAA' }}>{formatDate(s.date)} · {s.time} · {s.duration}min</div>
              {s.notes && <div style={{ fontSize: 11, color: '#6C5CE7', background: '#F5F4FF', borderRadius: 8, padding: '6px 10px', marginTop: 6 }}>{s.notes}</div>}
              {s.status === 'cancelled' && (
                <button onClick={() => updateStatus(s.id, 'planned')} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: '#F0EEFF', color: '#6C5CE7' }}>
                  Replanifier
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
