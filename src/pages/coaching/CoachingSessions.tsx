import { useState, useMemo } from 'react'
import { Plus, Video, Clock, CheckCircle, XCircle, Trash2, Pencil, Search } from 'lucide-react'
import DateRangeFilter, { type Preset, type DateRange, getRange, inRange } from '../../components/ui/DateRangeFilter'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Séances de Coaching</h2>
          <p className="text-sm text-gray-500">{coachingSessions.length} séances au total</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); setShowModal(true) }}>Nouvelle séance</Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-48">
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

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <button onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-center transition-all ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 ring-2 ring-blue-500 ring-offset-1' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{coachingSessions.length}</div>
          <div className="text-xs text-gray-500">Toutes</div>
        </button>
        {Object.keys(STATUS_CONFIG).map(status => {
          const count = coachingSessions.filter(s => s.status === status).length
          const config = STATUS_CONFIG[status]
          return (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`p-3 rounded-xl border text-center transition-all ${statusFilter === status ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{count}</div>
              <Badge variant={config.color} className="mt-0.5 text-xs">{config.label}</Badge>
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {sorted.map(session => {
          const participant = participants.find(p => p.id === session.participantId)
          const pack = coachingPacks.find(cp => cp.id === session.packId)
          const config = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.scheduled
          const Icon = config.icon
          return (
            <Card key={session.id} hover>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  session.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  session.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {participant && <Avatar name={`${participant.firstName} ${participant.lastName}`} size="sm" />}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          Séance #{session.sessionNumber} — {participant ? `${participant.firstName} ${participant.lastName}` : ''}
                        </p>
                        {pack && <p className="text-xs text-gray-400">{pack.name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={config.color}>{config.label}</Badge>
                      <button onClick={() => openEdit(session)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(session.id)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(session.date)} à {session.time}</span>
                    <span>{session.duration} min</span>
                    {session.meetLink && (
                      <a href={session.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                        <Video className="w-3.5 h-3.5" /> Meet
                      </a>
                    )}
                  </div>
                  {session.summary && <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 line-clamp-2">{session.summary}</p>}
                  {session.homework && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">📝 {session.homework}</p>}
                </div>
              </div>
            </Card>
          )
        })}
        {sorted.length === 0 && (
          <Card className="text-center py-12"><p className="text-gray-400">Aucune séance trouvée</p></Card>
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
