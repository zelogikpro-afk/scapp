import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock, Trash2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Appointment } from '../../types'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
  rescheduled: 'bg-amber-500',
}

function AppointmentCard({ apt }: { apt: Appointment }) {
  return (
    <div
      className="rounded-lg p-2.5 mb-1.5 cursor-pointer hover:opacity-90 transition-opacity text-white text-xs"
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
  const { appointments, participants, addAppointment, deleteAppointment } = useAppStore()
  const { user } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month')
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_APT })
  const [loading, setLoading] = useState(false)

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

  function getAptsForDay(day: Date) {
    return appointments.filter(a => isSameDay(parseISO(a.date), day))
  }

  const upcomingApts = appointments
    .filter(a => parseISO(a.date) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 min-w-40 text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCurrentMonth(new Date())} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(['month', 'week', 'agenda'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${view === v ? 'bg-blue-600 text-white' : 'text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Agenda'}
              </button>
            ))}
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} size="sm" onClick={() => setShowModal(true)}>Ajouter</Button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Calendar */}
        <Card className="flex-1" padding="none">
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
                  className={`min-h-24 p-1.5 border-r border-b border-gray-50 dark:border-gray-800/60 last:border-r-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${!isCurrentMonth ? 'opacity-40' : ''} ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                >
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {format(day, 'd')}
                  </div>
                  {dayApts.slice(0, 3).map(apt => (
                    <AppointmentCard key={apt.id} apt={apt} />
                  ))}
                  {dayApts.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">+{dayApts.length - 3} autres</div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Sidebar: upcoming */}
        <div className="w-72 flex-shrink-0 space-y-3">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Prochains RDV</h3>
            {upcomingApts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Aucun RDV à venir</p>
            ) : (
              <div className="space-y-3">
                {upcomingApts.map(apt => (
                  <div key={apt.id} className="flex gap-3 items-start group">
                    <div className="w-1 h-12 rounded-full flex-shrink-0 mt-1" style={{ background: apt.color || '#3b82f6' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{apt.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(apt.date)} · {apt.startTime}
                      </div>
                      {apt.meetLink && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-blue-500">
                          <Video className="w-3 h-3" />
                          <a href={apt.meetLink} target="_blank" rel="noreferrer" className="hover:underline" onClick={e => e.stopPropagation()}>Google Meet</a>
                        </div>
                      )}
                      {apt.location && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" /> {apt.location}
                        </div>
                      )}
                      <Badge variant={apt.status === 'scheduled' ? 'info' : 'success'} size="sm" className="mt-1">
                        {apt.status === 'scheduled' ? 'Programmé' : apt.status}
                      </Badge>
                    </div>
                    <button onClick={async () => { if (!confirm('Supprimer ce RDV ?')) return; await deleteAppointment(apt.id); toast.success('RDV supprimé') }} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                { color: '#3b82f6', label: 'Séance coaching' },
                { color: '#8b5cf6', label: 'Session burn-out' },
                { color: '#f59e0b', label: 'Entretien découverte' },
                { color: '#10b981', label: 'Formation' },
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
