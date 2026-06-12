import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { Avatar } from '../../components/ui/Avatar'
import { Plus, Users, Calendar, MapPin } from 'lucide-react'
import { TRAINING_PROGRAMS, COHORTS } from '../../lib/mockData'
import { useAppStore } from '../../store/appStore'
import { formatDate, formatCurrency, percentage } from '../../lib/utils'

const COHORT_STATUS = {
  upcoming: { label: 'À venir', color: 'info' as const },
  active: { label: 'En cours', color: 'success' as const },
  completed: { label: 'Terminée', color: 'default' as const },
  cancelled: { label: 'Annulée', color: 'danger' as const },
}

export default function Training() {
  const { participants } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Formations</h2>
          <p className="text-sm text-gray-500">{TRAINING_PROGRAMS.length} programmes · {COHORTS.length} cohortes</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Nouvelle cohorte</Button>
      </div>

      {/* Programs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Programmes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRAINING_PROGRAMS.map(prog => (
            <Card key={prog.id} hover>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ background: prog.color }} />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{prog.name}</h4>
                  {prog.level && <Badge variant="info" size="sm" className="mt-1">{prog.level}</Badge>}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{prog.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-gray-400">Durée</p><p className="text-sm font-semibold">{prog.durationDays} jours</p></div>
                <div><p className="text-xs text-gray-400">Prix</p><p className="text-sm font-semibold">{formatCurrency(prog.price)}</p></div>
                <div><p className="text-xs text-gray-400">Capacité max</p><p className="text-sm font-semibold">{prog.maxCapacity} pers.</p></div>
                <div>
                  <p className="text-xs text-gray-400">Statut</p>
                  <Badge variant={prog.isActive ? 'success' : 'default'}>{prog.isActive ? 'Actif' : 'Inactif'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cohorts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Cohortes</h3>
        <div className="space-y-4">
          {COHORTS.map(cohort => {
            const fillRate = percentage(cohort.enrollmentCount, cohort.capacity)
            return (
              <Card key={cohort.id} hover>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{cohort.programName}</h4>
                      <Badge variant={COHORT_STATUS[cohort.status].color}>{COHORT_STATUS[cohort.status].label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(cohort.startDate)} → {formatDate(cohort.endDate)}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{cohort.location}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Formateur: {cohort.trainerName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cohort.enrollmentCount}<span className="text-sm text-gray-400">/{cohort.capacity}</span></p>
                    <p className="text-xs text-gray-400">participants</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Taux de remplissage</span>
                    <span className="font-medium">{fillRate}%</span>
                  </div>
                  <Progress
                    value={cohort.enrollmentCount}
                    max={cohort.capacity}
                    color={fillRate > 80 ? 'green' : fillRate > 50 ? 'blue' : 'amber'}
                    showLabel
                  />
                </div>

                {/* Participants preview */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {participants.slice(0, 5).map(p => (
                      <Avatar key={p.id} name={`${p.firstName} ${p.lastName}`} size="xs" className="ring-2 ring-white dark:ring-gray-900" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{cohort.enrollmentCount} inscrits</span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
