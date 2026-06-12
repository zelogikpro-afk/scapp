import { useState } from 'react'
import { Plus, Video, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { formatDate } from '../../lib/utils'
import type { SessionStatus } from '../../types'

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: any; icon: any }> = {
  scheduled: { label: 'Programmée', color: 'info', icon: Clock },
  completed: { label: 'Complétée', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'danger', icon: XCircle },
  rescheduled: { label: 'Reprogrammée', color: 'warning', icon: AlertCircle },
  missed: { label: 'Manquée', color: 'danger', icon: XCircle },
}

export default function CoachingSessions() {
  const { coachingSessions, participants, coachingPacks } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all')

  const filtered = coachingSessions.filter(s => statusFilter === 'all' || s.status === statusFilter)
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Séances de Coaching</h2>
          <p className="text-sm text-gray-500">{coachingSessions.length} séances au total</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Nouvelle séance</Button>
      </div>

      {/* Status filter */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-center transition-all ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 ring-2 ring-blue-500 ring-offset-1' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}
        >
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{coachingSessions.length}</div>
          <div className="text-xs text-gray-500">Toutes</div>
        </button>
        {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map(status => {
          const count = coachingSessions.filter(s => s.status === status).length
          const config = STATUS_CONFIG[status]
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`p-3 rounded-xl border text-center transition-all ${statusFilter === status ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}
            >
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{count}</div>
              <Badge variant={config.color} className="mt-0.5 text-xs">{config.label}</Badge>
            </button>
          )
        })}
      </div>

      {/* Sessions list */}
      <div className="space-y-3">
        {sorted.map(session => {
          const participant = participants.find(p => p.id === session.participantId)
          const pack = coachingPacks.find(cp => cp.id === session.packId)
          const config = STATUS_CONFIG[session.status]
          const Icon = config.icon

          return (
            <Card key={session.id} hover>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  session.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  session.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
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
                    <Badge variant={config.color}>{config.label}</Badge>
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

                  {session.summary && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 line-clamp-2">
                      {session.summary}
                    </p>
                  )}

                  {session.homework && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">📝 Devoir: {session.homework}</p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        {sorted.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-400">Aucune séance trouvée</p>
          </Card>
        )}
      </div>
    </div>
  )
}
