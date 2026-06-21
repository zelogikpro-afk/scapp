import { useState, useMemo } from 'react'
import { BookOpen, Plus, Trash2, Pencil, Search } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const PACK_STATUS = {
  active: { label: 'Actif', color: 'success' as const },
  completed: { label: 'Terminé', color: 'info' as const },
  expired: { label: 'Expiré', color: 'danger' as const },
  paused: { label: 'Pausé', color: 'warning' as const },
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const EMPTY = {
  participantId: '', name: '', totalSessions: 10, usedSessions: 0, price: 0,
  discount: 0, amountPaid: 0, purchaseDate: new Date().toISOString().split('T')[0],
  expirationDate: '', status: 'active' as const,
  slotDay: '', slotTime: '10:00',
}

export default function CoachingPacks() {
  const { coachingPacks, participants, coachingSessions, addCoachingPack, updateCoachingPack, deleteCoachingPack } = useAppStore()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [participantFilter, setParticipantFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const filteredPacks = useMemo(() => coachingPacks.filter(pack => {
    const participant = participants.find(p => p.id === pack.participantId)
    const matchSearch = !search || pack.name.toLowerCase().includes(search.toLowerCase()) || (participant ? `${participant.firstName} ${participant.lastName}`.toLowerCase().includes(search.toLowerCase()) : false)
    const matchStatus = statusFilter === 'all' || pack.status === statusFilter
    const matchPart   = participantFilter === 'all' || pack.participantId === participantFilter
    return matchSearch && matchStatus && matchPart
  }), [coachingPacks, search, statusFilter, participantFilter, participants])

  function openEdit(pack: typeof coachingPacks[0]) {
    setEditId(pack.id)
    const [day, time] = (pack.weeklySlot || '').split(' ')
    setForm({ participantId: pack.participantId, name: pack.name, totalSessions: pack.totalSessions, usedSessions: pack.usedSessions, price: pack.price, discount: pack.discount ?? 0, amountPaid: pack.amountPaid, purchaseDate: pack.purchaseDate, expirationDate: pack.expirationDate || '', status: pack.status as any, slotDay: day || '', slotTime: time || '10:00' })
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce pack ?')) return
    await deleteCoachingPack(id)
    toast.success('Pack supprimé')
  }

  const handleSubmit = async () => {
    if (!form.participantId || !form.name) return toast.error('Participant et nom requis')
    setLoading(true)
    try {
      const weeklySlot = form.slotDay ? `${form.slotDay} ${form.slotTime}` : undefined
      if (editId) {
        await updateCoachingPack(editId, { name: form.name, weeklySlot, totalSessions: Number(form.totalSessions), usedSessions: Number(form.usedSessions), price: Number(form.price), discount: Number(form.discount), amountPaid: Number(form.amountPaid), purchaseDate: form.purchaseDate, expirationDate: form.expirationDate || undefined, status: form.status as any })
        toast.success('Pack modifié !')
      } else {
        await addCoachingPack({ participantId: form.participantId, name: form.name, weeklySlot, totalSessions: Number(form.totalSessions), usedSessions: Number(form.usedSessions), price: Number(form.price), discount: Number(form.discount), amountPaid: Number(form.amountPaid), purchaseDate: form.purchaseDate, expirationDate: form.expirationDate || undefined, status: form.status as any, coachId: user?.id ?? '' })
        toast.success('Pack créé !')
      }
      setShowModal(false)
      setEditId(null)
      setForm({ ...EMPTY })
    } catch (err: any) { toast.error(err?.message || 'Erreur lors de la sauvegarde') }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Packs de Coaching</h2>
          <p className="text-sm text-gray-500">{coachingPacks.filter(p => p.status === 'active').length} packs actifs</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); setShowModal(true) }}>Nouveau pack</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['active', 'completed', 'paused', 'expired'] as const).map(status => (
          <button key={status} onClick={() => setStatusFilter(s => s === status ? 'all' : status)}
            className={`p-4 rounded-xl border text-left transition-all bg-white dark:bg-gray-900 ${statusFilter === status ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}>
            <p className="text-xs text-gray-500">{PACK_STATUS[status].label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {coachingPacks.filter(p => p.status === status).length}
            </p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-48">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un pack ou participant…" icon={<Search className="w-4 h-4" />} />
        </div>
        <select value={participantFilter} onChange={e => setParticipantFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tous les participants</option>
          {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPacks.map(pack => {
          const participant = participants.find(p => p.id === pack.participantId)
          const remaining = pack.totalSessions - pack.usedSessions
          const netPrice = pack.price - (pack.discount ?? 0)
          const remainingBalance = netPrice - pack.amountPaid

          return (
            <Card key={pack.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {participant && <Avatar name={`${participant.firstName} ${participant.lastName}`} size="sm" />}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {participant ? `${participant.firstName} ${participant.lastName}` : 'Inconnu'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{pack.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={PACK_STATUS[pack.status].color}>{PACK_STATUS[pack.status].label}</Badge>
                  <button onClick={() => openEdit(pack)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(pack.id)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{pack.usedSessions} séances réalisées</span>
                  <span className="font-medium text-blue-600">{remaining} restantes</span>
                </div>
                <Progress value={pack.usedSessions} max={pack.totalSessions} color="blue" showLabel />
                {pack.weeklySlot && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <span>🗓</span>{pack.weeklySlot} · 50 min
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 dark:border-gray-800">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Prix</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(netPrice)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Payé</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(pack.amountPaid)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Reste</p>
                  <p className={`text-sm font-semibold ${remainingBalance > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {formatCurrency(Math.max(0, remainingBalance))}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                <span>Acheté le {formatDate(pack.purchaseDate)}</span>
                {pack.expirationDate && <span>Exp: {formatDate(pack.expirationDate)}</span>}
              </div>
            </Card>
          )
        })}
        {coachingPacks.length === 0 && (
          <Card className="col-span-3 text-center py-12">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucun pack de coaching</p>
          </Card>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditId(null) }} title={editId ? 'Modifier le pack' : 'Nouveau pack de coaching'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participant *</label>
            <select value={form.participantId} onChange={e => set('participantId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un participant</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <Input label="Nom du pack *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Pack Coaching Exécutif 10 séances" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nb de séances total" type="number" value={form.totalSessions} onChange={e => set('totalSessions', e.target.value)} />
            <Input label="Séances réalisées" type="number" min={0} value={form.usedSessions} onChange={e => set('usedSessions', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Créneau fixe hebdomadaire <span className="text-gray-400 font-normal">(50 min, 1×/semaine)</span></label>
            <div className="flex gap-2">
              <select value={form.slotDay} onChange={e => set('slotDay', e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Aucun créneau —</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="time" value={form.slotTime} onChange={e => set('slotTime', e.target.value)}
                disabled={!form.slotDay}
                className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Prix (MAD)" type="number" value={form.price} onChange={e => set('price', e.target.value)} />
            <Input label="Remise (MAD)" type="number" value={form.discount} onChange={e => set('discount', e.target.value)} />
            <Input label="Acompte versé (MAD)" type="number" value={form.amountPaid} onChange={e => set('amountPaid', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date d'achat" type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
            <Input label="Date d'expiration" type="date" value={form.expirationDate} onChange={e => set('expirationDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Actif</option>
              <option value="paused">Pausé</option>
              <option value="completed">Terminé</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditId(null) }}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Créer le pack'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
