import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { formatDate, formatCurrency } from '../../lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Appointment } from '../../types'

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

export default function CalendarPage() {
  const { appointments } = useAppStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month')
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)

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
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} size="sm">Ajouter</Button>
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
                  <div key={apt.id} className="flex gap-3 items-start">
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
    </div>
  )
}
