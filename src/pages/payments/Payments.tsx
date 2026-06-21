import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Plus, Search, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Download, Trash2, Pencil, PlusCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Progress } from '../../components/ui/Progress'
import { Modal } from '../../components/ui/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import DateRangeFilter, { type Preset, type DateRange, getRange, inRange } from '../../components/ui/DateRangeFilter'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { PaymentStatus } from '../../types'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' | 'info' }> = {
  paid: { label: 'Payé', color: 'success' },
  partial: { label: 'Partiel', color: 'warning' },
  pending: { label: 'En attente', color: 'default' },
  overdue: { label: 'En retard', color: 'danger' },
  cancelled: { label: 'Annulé', color: 'info' },
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces', bank_transfer: 'Virement', card: 'Carte', check: 'Chèque', online: 'En ligne',
}

const SESSION_OPTIONS = [
  { value: '', label: '— Aucune session —' },
  { value: 'Niveau 1 — Coach de vie et Développement Personnel', label: 'Niveau 1 — Coach de vie' },
  { value: 'Niveau 2 — Master Coach Thérapeute', label: 'Niveau 2 — Master Coach Thérapeute' },
  { value: 'Niveau 3 — Master Coach Consultant', label: 'Niveau 3 — Master Coach Consultant' },
]

const EMPTY = {
  participantId: '', participantName: '',
  programType: 'coaching' as 'coaching' | 'training',
  programName: '', session: '',
  totalAmount: 0, amountPaid: 0,
  status: 'pending' as PaymentStatus,
  method: 'cash' as 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'virement',
  reference: '', date: new Date().toISOString().split('T')[0], dueDate: '', notes: '',
}

export default function Payments() {
  const { payments, participants, addPayment, updatePayment, deletePayment } = useAppStore()
  const { user } = useAuthStore()
  const isCrmManager = user?.role === 'crm_manager'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'coaching' | 'training'>('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [preset, setPreset] = useState<Preset>('all')
  const [range, setRange] = useState<DateRange>(getRange('all'))
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  // Edit
  const [editingPayment, setEditingPayment] = useState<typeof EMPTY & { id: string } | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  // Versement
  const [versementPayment, setVersementPayment] = useState<{ id: string; participantName: string; totalAmount: number; amountPaid: number; status: PaymentStatus } | null>(null)
  const [versementAmount, setVersementAmount] = useState('')
  const [versementDate, setVersementDate] = useState(new Date().toISOString().split('T')[0])
  const [versementMethod, setVersementMethod] = useState('cash')
  const [versementLoading, setVersementLoading] = useState(false)

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const handleDateChange = (p: Preset, r: DateRange) => { setPreset(p); setRange(r) }

  const filtered = useMemo(() => payments.filter(p => {
    const matchSearch = search === '' || p.participantName.toLowerCase().includes(search.toLowerCase()) || p.programName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchType   = typeFilter === 'all' || p.programType === typeFilter
    const matchMethod = methodFilter === 'all' || p.method === methodFilter
    const matchDate   = inRange(p.date, range)
    return matchSearch && matchStatus && matchType && matchMethod && matchDate
  }), [payments, search, statusFilter, typeFilter, methodFilter, range])

  const totalRevenue = payments.reduce((s, p) => s + p.amountPaid, 0)
  const totalPending = payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((s, p) => s + p.remainingAmount, 0)
  const overdueCount = payments.filter(p => p.status === 'overdue').length
  const paidCount = payments.filter(p => p.status === 'paid').length
  // Counts for crm_manager view
  const paidParticipantCount = new Set(payments.filter(p => p.status === 'paid').map(p => p.participantId)).size
  const pendingParticipantCount = new Set(payments.filter(p => p.status === 'pending' || p.status === 'partial').map(p => p.participantId)).size

  function exportPayments() {
    const ws = XLSX.utils.json_to_sheet(filtered.map(p => ({
      Participant: p.participantName, Programme: p.programName,
      Type: p.programType, 'Total (MAD)': p.totalAmount,
      'Payé (MAD)': p.amountPaid, 'Reste (MAD)': p.remainingAmount,
      Statut: p.status, Méthode: p.method, Référence: p.reference,
      Date: p.date, Échéance: p.dueDate,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Paiements')
    XLSX.writeFile(wb, `paiements-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleParticipantChange = (id: string) => {
    const p = participants.find(x => x.id === id)
    setForm(f => ({ ...f, participantId: id, participantName: p ? `${p.firstName} ${p.lastName}` : '' }))
  }

  function openEdit(pay: any) {
    setEditingPayment({
      id: pay.id,
      participantId: pay.participantId ?? '',
      participantName: pay.participantName,
      programType: pay.programType,
      programName: pay.programName,
      session: pay.session ?? '',
      totalAmount: pay.totalAmount,
      amountPaid: pay.amountPaid,
      status: pay.status,
      method: pay.method,
      reference: pay.reference ?? '',
      date: pay.date,
      dueDate: pay.dueDate ?? '',
      notes: pay.notes ?? '',
    })
  }

  const handleEditSubmit = async () => {
    if (!editingPayment) return
    setEditLoading(true)
    try {
      const newAmountPaid = Number(editingPayment.amountPaid)
      const newTotal = Number(editingPayment.totalAmount)
      const autoStatus: PaymentStatus = newAmountPaid >= newTotal ? 'paid' : newAmountPaid > 0 ? 'partial' : editingPayment.status
      await updatePayment(editingPayment.id, {
        participantName: editingPayment.participantName,
        programType: editingPayment.programType as any,
        programName: editingPayment.programName,
        session: editingPayment.session || undefined,
        totalAmount: newTotal,
        amountPaid: newAmountPaid,
        status: autoStatus,
        method: editingPayment.method as any,
        reference: editingPayment.reference || undefined,
        date: editingPayment.date,
        dueDate: editingPayment.dueDate || undefined,
        notes: editingPayment.notes || undefined,
      })
      toast.success('Paiement modifié !')
      setEditingPayment(null)
    } catch { toast.error('Erreur lors de la modification') }
    setEditLoading(false)
  }

  const handleVersementSubmit = async () => {
    if (!versementPayment) return
    const amount = parseFloat(versementAmount)
    if (!amount || amount <= 0) return toast.error('Montant invalide')
    setVersementLoading(true)
    try {
      const newAmountPaid = versementPayment.amountPaid + amount
      const newStatus: PaymentStatus = newAmountPaid >= versementPayment.totalAmount ? 'paid' : 'partial'
      await updatePayment(versementPayment.id, {
        amountPaid: newAmountPaid,
        status: newStatus,
        method: versementMethod as any,
        date: versementDate,
      })
      toast.success('Versement enregistré !')
      setVersementPayment(null)
      setVersementAmount('')
    } catch { toast.error('Erreur') }
    setVersementLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.participantName || !form.programName || !form.totalAmount) return toast.error('Champs requis manquants')
    setLoading(true)
    try {
      await addPayment({
        participantId: form.participantId ?? '',
        participantName: form.participantName,
        programType: form.programType,
        programName: form.programName,
        totalAmount: Number(form.totalAmount),
        amountPaid: Number(form.amountPaid),
        remainingAmount: Number(form.totalAmount) - Number(form.amountPaid),
        status: form.status,
        method: form.method,
        reference: form.reference || undefined,
        date: form.date,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        session: form.session || undefined,
        installments: [],
      })
      toast.success('Paiement créé !')
      setShowModal(false)
      setForm({ ...EMPTY })
    } catch { toast.error('Erreur lors de la création') }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Paiements</h2>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={exportPayments}>Exporter</Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Nouveau paiement</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{isCrmManager ? 'Personnes soldées' : 'Total encaissé'}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {isCrmManager ? `${paidParticipantCount} personnes` : formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{isCrmManager ? 'Personnes en attente' : 'En attente'}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {isCrmManager ? `${pendingParticipantCount} personnes` : formatCurrency(totalPending)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En retard</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overdueCount} paiements</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Soldés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{paidCount} paiements</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-48">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" icon={<Search className="w-4 h-4" />} />
        </div>
        <DateRangeFilter value={preset} onChange={handleDateChange} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tous les types</option>
          <option value="coaching">Coaching</option>
          <option value="training">Formation</option>
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Toutes les méthodes</option>
          <option value="cash">Espèces</option>
          <option value="bank_transfer">Virement</option>
          <option value="cheque">Chèque</option>
          <option value="card">Carte</option>
          <option value="virement">Virement (autre)</option>
        </select>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          {(['all', 'paid', 'partial', 'pending', 'overdue'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              {s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        <Table>
          <Thead>
            <tr>
              <Th>Participant</Th><Th>Programme</Th><Th>Total</Th><Th>Payé</Th>
              <Th>Reste</Th><Th>Progression</Th><Th>Méthode</Th><Th>Date</Th><Th>Statut</Th><Th> </Th>
            </tr>
          </Thead>
          <Tbody>
            {filtered.map(pay => (
              <Tr key={pay.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={pay.participantName} size="sm" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{pay.participantName}</span>
                  </div>
                </Td>
                <Td>
                  <div>
                    <p className="text-xs font-medium">{pay.programName}</p>
                    <p className="text-xs text-gray-400 capitalize">{pay.programType}</p>
                    {pay.session && <p className="text-xs text-blue-500 font-medium">{pay.session}</p>}
                  </div>
                </Td>
                <Td><span className="font-semibold">{formatCurrency(pay.totalAmount)}</span></Td>
                <Td><span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(pay.amountPaid)}</span></Td>
                <Td>
                  {pay.remainingAmount > 0
                    ? <span className={`font-medium ${pay.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>{formatCurrency(pay.remainingAmount)}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td>
                  <div className="w-24">
                    <Progress value={pay.amountPaid} max={pay.totalAmount} size="sm"
                      color={pay.status === 'paid' ? 'green' : pay.status === 'overdue' ? 'red' : 'amber'} showLabel />
                  </div>
                </Td>
                <Td><span className="text-xs">{METHOD_LABELS[pay.method] || pay.method}</span></Td>
                <Td><span className="text-xs text-gray-500">{formatDate(pay.date)}</span></Td>
                <Td><Badge variant={STATUS_CONFIG[pay.status]?.color ?? 'default'}>{STATUS_CONFIG[pay.status]?.label}</Badge></Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setVersementPayment({ id: pay.id, participantName: pay.participantName, totalAmount: pay.totalAmount, amountPaid: pay.amountPaid, status: pay.status })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Ajouter un versement">
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(pay)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={async () => { if (!confirm(`Supprimer le paiement de ${pay.participantName} ?`)) return; await deletePayment(pay.id); toast.success('Paiement supprimé') }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
            {filtered.length === 0 && (
              <Tr><Td className="text-center text-gray-400 py-12" colSpan={9 as any}>Aucun paiement trouvé</Td></Tr>
            )}
          </Tbody>
        </Table>
      </Card>

      {/* Edit Modal */}
      <Modal open={!!editingPayment} onClose={() => setEditingPayment(null)} title="Modifier le paiement" size="md">
        {editingPayment && (
          <div className="space-y-4">
            <Input label="Nom du participant" value={editingPayment.participantName} onChange={e => setEditingPayment(f => f ? { ...f, participantName: e.target.value } : f)} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de programme</label>
                <select value={editingPayment.programType} onChange={e => setEditingPayment(f => f ? { ...f, programType: e.target.value as any } : f)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="coaching">Coaching</option>
                  <option value="training">Formation</option>
                </select>
              </div>
              <Input label="Nom du programme" value={editingPayment.programName} onChange={e => setEditingPayment(f => f ? { ...f, programName: e.target.value } : f)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session / Niveau</label>
              <select value={editingPayment.session} onChange={e => setEditingPayment(f => f ? { ...f, session: e.target.value } : f)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SESSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Montant total (MAD)" type="number" value={String(editingPayment.totalAmount)} onChange={e => setEditingPayment(f => f ? { ...f, totalAmount: Number(e.target.value) } : f)} />
              <Input label="Montant payé (MAD)" type="number" value={String(editingPayment.amountPaid)} onChange={e => setEditingPayment(f => f ? { ...f, amountPaid: Number(e.target.value) } : f)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode de paiement</label>
                <select value={editingPayment.method} onChange={e => setEditingPayment(f => f ? { ...f, method: e.target.value as any } : f)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="card">Carte bancaire</option>
                  <option value="virement">Virement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                <select value={editingPayment.status} onChange={e => setEditingPayment(f => f ? { ...f, status: e.target.value as any } : f)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="pending">En attente</option>
                  <option value="partial">Partiel</option>
                  <option value="paid">Payé</option>
                  <option value="overdue">En retard</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date de paiement" type="date" value={editingPayment.date} onChange={e => setEditingPayment(f => f ? { ...f, date: e.target.value } : f)} />
              <Input label="Date d'échéance" type="date" value={editingPayment.dueDate} onChange={e => setEditingPayment(f => f ? { ...f, dueDate: e.target.value } : f)} />
            </div>
            <Input label="Référence / N° reçu" value={editingPayment.reference} onChange={e => setEditingPayment(f => f ? { ...f, reference: e.target.value } : f)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea value={editingPayment.notes} onChange={e => setEditingPayment(f => f ? { ...f, notes: e.target.value } : f)} rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditingPayment(null)}>Annuler</Button>
              <Button variant="primary" onClick={handleEditSubmit} disabled={editLoading}>{editLoading ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Versement Modal */}
      <Modal open={!!versementPayment} onClose={() => setVersementPayment(null)} title="Ajouter un versement" size="sm">
        {versementPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">{versementPayment.participantName}</p>
              <div className="flex justify-between mt-2 text-gray-500">
                <span>Déjà payé</span><span className="font-semibold text-emerald-600">{versementPayment.amountPaid.toLocaleString('fr-MA')} MAD</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Reste</span><span className="font-semibold text-amber-600">{(versementPayment.totalAmount - versementPayment.amountPaid).toLocaleString('fr-MA')} MAD</span>
              </div>
            </div>
            <Input label="Montant du versement (MAD) *" type="number" value={versementAmount}
              onChange={e => setVersementAmount(e.target.value)} placeholder="ex: 2000" autoFocus />
            <Input label="Date du versement" type="date" value={versementDate} onChange={e => setVersementDate(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode de paiement</label>
              <select value={versementMethod} onChange={e => setVersementMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="card">Carte bancaire</option>
                <option value="virement">Virement</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setVersementPayment(null)}>Annuler</Button>
              <Button variant="primary" onClick={handleVersementSubmit} disabled={versementLoading}>{versementLoading ? 'Enregistrement…' : 'Enregistrer le versement'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau paiement" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Participant</label>
            <select value={form.participantId} onChange={e => handleParticipantChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner (ou saisir ci-dessous)</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <Input label="Nom du participant *" value={form.participantName} onChange={e => setF('participantName', e.target.value)} placeholder="ex: Houda Mansouri" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de programme</label>
              <select value={form.programType} onChange={e => setF('programType', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="coaching">Coaching</option>
                <option value="training">Formation</option>
              </select>
            </div>
            <Input label="Nom du programme *" value={form.programName} onChange={e => setF('programName', e.target.value)} placeholder="ex: Pack Leadership 10 séances" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session / Niveau</label>
            <select value={form.session} onChange={e => setF('session', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SESSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Montant total (MAD) *" type="number" value={String(form.totalAmount)} onChange={e => setF('totalAmount', e.target.value)} />
            <Input label="Acompte versé (MAD)" type="number" value={String(form.amountPaid)} onChange={e => setF('amountPaid', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode de paiement</label>
              <select value={form.method} onChange={e => setF('method', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="card">Carte bancaire</option>
                <option value="virement">Virement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
              <select value={form.status} onChange={e => setF('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pending">En attente</option>
                <option value="partial">Partiel</option>
                <option value="paid">Payé</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de paiement" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            <Input label="Date d'échéance" type="date" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} />
          </div>
          <Input label="Référence / N° reçu" value={form.reference} onChange={e => setF('reference', e.target.value)} placeholder="ex: REC-2026-001" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Création…' : 'Créer le paiement'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
