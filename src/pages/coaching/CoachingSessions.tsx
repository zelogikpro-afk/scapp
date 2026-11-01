import { useState, useMemo, useEffect } from 'react'
import { Plus, Video, Clock, CheckCircle, XCircle, Trash2, Pencil, Search } from 'lucide-react'
import DateRangeFilter, { type Preset, type DateRange, getRange, inRange } from '../../components/ui/DateRangeFilter'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHero, HeroBtn } from '../../components/ui/PageHero'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import type { SessionStatus } from '../../types'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { label: string; color: any; icon: any }> = {
  scheduled: { label: 'Programmée', color: 'info', icon: Clock },
  completed: { label: 'Complétée', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'danger', icon: XCircle },
  no_show: { label: 'Absent', color: 'danger', icon: XCircle },
}

const EMPTY = {
  packId: '', date: new Date().toISOString().split('T')[0],
  time: '10:00', duration: 60, sessionNumber: 1,
  status: 'scheduled' as SessionStatus, meetLink: '', summary: '', homework: '',
}

export default function CoachingSessions() {
  const { coachingSessions, participants, coachingPacks, addCoachingSession, updateCoachingSession, deleteCoachingSession } = useAppStore()
  const { user } = useAuthStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [participantFilter, setParticipantFilter] = useState<string>('all')
  const [packFilter, setPackFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [preset, setPreset] = useState<Preset>('all')
  const [range, setRange] = useState<DateRange>(getRange('all'))
  const [showModal, setShowModal] = useState(false)

  const handleDateChange = (p: Preset, r: DateRange) => { setPreset(p); setRange(r) }
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const filtered = useMemo(() => coachingSessions.filter(s => {
    const matchStatus      = statusFilter === 'all' || s.status === statusFilter
    const matchDate        = inRange(s.date, range)
    const matchParticipant = participantFilter === 'all' || s.participantId === participantFilter
    const matchPack        = packFilter === 'all' || s.packId === packFilter
    const matchSearch      = !search || (() => {
      const p = participants.find(x => x.id === s.participantId)
      return p ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) : false
    })()
    return matchStatus && matchDate && matchParticipant && matchPack && matchSearch
  }), [coachingSessions, statusFilter, range, participantFilter, packFilter, search, participants])
  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const selectedPack = coachingPacks.find(p => p.id === form.packId)

  function openEdit(s: typeof coachingSessions[0]) {
    setEditId(s.id)
    setForm({ packId: s.packId, date: s.date, time: s.time || '10:00', duration: s.duration, sessionNumber: s.sessionNumber, status: s.status, meetLink: s.meetLink || '', summary: s.summary || '', homework: s.homework || '' })
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette séance ?')) return
    await deleteCoachingSession(id)
    toast.success('Séance supprimée')
  }

  const handleSubmit = async () => {
    if (!form.packId) return toast.error('Sélectionner un pack')
    setLoading(true)
    try {
      if (editId) {
        await updateCoachingSession(editId, { date: form.date, time: form.time, duration: Number(form.duration), sessionNumber: Number(form.sessionNumber), status: form.status, meetLink: form.meetLink || undefined, summary: form.summary || undefined, homework: form.homework || undefined })
        toast.success('Séance modifiée !')
      } else {
        await addCoachingSession({ packId: form.packId, participantId: selectedPack?.participantId ?? '', coachId: user?.id ?? '', date: form.date, time: form.time, duration: Number(form.duration), sessionNumber: Number(form.sessionNumber), status: form.status, meetLink: form.meetLink || undefined, summary: form.summary || undefined, homework: form.homework || undefined, objectives: undefined, privateNotes: undefined, zoomLink: undefined })
        toast.success('Séance créée !')
      }
      setShowModal(false)
      setEditId(null)
      setForm({ ...EMPTY })
    } catch { toast.error('Erreur lors de la création') }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <PageHero
        emoji="🎯"
        title="Séances de Coaching"
        sub={`${coachingSessions.length} séances · ${coachingSessions.filter(s => s.status === 'scheduled').length} programmées`}
        gradient="linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)"
        actions={<HeroBtn onClick={() => { setEditId(null); setForm({ ...EMPTY }); setShowModal(true) }}>+ Nouvelle séance</HeroBtn>}
        stats={[
          { label: 'Complétées', value: coachingSessions.filter(s => s.status === 'completed').length },
          { label: 'Programmées', value: coachingSessions.filter(s => s.status === 'scheduled').length },
          { label: 'Annulées', value: coachingSessions.filter(s => s.status === 'cancelled' || s.status === 'missed').length },
        ]}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ minWidth: 180, flex: 1 }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un participant…" icon={<Search className="w-4 h-4" />} />
        </div>
        <DateRangeFilter value={preset} onChange={handleDateChange} />
        <select value={participantFilter} onChange={e => setParticipantFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tous les participants</option>
          {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
        <select value={packFilter} onChange={e => setPackFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tous les packs</option>
          {coachingPacks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'all', label: 'Toutes', count: coachingSessions.length, bg: '#EFF6FF', color: '#1A73E8' },
          { key: 'scheduled', label: 'Programmées', count: coachingSessions.filter(s => s.status === 'scheduled').length, bg: '#EFF6FF', color: '#1A73E8' },
          { key: 'completed', label: 'Complétées', count: coachingSessions.filter(s => s.status === 'completed').length, bg: '#F0FDF4', color: '#16A34A' },
          { key: 'cancelled', label: 'Annulées', count: coachingSessions.filter(s => s.status === 'cancelled').length, bg: '#FEF2F2', color: '#DC2626' },
          { key: 'missed', label: 'Absent', count: coachingSessions.filter(s => s.status === 'missed').length, bg: '#FFF7ED', color: '#EA580C' },
        ].map(item => {
          const isActive = statusFilter === item.key
          return (
            <button key={item.key} onClick={() => setStatusFilter(item.key)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, border: isActive ? 'none' : `1.5px solid ${item.bg}`, background: isActive ? item.color : item.bg, cursor: 'pointer', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? '#fff' : item.color }}>{item.count}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.85)' : item.color, whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Session list */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2ECF8', boxShadow: '0 2px 12px rgba(26,115,232,0.06)', overflow: 'hidden' }}>
        {sorted.map((session, i) => {
          const participant = participants.find(p => p.id === session.participantId)
          const pack = coachingPacks.find(cp => cp.id === session.packId)
          const config = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.scheduled
          const Icon = config.icon
          const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
            scheduled: { bg: '#EFF6FF', color: '#1A73E8' },
            completed: { bg: '#F0FDF4', color: '#16A34A' },
            cancelled: { bg: '#FEF2F2', color: '#DC2626' },
            no_show:   { bg: '#FFF7ED', color: '#EA580C' },
          }
          const sb = STATUS_BADGE[session.status] || STATUS_BADGE.scheduled
          const iconBg = session.status === 'completed' ? 'linear-gradient(135deg,#10b981,#34d399)' : session.status === 'scheduled' ? 'linear-gradient(135deg,#1A73E8,#4F94F0)' : 'linear-gradient(135deg,#94a3b8,#cbd5e1)'
          return (
            <div key={session.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', borderBottom: i < sorted.length - 1 ? '1px solid #F0F7FF' : 'none' }}>
              {/* Status icon */}
              <div style={{ width: 42, height: 42, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {participant && <Avatar name={`${participant.firstName} ${participant.lastName}`} size="sm" />}
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', margin: 0 }}>
                        Séance #{session.sessionNumber} — {participant ? `${participant.firstName} ${participant.lastName}` : '—'}
                      </p>
                      {pack && <p style={{ fontSize: 11, color: '#6B88A8', margin: '2px 0 0' }}>{pack.name}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: sb.bg, color: sb.color }}>
                      {config.label}
                    </span>
                    <button onClick={() => openEdit(session)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#F0F7FF', color: '#1A73E8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(session.id)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 12, color: '#6B88A8', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock className="w-3.5 h-3.5" />{formatDate(session.date)} à {session.time}
                  </span>
                  <span style={{ background: '#F0F7FF', color: '#1A73E8', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{session.duration} min</span>
                  {session.meetLink && (
                    <a href={session.meetLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1A73E8', fontWeight: 600, textDecoration: 'none', fontSize: 12 }}>
                      <Video className="w-3.5 h-3.5" /> Meet
                    </a>
                  )}
                </div>
                {session.summary && <p style={{ marginTop: 8, fontSize: 12, color: '#6B88A8', background: '#F8FAFF', borderRadius: 8, padding: '8px 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{session.summary}</p>}
                {session.homework && <p style={{ marginTop: 6, fontSize: 12, color: '#D97706' }}>📝 {session.homework}</p>}
              </div>
            </div>
          )
        })}
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 16px', color: '#94A3B8', fontSize: 14 }}>Aucune séance trouvée</div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditId(null) }} title={editId ? 'Modifier la séance' : 'Nouvelle séance de coaching'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pack de coaching *</label>
            <select value={form.packId} onChange={e => setF('packId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un pack</option>
              {coachingPacks.filter(p => p.status === 'active').map(p => {
                const part = participants.find(x => x.id === p.participantId)
                return <option key={p.id} value={p.id}>{p.name} — {part ? `${part.firstName} ${part.lastName}` : ''}</option>
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            <Input label="Heure" type="time" value={form.time} onChange={e => setF('time', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Durée (min)" type="number" value={String(form.duration)} onChange={e => setF('duration', e.target.value)} />
            <Input label="N° de séance" type="number" value={String(form.sessionNumber)} onChange={e => setF('sessionNumber', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
            <select value={form.status} onChange={e => setF('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="scheduled">Programmée</option>
              <option value="completed">Complétée</option>
              <option value="cancelled">Annulée</option>
              <option value="no_show">Absent</option>
            </select>
          </div>
          <Input label="Lien Google Meet" value={form.meetLink} onChange={e => setF('meetLink', e.target.value)} placeholder="https://meet.google.com/..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Résumé de la séance</label>
            <textarea value={form.summary} onChange={e => setF('summary', e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devoir / Action à faire</label>
            <textarea value={form.homework} onChange={e => setF('homework', e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditId(null) }}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Créer la séance'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
