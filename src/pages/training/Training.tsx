import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Plus, Users, Calendar, MapPin } from 'lucide-react'
import { TRAINING_PROGRAMS, COHORTS } from '../../lib/mockData'
import { useAppStore } from '../../store/appStore'
import { formatDate, formatCurrency, percentage } from '../../lib/utils'
import toast from 'react-hot-toast'

const COHORT_STATUS = {
  upcoming: { label: 'À venir', color: 'info' as const },
  active: { label: 'En cours', color: 'success' as const },
  completed: { label: 'Terminée', color: 'default' as const },
  cancelled: { label: 'Annulée', color: 'danger' as const },
}

const EMPTY = {
  programId: '', name: '',
  startDate: new Date().toISOString().split('T')[0], endDate: '',
  location: '', trainerName: '',
  status: 'upcoming' as 'upcoming' | 'active' | 'completed' | 'cancelled',
  capacity: 20,
}

export default function Training() {
  const { participants } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [cohorts, setCohorts] = useState(COHORTS)
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.startDate) return toast.error('Nom et date de début requis')
    setLoading(true)
    const selectedProgram = TRAINING_PROGRAMS.find(p => p.id === form.programId)
    const newCohort = {
      id: `cohort-${Date.now()}`,
      programName: selectedProgram?.name ?? form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      location: form.location,
      trainerName: form.trainerName,
      status: form.status,
      capacity: Number(form.capacity),
      enrollmentCount: 0,
    }
    setCohorts(c => [newCohort as any, ...c])
    toast.success('Cohorte créée !')
    setShowModal(false)
    setForm({ ...EMPTY })
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Formations</h2>
          <p className="text-sm text-gray-500">{TRAINING_PROGRAMS.length} programmes · {cohorts.length} cohortes</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Nouvelle cohorte</Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Programmes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRAINING_PROGRAMS.map(prog => (
            <Card key={prog.id} hover>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ background: (prog as any).color ?? '#3b82f6' }} />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{(prog as any).name ?? prog.name}</h4>
                  {(prog as any).level && <Badge variant="info" size="sm" className="mt-1">{(prog as any).level}</Badge>}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{prog.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-gray-400">Durée</p><p className="text-sm font-semibold">{prog.durationDays} jours</p></div>
                <div><p className="text-xs text-gray-400">Prix</p><p className="text-sm font-semibold">{formatCurrency(prog.price)}</p></div>
                <div><p className="text-xs text-gray-400">Capacité max</p><p className="text-sm font-semibold">{(prog as any).maxCapacity ?? (prog as any).capacity} pers.</p></div>
                <div>
                  <p className="text-xs text-gray-400">Statut</p>
                  <Badge variant={prog.isActive ? 'success' : 'default'}>{prog.isActive ? 'Actif' : 'Inactif'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Cohortes</h3>
        <div className="space-y-4">
          {cohorts.map((cohort: any) => {
            const fillRate = percentage(cohort.enrollmentCount, cohort.capacity)
            const statusKey = cohort.status as keyof typeof COHORT_STATUS
            return (
              <Card key={cohort.id} hover>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{cohort.programName}</h4>
                      <Badge variant={COHORT_STATUS[statusKey]?.color ?? 'default'}>{COHORT_STATUS[statusKey]?.label ?? cohort.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(cohort.startDate)} → {formatDate(cohort.endDate)}</span>
                      {cohort.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{cohort.location}</span>}
                      {cohort.trainerName && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Formateur: {cohort.trainerName}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cohort.enrollmentCount}<span className="text-sm text-gray-400">/{cohort.capacity}</span></p>
                    <p className="text-xs text-gray-400">participants</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Taux de remplissage</span><span className="font-medium">{fillRate}%</span>
                  </div>
                  <Progress value={cohort.enrollmentCount} max={cohort.capacity}
                    color={fillRate > 80 ? 'green' : fillRate > 50 ? 'blue' : 'amber'} showLabel />
                </div>
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
          {cohorts.length === 0 && (
            <Card className="text-center py-12"><p className="text-gray-400">Aucune cohorte créée</p></Card>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvelle cohorte" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Programme associé</label>
            <select value={form.programId} onChange={e => setF('programId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un programme</option>
              {TRAINING_PROGRAMS.map(p => <option key={p.id} value={p.id}>{(p as any).name ?? p.name}</option>)}
            </select>
          </div>
          <Input label="Nom de la cohorte *" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="ex: Cohorte Leadership - Juin 2026" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de début *" type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
            <Input label="Date de fin" type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Lieu" value={form.location} onChange={e => setF('location', e.target.value)} placeholder="ex: Casablanca / En ligne" />
            <Input label="Formateur" value={form.trainerName} onChange={e => setF('trainerName', e.target.value)} placeholder="ex: Sofya El Amrani" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Capacité max" type="number" value={String(form.capacity)} onChange={e => setF('capacity', e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
              <select value={form.status} onChange={e => setF('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="upcoming">À venir</option>
                <option value="active">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Création…' : 'Créer la cohorte'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
