import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock, Trash2, User, CalendarDays, Pencil } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, addWeeks, addMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Appointment, CoachingPack, Participant } from '../../types'
import toast from 'react-hot-toast'

const DAY_MAP: Record<string, number> = {
  Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6,
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const d = addMinutes(new Date(2000, 0, 1, h, m), minutes)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function generateSlotEvents(
  packs: CoachingPack[],
  participantsMap: Record<string, Participant>,
  rangeStart: Date,
  rangeEnd: Date,
): Appointment[] {
  const events: Appointment[] = []
  for (const pack of packs) {
    if (!pack.weeklySlot || pack.status === 'expired' || pack.status === 'completed') continue
    const [day, time] = pack.weeklySlot.split(' ')
    const targetDay = DAY_MAP[day]
    if (targetDay === undefined || !time) continue

    const packStart = parseISO(pack.purchaseDate)
    const packEnd = pack.expirationDate ? parseISO(pack.expirationDate) : rangeEnd

    // Find first occurrence of targetDay at or after max(packStart, rangeStart)
    const windowStart = packStart > rangeStart ? packStart : rangeStart
    let cur = new Date(windowStart)
    while (cur.getDay() !== targetDay) cur = addWeeks(cur, 0) && new Date(cur.getTime() + 86400000)

    const remaining = pack.totalSessions - pack.usedSessions
    const participant = participantsMap[pack.participantId]
    const name = participant ? `${participant.firstName} ${participant.lastName}` : ''
    let count = 0

    while (cur <= rangeEnd && cur <= packEnd && count < remaining) {
      events.push({
        id: `slot-${pack.id}-${cur.toISOString()}`,
        title: `Coaching · ${name}`,
        participantId: pack.participantId,
        participantName: name,
        coachId: '',
        coachName: '',
        programType: 'coaching',
        date: format(cur, 'yyyy-MM-dd'),
        startTime: time,
        endTime: addMinutesToTime(time, 50),
        status: 'scheduled',
        reminderSent: false,
        color: '#0d9488',
      })
      cur = addWeeks(cur, 1)
      count++
    }
  }
  return events
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
  rescheduled: 'bg-amber-500',
}

function AppointmentCard({ apt, onClick }: { apt: Appointment; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg p-2.5 mb-1.5 cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all text-white text-xs"
      style={{ backgroundColor: apt.color || '#3b82f6' }}
    >
      <p className="font-semibold truncate">{apt.title}</p>
      <p className="opacity-80">{apt.startTime} — {apt.endTime}</p>
      {apt.participantName && <p className="opacity-80 truncate">{apt.participantName}</p>}
    </div>
  )
}

const EMPTY_APT = {
  title: '', participantId: '', participantName: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '10:00', endTime: '11:00',
  location: '', meetLink: '', notes: '', programType: 'coaching',
}

export default function CalendarPage() {
  const { appointments, participants, coachingPacks, coachingSessions, addAppointment, updateAppointment, deleteAppointment } = useAppStore()
  const { user } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month')
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_APT })
  const [loading, setLoading] = useState(false)

  const openDetail = (apt: Appointment) => {
    setSelectedApt(apt)
    setEditMode(false)
    setEditForm({
      title: apt.title, participantId: apt.participantId ?? '',
      date: apt.date, startTime: apt.startTime, endTime: apt.endTime,
      location: apt.location ?? '', meetLink: apt.meetLink ?? '',
      notes: apt.notes ?? '', status: apt.status, color: apt.color ?? '#3B82F6',
    })
    setShowDetail(true)
  }
  const handleDelete = async (apt: Appointment) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return
    await deleteAppointment(apt.id)
    setShowDetail(false)
    toast.success('RDV supprimé')
  }
  const handleEdit = async () => {
    if (!selectedApt) return
    setLoading(true)
    try {
      const p = participants.find(x => x.id === editForm.participantId)
      await updateAppointment(selectedApt.id, {
        ...editForm,
        participantName: p ? `${p.firstName} ${p.lastName}` : selectedApt.participantName,
      })
      setSelectedApt(a => a ? { ...a, ...editForm, participantName: p ? `${p.firstName} ${p.lastName}` : a.participantName } : a)
      setEditMode(false)
      toast.success('RDV modifié !')
    } catch { toast.error('Erreur lors de la modification') }
    setLoading(false)
  }
  const setEF = (k: string, v: any) => setEditForm((f: any) => ({ ...f, [k]: v }))

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleParticipantChange = (id: string) => {
    const p = participants.find(x => x.id === id)
    setForm(f => ({ ...f, participantId: id, participantName: p ? `${p.firstName} ${p.lastName}` : '' }))
  }

  const handleSubmitApt = async () => {
    if (!form.title || !form.date) return toast.error('Titre et date requis')
    setLoading(true)
    try {
      await addAppointment({
        title: form.title,
        participantId: form.participantId || undefined,
        participantName: form.participantName || undefined,
        coachId: user?.id ?? '',
        coachName: user?.name ?? '',
        programType: form.programType as 'coaching' | 'training',
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location || undefined,
        meetLink: form.meetLink || undefined,
        zoomLink: undefined,
        notes: form.notes || undefined,
        status: 'scheduled',
        reminderSent: false,
        color: '#3B82F6',
      })
      toast.success('Rendez-vous créé !')
      setShowModal(false)
      setForm({ ...EMPTY_APT })
    } catch { toast.error('Erreur lors de la création') }
    setLoading(false)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const participantsMap = useMemo(() =>
    Object.fromEntries(participants.map(p => [p.id, p])),
    [participants]
  )

  const slotEvents = useMemo(() =>
    generateSlotEvents(coachingPacks, participantsMap, calStart, calEnd),
    [coachingPacks, participantsMap, calStart.toISOString(), calEnd.toISOString()]
  )

  // Convert coaching sessions into calendar events
  const sessionEvents = useMemo(() => coachingSessions.map(s => {
    const pack = coachingPacks.find(p => p.id === s.packId)
    const participant = participantsMap[s.participantId]
    const name = participant ? `${participant.firstName} ${participant.lastName}` : ''
    const endTime = addMinutesToTime(s.time, s.duration ?? 50)
    const colorMap: Record<string, string> = { completed: '#10b981', cancelled: '#ef4444', no_show: '#f59e0b', scheduled: '#6366f1' }
    return {
      id: `session-${s.id}`,
      title: `Séance #${s.sessionNumber}${pack ? ` · ${pack.name}` : ''}`,
      participantId: s.participantId,
      participantName: name,
      coachId: s.coachId ?? '',
      coachName: 'SOFYA EL QOUASSI',
      programType: 'coaching' as const,
      date: s.date,
      startTime: s.time,
      endTime,
      meetLink: s.meetLink,
      notes: s.summary,
      status: s.status === 'completed' ? 'completed' : s.status === 'cancelled' ? 'cancelled' : 'scheduled',
      reminderSent: false,
      color: colorMap[s.status] ?? '#6366f1',
    } as typeof appointments[0]
  }), [coachingSessions, coachingPacks, participantsMap])

  const allAppointments = useMemo(() => [...appointments, ...slotEvents, ...sessionEvents], [appointments, slotEvents, sessionEvents])

  function getAptsForDay(day: Date) {
    return allAppointments.filter(a => isSameDay(parseISO(a.date), day))
  }

  const upcomingApts = allAppointments
    .filter(a => parseISO(a.date) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 10)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 min-w-32 text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCurrentMonth(new Date())} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap">
            Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 sm:flex-none">
            {(['month', 'week', 'agenda'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors capitalize ${view === v ? 'bg-blue-600 text-white' : 'text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Sem.' : 'Agenda'}
              </button>
            ))}
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} size="sm" onClick={() => setShowModal(true)}>
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Calendar */}
        <Card className="flex-1 min-w-0" padding="none">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
            {weekDays.map(d => (
              <div key={d} className="px-2 py-2.5 text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayApts = getAptsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)
              return (
                <div
                  key={i}
                  className={`min-h-16 sm:min-h-24 p-0.5 sm:p-1.5 border-r border-b border-gray-50 dark:border-gray-800/60 last:border-r-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${!isCurrentMonth ? 'opacity-40' : ''} ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                >
                  <div className={`text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-0.5 sm:mb-1 ${today ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="hidden sm:block">
                    {dayApts.slice(0, 3).map(apt => (
                      <AppointmentCard key={apt.id} apt={apt} onClick={() => openDetail(apt)} />
                    ))}
                    {dayApts.length > 3 && (
                      <div className="text-xs text-gray-400 pl-1">+{dayApts.length - 3}</div>
                    )}
                  </div>
                  {/* Mobile: dot indicators */}
                  {dayApts.length > 0 && (
                    <div className="flex sm:hidden flex-wrap gap-0.5 mt-0.5" onClick={() => openDetail(dayApts[0])}>
                      {dayApts.slice(0, 3).map(apt => (
                        <div key={apt.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: apt.color || '#3b82f6' }} />
                      ))}
                      {dayApts.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Sidebar: upcoming */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Prochains RDV</h3>
            {upcomingApts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Aucun RDV à venir</p>
            ) : (
              <div className="space-y-3">
                {upcomingApts.map(apt => (
                  <div key={apt.id} onClick={() => openDetail(apt)} className="flex gap-3 items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-1 -mx-1 transition-colors">
                    <div className="w-1 h-12 rounded-full flex-shrink-0 mt-1" style={{ background: apt.color || '#3b82f6' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{apt.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(apt.date)} · {apt.startTime}
                      </div>
                      {apt.location && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" /> {apt.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Legend */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Légende</h3>
            <div className="space-y-2">
              {[
                { color: '#0d9488', label: 'Créneau fixe (auto)' },
                { color: '#6366f1', label: 'Séance programmée' },
                { color: '#10b981', label: 'Séance complétée' },
                { color: '#ef4444', label: 'Séance annulée' },
                { color: '#3b82f6', label: 'RDV manuel' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Detail / Edit modal */}
      {selectedApt && (
        <Modal open={showDetail} onClose={() => { setShowDetail(false); setEditMode(false) }}
          title={editMode ? 'Modifier le rendez-vous' : 'Rendez-vous'} size="md">
          {!editMode ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-sm mt-1.5 flex-shrink-0" style={{ background: selectedApt.color || '#3b82f6' }} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{selectedApt.title}</p>
                  {selectedApt.id.startsWith('slot-') && (
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Créneau fixe (auto)</span>
                  )}
                  {selectedApt.id.startsWith('session-') && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Séance enregistrée</span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                  <CalendarDays className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span>{formatDate(selectedApt.date)} · {selectedApt.startTime} — {selectedApt.endTime}</span>
                </div>
                {selectedApt.participantName && (
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>{selectedApt.participantName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4 flex-shrink-0 text-violet-400" />
                  <span>Coach : <span className="font-medium text-gray-800 dark:text-gray-200">SOFYA EL QOUASSI</span></span>
                </div>
                {selectedApt.coachName && (
                  <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-500 text-xs">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Créé par : {selectedApt.coachName}</span>
                  </div>
                )}
                {selectedApt.location && (
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>{selectedApt.location}</span>
                  </div>
                )}
                {selectedApt.meetLink && (
                  <div className="flex items-center gap-2.5 text-blue-500">
                    <Video className="w-4 h-4 flex-shrink-0" />
                    <a href={selectedApt.meetLink} target="_blank" rel="noreferrer" className="hover:underline truncate">{selectedApt.meetLink}</a>
                  </div>
                )}
                {selectedApt.notes && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                    {selectedApt.notes}
                  </div>
                )}
                <Badge variant={selectedApt.status === 'scheduled' ? 'info' : selectedApt.status === 'completed' ? 'success' : 'danger'}>
                  {selectedApt.status === 'scheduled' ? 'Programmé' : selectedApt.status === 'completed' ? 'Terminé' : selectedApt.status === 'cancelled' ? 'Annulé' : selectedApt.status}
                </Badge>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                {!selectedApt.id.startsWith('slot-') && !selectedApt.id.startsWith('session-') ? (
                  <button onClick={() => handleDelete(selectedApt)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  {!selectedApt.id.startsWith('slot-') && !selectedApt.id.startsWith('session-') && (
                    <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditMode(true)}>Modifier</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>Fermer</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input label="Titre *" value={editForm.title} onChange={e => setEF('title', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participant</label>
                <select value={editForm.participantId} onChange={e => setEF('participantId', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Aucun —</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Date *" type="date" value={editForm.date} onChange={e => setEF('date', e.target.value)} />
                <Input label="Début" type="time" value={editForm.startTime} onChange={e => setEF('startTime', e.target.value)} />
                <Input label="Fin" type="time" value={editForm.endTime} onChange={e => setEF('endTime', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Lieu" value={editForm.location} onChange={e => setEF('location', e.target.value)} />
                <Input label="Lien Meet" value={editForm.meetLink} onChange={e => setEF('meetLink', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                <select value={editForm.status} onChange={e => setEF('status', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="scheduled">Programmé</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="rescheduled">Reporté</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEF('notes', e.target.value)} rows={2}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" onClick={() => setEditMode(false)}>Annuler</Button>
                <Button variant="primary" onClick={handleEdit} disabled={loading}>{loading ? 'Enregistrement…' : 'Enregistrer'}</Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau rendez-vous" size="md">
        <div className="space-y-4">
          <Input label="Titre *" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="ex: Séance coaching Houda" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participant</label>
            <select value={form.participantId} onChange={e => handleParticipantChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un participant</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Date *" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            <Input label="Début" type="time" value={form.startTime} onChange={e => setF('startTime', e.target.value)} />
            <Input label="Fin" type="time" value={form.endTime} onChange={e => setF('endTime', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Lieu" value={form.location} onChange={e => setF('location', e.target.value)} placeholder="ex: Bureau / En ligne" />
            <Input label="Lien Meet" value={form.meetLink} onChange={e => setF('meetLink', e.target.value)} placeholder="https://meet.google.com/..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmitApt} disabled={loading}>{loading ? 'Création…' : 'Créer le rendez-vous'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
