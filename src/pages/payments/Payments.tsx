import { useState, useMemo } from 'react'
import { Plus, Search, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Download } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Progress } from '../../components/ui/Progress'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { useAppStore } from '../../store/appStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { PaymentStatus } from '../../types'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' | 'info' }> = {
  paid: { label: 'Payé', color: 'success' },
  partial: { label: 'Partiel', color: 'warning' },
  pending: { label: 'En attente', color: 'default' },
  overdue: { label: 'En retard', color: 'danger' },
  cancelled: { label: 'Annulé', color: 'info' },
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces', bank_transfer: 'Virement', card: 'Carte', cheque: 'Chèque', virement: 'Virement',
}

export default function Payments() {
  const { payments } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')

  const filtered = useMemo(() => payments.filter(p => {
    const matchSearch = search === '' || p.participantName.toLowerCase().includes(search.toLowerCase()) || p.programName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  }), [payments, search, statusFilter])

  const totalRevenue = payments.reduce((s, p) => s + p.amountPaid, 0)
  const totalPending = payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((s, p) => s + p.remainingAmount, 0)
  const overdueCount = payments.filter(p => p.status === 'overdue').length
  const paidCount = payments.filter(p => p.status === 'paid').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Paiements</h2>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>Exporter</Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Nouveau paiement</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total encaissé</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalPending)}</p>
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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" icon={<Search className="w-4 h-4" />} />
        </div>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          {(['all', 'paid', 'partial', 'pending', 'overdue'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <tr>
              <Th>Participant</Th>
              <Th>Programme</Th>
              <Th>Montant total</Th>
              <Th>Payé</Th>
              <Th>Reste</Th>
              <Th>Progression</Th>
              <Th>Méthode</Th>
              <Th>Date</Th>
              <Th>Statut</Th>
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
                  </div>
                </Td>
                <Td><span className="font-semibold">{formatCurrency(pay.totalAmount)}</span></Td>
                <Td><span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(pay.amountPaid)}</span></Td>
                <Td>
                  {pay.remainingAmount > 0
                    ? <span className={`font-medium ${pay.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{formatCurrency(pay.remainingAmount)}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td>
                  <div className="w-24">
                    <Progress
                      value={pay.amountPaid}
                      max={pay.totalAmount}
                      size="sm"
                      color={pay.status === 'paid' ? 'green' : pay.status === 'overdue' ? 'red' : 'amber'}
                      showLabel
                    />
                  </div>
                </Td>
                <Td><span className="text-xs">{METHOD_LABELS[pay.method] || pay.method}</span></Td>
                <Td><span className="text-xs text-gray-500">{formatDate(pay.date)}</span></Td>
                <Td>
                  <Badge variant={STATUS_CONFIG[pay.status].color}>
                    {STATUS_CONFIG[pay.status].label}
                  </Badge>
                </Td>
              </Tr>
            ))}
            {filtered.length === 0 && (
              <Tr><Td className="text-center text-gray-400 py-12" colSpan={9 as any}>Aucun paiement trouvé</Td></Tr>
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  )
}
