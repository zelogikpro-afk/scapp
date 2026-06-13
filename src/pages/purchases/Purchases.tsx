import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, ShoppingCart, CheckCircle, Clock, Package, FileText, XCircle, Pause, Trash2, Edit2, X, Save } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export type Purchase = {
  id: string
  reference: string
  request_date: string | null
  requester: string
  description: string
  category: string
  activity: string
  quantity: number
  urgency: 'low' | 'normal' | 'urgent'
  status: 'requested' | 'approved' | 'in_progress' | 'purchased' | 'invoiced' | 'refused'
  approved_by: string
  validation_comment: string
  handled_by: string
  supplier: string
  purchase_date: string | null
  unit_price: number
  total_price: number
  payment_method: string
  invoice_possible: boolean
  invoice_received: boolean
  invoice_number: string
  notes: string
  created_at: string
}

const STATUS_CONFIG = {
  requested:   { label: 'Demandé',       color: 'default' as const, icon: Clock },
  approved:    { label: 'Validé',         color: 'success' as const, icon: CheckCircle },
  in_progress: { label: "En cours d'achat", color: 'info' as const, icon: ShoppingCart },
  purchased:   { label: 'Acheté',         color: 'purple' as const, icon: Package },
  invoiced:    { label: 'Facturé',        color: 'warning' as const, icon: FileText },
  refused:     { label: 'Refusé',         color: 'danger' as const, icon: XCircle },
}

const URGENCY_CONFIG = {
  low:    { label: 'Faible',   dot: 'bg-emerald-400' },
  normal: { label: 'Normale',  dot: 'bg-amber-400' },
  urgent: { label: 'Urgente',  dot: 'bg-red-500' },
}

const CATEGORIES = ['Matériel', 'Formation', 'Logiciels', 'Consommables', 'Marketing', 'Loyer', 'Salaires', 'Prestataires', 'Transport', 'Restauration', 'Autre']
const TEAM = ['Sofya', 'Zineb', 'Hind', 'Oumnia', 'Khalil']

const EMPTY: Omit<Purchase, 'id' | 'created_at' | 'reference'> = {
  request_date: new Date().toISOString().split('T')[0],
  requester: '',
  description: '',
  category: 'Matériel',
  activity: '',
  quantity: 1,
  urgency: 'normal',
  status: 'requested',
  approved_by: '',
  validation_comment: '',
  handled_by: '',
  supplier: '',
  purchase_date: null,
  unit_price: 0,
  total_price: 0,
  payment_method: '',
  invoice_possible: false,
  invoice_received: false,
  invoice_number: '',
  notes: '',
}

function formatMAD(n: number) {
  return n.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 })
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PurchaseForm({ initial, onSave, onClose }: {
  initial: Partial<Purchase>
  onSave: (data: any) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !form.requester) { toast.error('Description et demandeur requis'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Demandeur *</label>
          <select value={form.requester} onChange={e => set('requester', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="">— Choisir —</option>
            {TEAM.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date demande</label>
          <input type="date" value={form.request_date || ''} onChange={e => set('request_date', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description du besoin *</label>
        <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ex: Imprimante laser couleur A4" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Catégorie</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Activité</label>
          <input type="text" value={form.activity} onChange={e => set('activity', e.target.value)} placeholder="Ex: Administratif" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Urgence</label>
          <select value={form.urgency} onChange={e => set('urgency', e.target.value as any)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <option value="low">🟢 Faible</option>
            <option value="normal">🟡 Normale</option>
            <option value="urgent">🔴 Urgente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
          <select value={form.status} onChange={e => set('status', e.target.value as any)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Validé / Refusé par</label>
          <select value={form.approved_by} onChange={e => set('approved_by', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <option value="">—</option>
            {TEAM.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Commentaire validation</label>
        <input type="text" value={form.validation_comment} onChange={e => set('validation_comment', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Détails achat</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pris en charge par</label>
            <select value={form.handled_by} onChange={e => set('handled_by', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="">—</option>
              {TEAM.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label>
            <input type="text" value={form.supplier} onChange={e => set('supplier', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date achat</label>
            <input type="date" value={form.purchase_date || ''} onChange={e => set('purchase_date', e.target.value || null)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité</label>
            <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix unitaire (MAD)</label>
            <input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => { const v = parseFloat(e.target.value)||0; set('unit_price', v); set('total_price', v * form.quantity) }} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix total (MAD)</label>
            <input type="number" min="0" step="0.01" value={form.total_price} onChange={e => set('total_price', parseFloat(e.target.value)||0)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mode paiement</label>
            <input type="text" value={form.payment_method} onChange={e => set('payment_method', e.target.value)} placeholder="Ex: Virement, Espèces" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° Facture</label>
            <input type="text" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
        </div>
        <div className="flex gap-6 mt-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.invoice_possible} onChange={e => set('invoice_possible', e.target.checked)} className="rounded" />
            <span className="text-gray-700 dark:text-gray-300">Facture possible</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.invoice_received} onChange={e => set('invoice_received', e.target.checked)} className="rounded" />
            <span className="text-gray-700 dark:text-gray-300">Facture reçue</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none" />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
        <Button type="submit" variant="primary" loading={saving} icon={<Save className="w-4 h-4" />}>Enregistrer</Button>
      </div>
    </form>
  )
}

export default function Purchases() {
  const { user } = useAuthStore()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPurchases = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('purchases').select('*').order('request_date', { ascending: false })
    if (!error && data) setPurchases(data as Purchase[])
    setLoading(false)
  }

  useEffect(() => { fetchPurchases() }, [])

  const filtered = useMemo(() => purchases.filter(p => {
    const matchSearch = !search || `${p.description} ${p.requester} ${p.supplier} ${p.category} ${p.reference}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchStatus && matchCat
  }), [purchases, search, statusFilter, categoryFilter])

  const stats = useMemo(() => {
    const demanded = purchases.filter(p => p.status === 'requested').length
    const inProgress = purchases.filter(p => p.status === 'in_progress').length
    const thisMonth = purchases.filter(p => {
      if (!p.purchase_date) return false
      const d = new Date(p.purchase_date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const spent = purchases.filter(p => ['purchased','invoiced'].includes(p.status)).reduce((s, p) => s + (p.total_price || 0), 0)
    const missingInvoices = purchases.filter(p => p.status === 'invoiced' && !p.invoice_received).length
    return { demanded, inProgress, thisMonth: thisMonth.length, spent, missingInvoices }
  }, [purchases])

  const handleSave = async (data: any) => {
    const payload = {
      requester: data.requester,
      description: data.description,
      category: data.category,
      activity: data.activity,
      quantity: data.quantity,
      urgency: data.urgency,
      status: data.status,
      approved_by: data.approved_by,
      validation_comment: data.validation_comment,
      handled_by: data.handled_by,
      supplier: data.supplier,
      purchase_date: data.purchase_date || null,
      request_date: data.request_date || null,
      unit_price: data.unit_price,
      total_price: data.total_price,
      payment_method: data.payment_method,
      invoice_possible: data.invoice_possible,
      invoice_received: data.invoice_received,
      invoice_number: data.invoice_number,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    }

    if (editing) {
      const { error } = await supabase.from('purchases').update(payload).eq('id', editing.id)
      if (error) { toast.error('Erreur lors de la mise à jour'); return }
      toast.success('Achat mis à jour')
      setEditing(null)
    } else {
      const { error } = await supabase.from('purchases').insert({ ...payload })
      if (error) { toast.error('Erreur lors de la création'); return }
      toast.success('Achat créé')
      setShowAdd(false)
    }
    fetchPurchases()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet achat ?')) return
    setDeleting(id)
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    if (error) toast.error('Erreur suppression')
    else { toast.success('Achat supprimé'); fetchPurchases() }
    setDeleting(null)
  }

  const categories = useMemo(() => [...new Set(purchases.map(p => p.category).filter(Boolean))], [purchases])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Achats & Dépenses</h2>
          <p className="text-sm text-gray-500 mt-0.5">{purchases.length} achat{purchases.length > 1 ? 's' : ''} au total</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>
          Nouvelle demande
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'En attente', value: stats.demanded, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: "En cours d'achat", value: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Achats ce mois', value: stats.thisMonth, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Total dépensé', value: formatMAD(stats.spent), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Factures manquantes', value: stats.missingInvoices, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" icon={<Search className="w-4 h-4" />} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="all">Toutes catégories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <tr>
              <Th>Réf.</Th>
              <Th>Description</Th>
              <Th>Demandeur</Th>
              <Th>Catégorie</Th>
              <Th>Urgence</Th>
              <Th>Statut</Th>
              <Th>Fournisseur</Th>
              <Th>Montant</Th>
              <Th>Facture</Th>
              <Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr><Td className="text-center text-gray-400 py-12" colSpan={10 as any}>Chargement…</Td></Tr>
            ) : filtered.length === 0 ? (
              <Tr><Td className="text-center text-gray-400 py-12" colSpan={10 as any}>Aucun achat trouvé</Td></Tr>
            ) : filtered.map(p => {
              const sc = STATUS_CONFIG[p.status]
              const uc = URGENCY_CONFIG[p.urgency]
              const Icon = sc.icon
              return (
                <Tr key={p.id}>
                  <Td><span className="font-mono text-xs text-gray-500">{p.reference || '—'}</span></Td>
                  <Td>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-48 truncate">{p.description}</p>
                      {p.notes && <p className="text-xs text-gray-400 max-w-48 truncate">{p.notes}</p>}
                    </div>
                  </Td>
                  <Td><span className="text-sm">{p.requester}</span></Td>
                  <Td><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{p.category}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${uc.dot}`} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{uc.label}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <Badge variant={sc.color}>{sc.label}</Badge>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-gray-600 dark:text-gray-400">{p.supplier || '—'}</span></Td>
                  <Td>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.total_price ? formatMAD(p.total_price) : '—'}
                    </span>
                  </Td>
                  <Td>
                    <div className="text-xs space-y-0.5">
                      {p.invoice_possible ? (
                        p.invoice_received
                          ? <span className="text-emerald-600 font-medium">Reçue ✓</span>
                          : <span className="text-amber-600">En attente</span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Card>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Nouvelle demande d'achat" onClose={() => setShowAdd(false)} size="lg">
          <PurchaseForm initial={{}} onSave={handleSave} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal title={`Modifier — ${editing.reference || editing.description}`} onClose={() => setEditing(null)} size="lg">
          <PurchaseForm initial={editing} onSave={handleSave} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
