import { useState, useMemo, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Plus, Users, Calendar, MapPin, Search, Pencil, Trash2 } from 'lucide-react'
import DateRangeFilter, { type Preset, type DateRange, getRange, inRange } from '../../components/ui/DateRangeFilter'
import { supabaseAdmin } from '../../lib/supabase'
import { useAppStore } from '../../store/appStore'
import { formatDate, formatCurrency, percentage } from '../../lib/utils'
import toast from 'react-hot-toast'

interface TrainingProgram {
  id: string; name: string; description: string | null; level: string;
  duration_days: number; price: number; max_capacity: number; is_active: boolean; color: string
}
interface Promotion {
  id: string; program_id: string | null; program_name: string | null; name: string | null;
  level: string; start_date: string | null; end_date: string | null; location: string | null;
  trainer_name: string | null; capacity: number; enrollment_count: number;
  status: string; is_active: boolean; created_at: string
}

const PROMO_STATUS = {
  upcoming:  { label: 'À venir',  color: 'info' as const },
  active:    { label: 'En cours', color: 'success' as const },
  completed: { label: 'Terminée', color: 'default' as const },
  cancelled: { label: 'Annulée',  color: 'danger' as const },
}

const EMPTY_FORM = {
  programId: '', name: '',
  startDate: new Date().toISOString().split('T')[0], endDate: '',
  location: '', trainerName: '',
  status: 'upcoming' as string,
  capacity: 20,
}

export default function Training() {
  const { participants, payments } = useAppStore()
  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [preset, setPreset] = useState<Preset>('all')
  const [range, setRange] = useState<DateRange>(getRange('all'))
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoadingData(true)
    const [progRes, promoRes] = await Promise.all([
      supabaseAdmin.from('training_programs').select('*').order('level'),
      supabaseAdmin.from('promotions').select('*').order('created_at', { ascending: false }),
    ])
    setPrograms(progRes.data || [])
    setPromotions(promoRes.data || [])
    setLoadingData(false)
  }

  const handleDateChange = (p: Preset, r: DateRange) => { setPreset(p); setRange(r) }

  const filteredPromos = useMemo(() => promotions.filter(p => {
    const displayName = p.program_name || p.name || ''
    const matchSearch = !search || displayName.toLowerCase().includes(search.toLowerCase()) || (p.trainer_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchLevel  = levelFilter === 'all' || p.level === levelFilter
    const matchDate   = inRange(p.start_date || '', range)
    return matchSearch && matchStatus && matchLevel && matchDate
  }), [promotions, search, statusFilter, levelFilter, range])

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setEF = (k: string, v: any) => setEditForm(f => ({ ...f, [k]: v }))

  function openEdit(promo: Promotion) {
    setEditingPromo(promo)
    setEditForm({
      programId: promo.program_id || '',
      name: promo.name || promo.program_name || '',
      startDate: promo.start_date || '',
      endDate: promo.end_date || '',
      location: promo.location || '',
      trainerName: promo.trainer_name || '',
      status: promo.status,
      capacity: promo.capacity,
    })
    setSelectedPromo(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette promotion ?')) return
    await supabaseAdmin.from('promotions').delete().eq('id', id)
    setPromotions(p => p.filter(x => x.id !== id))
    setSelectedPromo(null)
    toast.success('Promotion supprimée')
  }

  async function handleEditSubmit() {
    if (!editingPromo) return
    setSaving(true)
    const prog = programs.find(p => p.id === editForm.programId)
    const payload = {
      program_id: editForm.programId || null,
      program_name: prog?.name || editForm.name,
      name: editForm.name,
      level: prog?.level || editingPromo.level,
      start_date: editForm.startDate || null,
      end_date: editForm.endDate || null,
      location: editForm.location || null,
      trainer_name: editForm.trainerName || null,
      status: editForm.status,
      capacity: Number(editForm.capacity),
    }
    await supabaseAdmin.from('promotions').update(payload).eq('id', editingPromo.id)
    setSaving(false); setEditingPromo(null)
    toast.success('Promotion modifiée')
    await loadData()
  }

  async function handleSubmit() {
    if (!form.name || !form.startDate) return toast.error('Nom et date de début requis')
    setSaving(true)
    const prog = programs.find(p => p.id === form.programId)
    await supabaseAdmin.from('promotions').insert({
      program_id: form.programId || null,
      program_name: prog?.name || form.name,
      name: form.name,
      level: prog?.level || 'N1',
      start_date: form.startDate,
      end_date: form.endDate || null,
      location: form.location || null,
      trainer_name: form.trainerName || null,
      status: form.status,
      capacity: Number(form.capacity),
      enrollment_count: 0,
    })
    toast.success('Promotion créée !')
    setShowModal(false); setForm({ ...EMPTY_FORM }); setSaving(false)
    await loadData()
  }

  function getPromoParticipants(promoId: string) {
    return participants.filter(p => {
      if (p.promotionId === promoId) return true
      if (p.reference) return p.reference.split(',').map((s: string) => s.trim()).includes(promoId)
      return false
    })
  }

  if (loadingData) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Formations</h2>
          <p className="text-sm text-gray-500">{programs.length} programmes · {promotions.length} promotions</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Nouvelle promotion</Button>
      </div>

      {/* Programs */}
      {programs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Programmes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {programs.map(prog => (
              <Card key={prog.id} hover>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ background: prog.color || '#3b82f6' }} />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{prog.name}</h4>
                    <Badge variant="info" size="sm" className="mt-1">{prog.level}</Badge>
                  </div>
                </div>
                {prog.description && <p className="text-xs text-gray-500 mb-3">{prog.description}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-xs text-gray-400">Durée</p><p className="text-sm font-semibold">{prog.duration_days} jours</p></div>
                  <div><p className="text-xs text-gray-400">Prix</p><p className="text-sm font-semibold">{formatCurrency(prog.price)}</p></div>
                  <div><p className="text-xs text-gray-400">Capacité max</p><p className="text-sm font-semibold">{prog.max_capacity} pers.</p></div>
                  <div><p className="text-xs text-gray-400">Statut</p><Badge variant={prog.is_active ? 'success' : 'default'}>{prog.is_active ? 'Actif' : 'Inactif'}</Badge></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Promotions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Promotions</h3>
        <div className="flex gap-3 flex-wrap items-center mb-4">
          <div className="flex-1 min-w-48">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" icon={<Search className="w-4 h-4" />} />
          </div>
          <DateRangeFilter value={preset} onChange={handleDateChange} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Tous les statuts</option>
            <option value="upcoming">À venir</option>
            <option value="active">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Tous les niveaux</option>
            <option value="N1">N1 — Coach de vie</option>
            <option value="N2">N2 — Master Coach Thérapeute</option>
            <option value="N3">N3 — Master Coach Consultant</option>
          </select>
        </div>
        <div className="space-y-4">
          {filteredPromos.map(promo => {
            const promoParticipants = getPromoParticipants(promo.id)
            const count = promoParticipants.length || promo.enrollment_count
            const fillRate = percentage(count, promo.capacity)
            const statusKey = promo.status as keyof typeof PROMO_STATUS
            const displayName = promo.program_name || promo.name || '—'
            return (
              <Card key={promo.id} hover onClick={() => setSelectedPromo(promo)} className="cursor-pointer">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{displayName}</h4>
                      {promo.name && promo.name !== displayName && <span className="text-xs text-gray-400">{promo.name}</span>}
                      <Badge variant={PROMO_STATUS[statusKey]?.color ?? 'default'}>{PROMO_STATUS[statusKey]?.label ?? promo.status}</Badge>
                      <Badge variant="info" size="sm">{promo.level}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(promo.start_date || '')} → {formatDate(promo.end_date || '')}</span>
                      {promo.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{promo.location}</span>}
                      {promo.trainer_name && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Formateur: {promo.trainer_name}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}<span className="text-sm text-gray-400">/{promo.capacity}</span></p>
                    <p className="text-xs text-gray-400">participants</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Taux de remplissage</span><span className="font-medium">{fillRate}%</span>
                  </div>
                  <Progress value={count} max={promo.capacity} color={fillRate > 80 ? 'green' : fillRate > 50 ? 'blue' : 'amber'} showLabel />
                </div>
                {promoParticipants.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {promoParticipants.slice(0, 5).map(p => (
                        <Avatar key={p.id} name={`${p.firstName} ${p.lastName}`} size="xs" className="ring-2 ring-white dark:ring-gray-900" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{count} inscrits</span>
                  </div>
                )}
              </Card>
            )
          })}
          {filteredPromos.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-gray-400">{promotions.length === 0 ? 'Aucune promotion créée' : 'Aucune promotion correspond aux filtres'}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvelle promotion" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Programme associé</label>
            <select value={form.programId} onChange={e => setF('programId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un programme</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}{p.level ? ` (${p.level})` : ''}</option>)}
            </select>
          </div>
          <Input label="Nom de la promotion *" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="ex: Promo N1 — Mai 2025" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de début *" type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
            <Input label="Date de fin" type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Lieu" value={form.location} onChange={e => setF('location', e.target.value)} placeholder="ex: Casablanca / En ligne" />
            <Input label="Formateur" value={form.trainerName} onChange={e => setF('trainerName', e.target.value)} placeholder="ex: Zineb Eddaqaqi" />
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
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Création…' : 'Créer la promotion'}</Button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!selectedPromo} onClose={() => setSelectedPromo(null)} title={selectedPromo ? (selectedPromo.program_name || selectedPromo.name || '') : ''} size="lg">
        {selectedPromo && (() => {
          const promoParticipants = getPromoParticipants(selectedPromo.id)
          const count = promoParticipants.length || selectedPromo.enrollment_count
          const fillRate = percentage(count, selectedPromo.capacity)
          const statusKey = selectedPromo.status as keyof typeof PROMO_STATUS
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Badge variant={PROMO_STATUS[statusKey]?.color ?? 'default'}>{PROMO_STATUS[statusKey]?.label ?? selectedPromo.status}</Badge>
                <Badge variant="info">{selectedPromo.level}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400 mb-0.5">Début</p><p className="font-medium">{formatDate(selectedPromo.start_date || '')}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Fin</p><p className="font-medium">{selectedPromo.end_date ? formatDate(selectedPromo.end_date) : '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Lieu</p><p className="font-medium">{selectedPromo.location || '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Formateur</p><p className="font-medium">{selectedPromo.trainer_name || '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Capacité</p><p className="font-medium">{count} / {selectedPromo.capacity}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Remplissage</p><p className="font-medium">{fillRate}%</p></div>
              </div>
              <Progress value={count} max={selectedPromo.capacity} color={fillRate > 80 ? 'green' : fillRate > 50 ? 'blue' : 'amber'} showLabel />
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Participants ({promoParticipants.length})</h4>
                {promoParticipants.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {promoParticipants.map(p => {
                      const pay = payments.find((x: any) => (x.participantName || x.participant_name || '').toLowerCase().includes(p.lastName?.toLowerCase() ?? ''))
                      return (
                        <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center gap-3">
                            <Avatar name={`${p.firstName} ${p.lastName}`} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.firstName} {p.lastName}</p>
                              {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                            </div>
                          </div>
                          {pay && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Payé: <span className="font-semibold text-emerald-600">{formatCurrency(pay.amountPaid ?? 0)}</span></p>
                              <p className="text-xs text-gray-500">Reste: <span className="font-semibold text-amber-600">{formatCurrency((pay.totalAmount ?? 0) - (pay.amountPaid ?? 0))}</span></p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun participant lié à cette promotion.</p>
                )}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(selectedPromo.id)}>Supprimer</Button>
                <Button variant="primary" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(selectedPromo)}>Modifier</Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingPromo} onClose={() => setEditingPromo(null)} title="Modifier la promotion" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Programme associé</label>
            <select value={editForm.programId} onChange={e => setEF('programId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un programme</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}{p.level ? ` (${p.level})` : ''}</option>)}
            </select>
          </div>
          <Input label="Nom de la promotion" value={editForm.name} onChange={e => setEF('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de début" type="date" value={editForm.startDate} onChange={e => setEF('startDate', e.target.value)} />
            <Input label="Date de fin" type="date" value={editForm.endDate} onChange={e => setEF('endDate', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Lieu" value={editForm.location} onChange={e => setEF('location', e.target.value)} />
            <Input label="Formateur" value={editForm.trainerName} onChange={e => setEF('trainerName', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Capacité max" type="number" value={String(editForm.capacity)} onChange={e => setEF('capacity', e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
              <select value={editForm.status} onChange={e => setEF('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="upcoming">À venir</option>
                <option value="active">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditingPromo(null)}>Annuler</Button>
            <Button variant="primary" onClick={handleEditSubmit} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
