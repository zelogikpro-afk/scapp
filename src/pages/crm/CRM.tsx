import { useState, useMemo } from 'react'
import { Plus, Search, Filter, Phone, MessageCircle, Mail, MoreHorizontal, ChevronRight, List, Columns, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Avatar } from '../../components/ui/Avatar'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { useAppStore } from '../../store/appStore'
import { formatDate, timeAgo } from '../../lib/utils'
import type { Lead, LeadStatus } from '../../types'
import LeadDetail from './LeadDetail'
import AddLeadModal from './AddLeadModal'

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: 'info' | 'success' | 'warning' | 'danger' | 'default' | 'purple'; bg: string }> = {
  new: { label: 'Nouveau', color: 'info', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  interested: { label: 'Intéressé', color: 'success', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  callback: { label: 'Rappel', color: 'warning', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  not_interested: { label: 'Pas intéressé', color: 'danger', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  no_answer: { label: 'Pas de réponse', color: 'default', bg: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700' },
  registered: { label: 'Inscrit', color: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
}

const KANBAN_ORDER: LeadStatus[] = ['new', 'interested', 'callback', 'no_answer', 'not_interested', 'registered']

function KanbanView({ leads, onSelect }: { leads: Lead[]; onSelect: (lead: Lead) => void }) {
  const { updateLead } = useAppStore()

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
      {KANBAN_ORDER.map(status => {
        const config = STATUS_CONFIG[status]
        const statusLeads = leads.filter(l => l.status === status)
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className={`rounded-xl border p-3 h-full min-h-[400px] ${config.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={config.color} dot>{config.label}</Badge>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{statusLeads.length}</span>
              </div>
              <div className="space-y-2">
                {statusLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => onSelect(lead)}
                    className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{lead.source}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="hover:text-blue-600 transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      {lead.whatsapp && (
                        <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:text-emerald-500 transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="hover:text-blue-600 transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <span className="ml-auto text-xs text-gray-300">{timeAgo(lead.createdAt)}</span>
                    </div>
                    {lead.nextFollowUpDate && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-amber-600 dark:text-amber-400">📅 Relance: {formatDate(lead.nextFollowUpDate)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CRM() {
  const { leads, updateLead } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const sources = useMemo(() => ['all', ...Array.from(new Set(leads.map(l => l.source)))], [leads])

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = search === '' || `${l.firstName} ${l.lastName} ${l.phone} ${l.email} ${l.source}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || l.status === statusFilter
      const matchSource = sourceFilter === 'all' || l.source === sourceFilter
      return matchSearch && matchStatus && matchSource
    })
  }, [leads, search, statusFilter, sourceFilter])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">CRM — Leads</h2>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} leads au total</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>
          Nouveau lead
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {KANBAN_ORDER.map(status => {
          const config = STATUS_CONFIG[status]
          const count = leads.filter(l => l.status === status).length
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`p-3 rounded-xl border text-center transition-all ${statusFilter === status ? config.bg + ' ring-2 ring-offset-1 ring-blue-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
            >
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{config.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un lead…"
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les statuts</option>
          {KANBAN_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'Toutes les sources' : s}</option>)}
        </select>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button onClick={() => setViewMode('table')} className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('kanban')} className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <Columns className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <KanbanView leads={filtered} onSelect={setSelectedLead} />
      ) : (
        <Card padding="none">
          <Table>
            <Thead>
              <tr>
                <Th>Lead</Th>
                <Th>Contact</Th>
                <Th>Source</Th>
                <Th>Statut</Th>
                <Th>Prochain rappel</Th>
                <Th>Date</Th>
                <Th> </Th>
              </tr>
            </Thead>
            <Tbody>
              {paginated.map(lead => (
                <Tr key={lead.id} onClick={() => setSelectedLead(lead)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{lead.firstName} {lead.lastName}</p>
                        {lead.campaign && <p className="text-xs text-gray-400 truncate max-w-40">{lead.campaign}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5 text-gray-400">
                      <span className="text-xs text-gray-600 dark:text-gray-300">{lead.phone}</span>
                      {lead.whatsapp && <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {lead.email && <Mail className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </Td>
                  <Td><span className="text-xs font-medium">{lead.source}</span></Td>
                  <Td>
                    <Badge variant={STATUS_CONFIG[lead.status].color} dot>
                      {STATUS_CONFIG[lead.status].label}
                    </Badge>
                  </Td>
                  <Td>
                    {lead.nextFollowUpDate
                      ? <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{formatDate(lead.nextFollowUpDate)}</span>
                      : <span className="text-gray-300">—</span>}
                  </Td>
                  <Td><span className="text-xs text-gray-400">{timeAgo(lead.createdAt)}</span></Td>
                  <Td>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedLead(lead) }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Td>
                </Tr>
              ))}
              {paginated.length === 0 && (
                <Tr>
                  <Td className="text-center text-gray-400 py-12" colSpan={7 as any}>Aucun lead trouvé</Td>
                </Tr>
              )}
            </Tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400">{filtered.length} résultats · Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Add Lead Modal */}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
