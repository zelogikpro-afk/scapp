import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Phone, Mail } from 'lucide-react'
import DateRangeFilter, { type Preset, type DateRange, getRange, inRange } from '../../components/ui/DateRangeFilter'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { PageHero, HeroBtn } from '../../components/ui/PageHero'
import { useAppStore } from '../../store/appStore'
import { formatDate } from '../../lib/utils'
import type { Participant } from '../../types'
import ParticipantDetail from './ParticipantDetail'
import AddParticipantModal from './AddParticipantModal'

const TYPE_CONFIG = {
  coaching: { label: 'Coaching', color: 'info' as const },
  training: { label: 'Formation', color: 'purple' as const },
  both: { label: 'Coaching & Formation', color: 'success' as const },
}

export default function Participants() {
  const { participants, coachingPacks } = useAppStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'coaching' | 'training' | 'both'>('all')
  const [paymentModeFilter, setPaymentModeFilter] = useState('all')
  const [participationModeFilter, setParticipationModeFilter] = useState('all')
  const [preset, setPreset] = useState<Preset>('all')
  const [range, setRange] = useState<DateRange>(getRange('all'))
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const handleDateChange = (p: Preset, r: DateRange) => { setPreset(p); setRange(r) }

  const filtered = useMemo(() => participants.filter(p => {
    const matchSearch = search === '' || `${p.firstName} ${p.lastName} ${p.email} ${p.phone} ${p.profession}`.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || p.type === typeFilter
    const matchPayMode = paymentModeFilter === 'all' || (p as any).paymentMode === paymentModeFilter
    const matchPartMode = participationModeFilter === 'all' || (p as any).participationMode === participationModeFilter
    const matchDate = inRange(p.createdAt, range)
    return matchSearch && matchType && matchPayMode && matchPartMode && matchDate && p.isActive
  }), [participants, search, typeFilter, paymentModeFilter, participationModeFilter, range])

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHero
        emoji="🎓"
        title="Participants"
        sub={`${participants.filter(p => p.isActive).length} participants actifs`}
        gradient="linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)"
        actions={<HeroBtn onClick={() => setShowAdd(true)}>+ Nouveau participant</HeroBtn>}
        stats={[
          { label: 'Coaching', value: participants.filter(p => p.type === 'coaching' && p.isActive).length },
          { label: 'Formation', value: participants.filter(p => p.type === 'training' && p.isActive).length },
          { label: 'Les deux', value: participants.filter(p => p.type === 'both' && p.isActive).length },
        ]}
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { type: 'all' as const, label: 'Tous', count: participants.filter(p => p.isActive).length, bg: '#EFF6FF', color: '#1A73E8' },
          { type: 'coaching' as const, label: 'Coaching', count: participants.filter(p => p.type === 'coaching' && p.isActive).length, bg: '#F0FDF4', color: '#16A34A' },
          { type: 'training' as const, label: 'Formation', count: participants.filter(p => p.type === 'training' && p.isActive).length, bg: '#F5F3FF', color: '#7C3AED' },
          { type: 'both' as const, label: 'Coaching & Formation', count: participants.filter(p => p.type === 'both' && p.isActive).length, bg: '#FFF7ED', color: '#EA580C' },
        ].map(item => {
          const isActive = typeFilter === item.type
          return (
            <button
              key={item.type}
              onClick={() => setTypeFilter(item.type === 'all' ? 'all' : (typeFilter === item.type ? 'all' : item.type))}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 99,
                border: isActive ? 'none' : `1.5px solid ${item.bg}`,
                background: isActive ? item.color : item.bg,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? '#fff' : item.color }}>{item.count}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.85)' : item.color, whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, flexWrap: isMobile ? 'nowrap' : 'wrap', alignItems: 'center' }}>
        <div className="flex-1 min-w-48">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un participant…" icon={<Search className="w-4 h-4" />} />
        </div>
        <DateRangeFilter value={preset} onChange={handleDateChange} />
        <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tous les modes paiement</option>
          <option value="cash">Comptant</option>
          <option value="echelonne">Échelonné</option>
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
        </select>
        <select value={participationModeFilter} onChange={e => setParticipationModeFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tous les modes participation</option>
          <option value="presentiel">Présentiel</option>
          <option value="en_ligne">En ligne</option>
          <option value="hybride">Hybride</option>
        </select>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2ECF8', boxShadow: '0 2px 12px rgba(26,115,232,0.06)', overflow: 'hidden' }}>
        {filtered.map((p, i) => {
          const packs = coachingPacks.filter(cp => cp.participantId === p.id && cp.status === 'active')
          const activePack = packs[0]
          const tc = TYPE_CONFIG[p.type]
          const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
            coaching:  { bg: '#EFF6FF', color: '#1A73E8' },
            training:  { bg: '#F5F3FF', color: '#7C3AED' },
            both:      { bg: '#F0FDF4', color: '#16A34A' },
          }
          const tb = TYPE_BADGE[p.type] || { bg: '#F8FAFC', color: '#64748B' }
          return (
            <div
              key={p.id}
              onClick={() => setSelectedParticipant(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid #F0F7FF' : 'none',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFCFF')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Avatar name={`${p.firstName} ${p.lastName}`} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.firstName} {p.lastName}
                </p>
                <p style={{ fontSize: 12, color: '#6B88A8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.profession || p.company || '—'}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>
                  Inscrit le {formatDate(p.createdAt)}
                  {activePack ? ` · ${activePack.usedSessions}/${activePack.totalSessions} séances` : ''}
                </p>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <a href={`tel:${p.phone}`} onClick={e => e.stopPropagation()}
                  style={{ width: 32, height: 32, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A73E8', textDecoration: 'none' }}>
                  <Phone className="w-3.5 h-3.5" />
                </a>
                {p.email && (
                  <a href={`mailto:${p.email}`} onClick={e => e.stopPropagation()}
                    style={{ width: 32, height: 32, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', textDecoration: 'none' }}>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {/* Type badge */}
              <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: tb.bg, color: tb.color, flexShrink: 0 }}>
                {tc.label}
              </span>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 16px', color: '#94A3B8', fontSize: 14 }}>Aucun participant trouvé</div>
        )}
      </div>

      {selectedParticipant && <ParticipantDetail participant={selectedParticipant} onClose={() => setSelectedParticipant(null)} />}
      {showAdd && <AddParticipantModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
