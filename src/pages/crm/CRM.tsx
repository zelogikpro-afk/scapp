import React, { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Upload, List, Columns, Eye, Phone, MessageCircle, Mail, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import DateRangeFilter, { type Preset, type DateRange, getRange, inRange } from '../../components/ui/DateRangeFilter'
import { PageHero, HeroBtn } from '../../components/ui/PageHero'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { formatDate, timeAgo } from '../../lib/utils'
import type { Lead, LeadStatus } from '../../types'
import LeadDetail from './LeadDetail'
import AddLeadModal from './AddLeadModal'
import ImportLeadsModal from './ImportLeadsModal'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: 'info' | 'success' | 'warning' | 'danger' | 'default' | 'purple'; bg: string }> = {
  new:            { label: 'Nouveau lead',       color: 'info',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  to_contact:     { label: 'À contacter',        color: 'info',    bg: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' },
  contacted:      { label: 'Contacté',           color: 'warning', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  no_answer:      { label: 'Injoignable',        color: 'default', bg: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700' },
  callback:       { label: 'En réflexion',       color: 'warning', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
  interested:     { label: 'Intéressé',          color: 'success', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  appointment:    { label: 'RDV fixé',           color: 'purple',  bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
  pending_payment:{ label: 'Paiement en attente',color: 'warning', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
  registered:     { label: 'Inscrit',            color: 'purple',  bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
  not_interested: { label: 'Refus',              color: 'danger',  bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
}

const KANBAN_ORDER: LeadStatus[] = ['new', 'to_contact', 'contacted', 'no_answer', 'callback', 'interested', 'appointment', 'pending_payment', 'registered', 'not_interested']

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
  const { leads, profiles, updateLead, fetchLeads, fetchProfiles } = useAppStore()
  useEffect(() => { if (profiles.length === 0) fetchProfiles() }, [])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [preset, setPreset] = useState<Preset>('all')
  const [range, setRange] = useState<DateRange>(getRange('all'))
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [page, setPage] = useState(1)
  const [programFilter, setProgramFilter] = useState<'all' | 'coaching_adulte' | 'classes_avenir'>('all')
  const [delaiFilter, setDelaiFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [sortKey, setSortKey] = useState<'name' | 'source' | 'status' | 'date' | 'followup' | 'delai'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function SortIcon({ k }: { k: typeof sortKey }) {
    if (sortKey !== k) return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 text-gray-300 inline" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-500 inline" />
      : <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-500 inline" />
  }

  const handleDateChange = (p: Preset, r: DateRange) => { setPreset(p); setRange(r); setPage(1) }

  async function syncMeta() {
    setSyncing(true)
    try {
      const res = await fetch('/api/meta-sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(`${data.imported} leads importés depuis Meta !`)
        fetchLeads()
      }
    } catch {
      toast.error('Erreur de connexion à Meta')
    }
    setSyncing(false)
  }
  const PER_PAGE = 15

  const sources = useMemo(() => ['all', ...Array.from(new Set(leads.map(l => l.source)))], [leads])

  const DELAI_ORDER = { high: 0, medium: 1, low: 2, '': 3 }

  const filtered = useMemo(() => {
    const STATUS_ORDER: LeadStatus[] = ['new','to_contact','contacted','no_answer','callback','interested','appointment','pending_payment','registered','not_interested']
    const base = leads.filter(l => {
      const matchSearch = search === '' || `${l.firstName} ${l.lastName} ${l.phone} ${l.email} ${l.source}`.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || l.status === statusFilter
      const matchSource = sourceFilter === 'all' || l.source === sourceFilter
      const matchDate   = inRange(l.createdAt, range)
      const matchDelai  = delaiFilter === 'all' || l.interestLevel === delaiFilter
      const matchAgent  = agentFilter === 'all' || l.assignedTo === agentFilter || (agentFilter === '__unassigned__' && !l.assignedTo)
      const matchProgram = programFilter === 'all' || l.programTag === programFilter || (programFilter === 'coaching_adulte' && !l.programTag)
      return matchSearch && matchStatus && matchSource && matchDate && matchDelai && matchAgent && matchProgram
    })
    return [...base].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name')    cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'fr', { sensitivity: 'base' })
      if (sortKey === 'source')  cmp = (a.source || '').localeCompare(b.source || '', 'fr', { sensitivity: 'base' })
      if (sortKey === 'status')  cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      if (sortKey === 'date')    cmp = (a.createdAt || '') < (b.createdAt || '') ? -1 : 1
      if (sortKey === 'followup') cmp = (a.nextFollowUpDate || '9999') < (b.nextFollowUpDate || '9999') ? -1 : 1
      if (sortKey === 'delai')   cmp = (DELAI_ORDER[a.interestLevel || ''] ?? 3) - (DELAI_ORDER[b.interestLevel || ''] ?? 3)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [leads, search, statusFilter, sourceFilter, range, delaiFilter, agentFilter, sortKey, sortDir])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHero
        emoji="👥"
        title="CRM — Leads"
        sub={`${leads.length} leads au total · ${filtered.length} filtrés`}
        gradient="linear-gradient(135deg, #0A1628 0%, #1A73E8 60%, #4F94F0 100%)"
        actions={<>
          {!isMobile && <HeroBtn outlined onClick={syncMeta}>{syncing ? '⟳ Sync…' : '⟳ Sync Meta'}</HeroBtn>}
          {!isMobile && <HeroBtn outlined onClick={() => setShowImport(true)}>↑ Importer</HeroBtn>}
          <HeroBtn onClick={() => setShowAdd(true)}>+ Nouveau lead</HeroBtn>
        </>}
        stats={[
          { label: 'Inscrits', value: leads.filter(l => l.status === 'registered').length },
          { label: 'Intéressés', value: leads.filter(l => l.status === 'interested').length },
          { label: 'Relances', value: leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate <= new Date().toISOString().slice(0,10)).length },
        ]}
      />

      {/* Status Summary */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {KANBAN_ORDER.map(status => {
          const config = STATUS_CONFIG[status]
          const count = leads.filter(l => l.status === status).length
          const isActive = statusFilter === status
          const PILL_COLORS: Record<string, { bg: string; text: string; activeBg: string }> = {
            new: { bg: '#EFF6FF', text: '#1A73E8', activeBg: '#1A73E8' },
            to_contact: { bg: '#F0F9FF', text: '#0284C7', activeBg: '#0284C7' },
            contacted: { bg: '#FFFBEB', text: '#D97706', activeBg: '#D97706' },
            no_answer: { bg: '#F8FAFC', text: '#64748B', activeBg: '#64748B' },
            callback: { bg: '#FFF7ED', text: '#EA580C', activeBg: '#EA580C' },
            interested: { bg: '#F0FDF4', text: '#16A34A', activeBg: '#16A34A' },
            appointment: { bg: '#F5F3FF', text: '#7C3AED', activeBg: '#7C3AED' },
            pending_payment: { bg: '#FEFCE8', text: '#CA8A04', activeBg: '#CA8A04' },
            registered: { bg: '#FAF5FF', text: '#9333EA', activeBg: '#9333EA' },
            not_interested: { bg: '#FEF2F2', text: '#DC2626', activeBg: '#DC2626' },
          }
          const c = PILL_COLORS[status] || { bg: '#F8FAFC', text: '#64748B', activeBg: '#64748B' }
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                borderRadius: 99,
                border: isActive ? 'none' : `1.5px solid ${c.bg === '#F8FAFC' ? '#E2ECF8' : c.bg}`,
                background: isActive ? c.activeBg : c.bg,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? '#fff' : c.text, lineHeight: 1 }}>{count}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.85)' : c.text, whiteSpace: 'nowrap' }}>{config.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filters Grid */}
      <div style={{ background: '#F8FAFF', borderRadius: 18, border: '1px solid #E2ECF8', padding: '14px 16px' }}>
        {/* Row 1: Search + Date + View toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher un lead…"
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <DateRangeFilter value={preset} onChange={handleDateChange} />
          <div style={{ display: 'flex', borderRadius: 10, border: '1.5px solid #E2ECF8', overflow: 'hidden', flexShrink: 0 }}>
            <button onClick={() => setViewMode('table')} style={{ padding: '8px 10px', background: viewMode === 'table' ? '#1A73E8' : '#fff', color: viewMode === 'table' ? '#fff' : '#6B88A8', border: 'none', cursor: 'pointer' }}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('kanban')} style={{ padding: '8px 10px', background: viewMode === 'kanban' ? '#1A73E8' : '#fff', color: viewMode === 'kanban' ? '#fff' : '#6B88A8', border: 'none', cursor: 'pointer' }}>
              <Columns className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Row 2: 3-column select grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {([
            { value: statusFilter, onChange: (v: string) => { setStatusFilter(v as any); setPage(1) }, children: (
              <>
                <option value="all">Tous les statuts</option>
                {KANBAN_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </>
            )},
            { value: sourceFilter, onChange: (v: string) => { setSourceFilter(v); setPage(1) }, children: (
              <>{sources.map(s => <option key={s} value={s}>{s === 'all' ? 'Toutes les sources' : s}</option>)}</>
            )},
            { value: delaiFilter, onChange: (v: string) => { setDelaiFilter(v as any); setPage(1) }, children: (
              <>
                <option value="all">Tous les délais</option>
                <option value="high">🔴 Urgent</option>
                <option value="medium">🟠 Moyen terme</option>
                <option value="low">🟢 Plus tard</option>
              </>
            )},
            { value: programFilter, onChange: (v: string) => { setProgramFilter(v as any); setPage(1) }, children: (
              <>
                <option value="all">Toutes les formations</option>
                <option value="coaching_adulte">🎓 Coach de Vie</option>
                <option value="classes_avenir">🏫 Classes de l'Avenir</option>
              </>
            )},
            { value: agentFilter, onChange: (v: string) => { setAgentFilter(v); setPage(1) }, children: (
              <>
                <option value="all">Tous les agents</option>
                <option value="__unassigned__">— Non assignés</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </>
            )},
          ] as { value: string; onChange: (v: string) => void; children: React.ReactNode }[]).map((sel, i) => (
            <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
              style={{ fontSize: 13, fontWeight: 600, color: '#0A1628', border: '1.5px solid #E2ECF8', borderRadius: 10, padding: '8px 12px', background: '#fff', outline: 'none', width: '100%' }}>
              {sel.children}
            </select>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <KanbanView leads={filtered} onSelect={setSelectedLead} />
      ) : (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2ECF8', boxShadow: '0 2px 12px rgba(26,115,232,0.06)', overflow: 'hidden' }}>
          {/* List */}
          {paginated.map((lead, i) => {
            const sc = STATUS_CONFIG[lead.status]
            const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
              info:    { bg: '#EFF6FF', color: '#1A73E8' },
              success: { bg: '#F0FDF4', color: '#16A34A' },
              warning: { bg: '#FFF7ED', color: '#EA580C' },
              danger:  { bg: '#FEF2F2', color: '#DC2626' },
              default: { bg: '#F8FAFC', color: '#64748B' },
              purple:  { bg: '#FAF5FF', color: '#9333EA' },
            }
            const bs = BADGE_STYLES[sc.color] || BADGE_STYLES.default
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < paginated.length - 1 ? '1px solid #F0F7FF' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFCFF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar name={`${lead.firstName} ${lead.lastName}`} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: '#6B88A8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.source}{lead.campaign ? ` · ${lead.campaign}` : ''}
                  </p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    {lead.nextFollowUpDate ? ` · 📅 ${lead.nextFollowUpDate}` : ''}
                  </p>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                    style={{ width: 32, height: 32, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A73E8', textDecoration: 'none' }}>
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  {lead.whatsapp && (
                    <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      style={{ width: 32, height: 32, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', textDecoration: 'none' }}>
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()}
                      style={{ width: 32, height: 32, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', textDecoration: 'none' }}>
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {/* Status badge */}
                <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: bs.bg, color: bs.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {sc.label}
                </span>
              </div>
            )
          })}
          {paginated.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 16px', color: '#94A3B8', fontSize: 14 }}>Aucun lead trouvé</div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#F0F7FF]">
              <span className="text-xs text-[#6B88A8]">{filtered.length} résultats · Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Add Lead Modal */}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} />}

      {/* Import Leads Modal */}
      {showImport && <ImportLeadsModal onClose={() => setShowImport(false)} />}
    </div>
  )
}
