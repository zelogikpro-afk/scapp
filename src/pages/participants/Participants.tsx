import { useState, useMemo } from 'react'
import { Plus, Search, User, Phone, Mail, Tag } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table'
import { Progress } from '../../components/ui/Progress'
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
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'coaching' | 'training' | 'both'>('all')
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const filtered = useMemo(() => participants.filter(p => {
    const matchSearch = search === '' || `${p.firstName} ${p.lastName} ${p.email} ${p.phone} ${p.profession}`.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || p.type === typeFilter
    return matchSearch && matchType && p.isActive
  }), [participants, search, typeFilter])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Participants</h2>
          <p className="text-sm text-gray-500 mt-0.5">{participants.filter(p => p.isActive).length} participants actifs</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>
          Nouveau participant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['coaching', 'training', 'both'] as const).map(type => {
          const count = participants.filter(p => p.type === type && p.isActive).length
          const config = TYPE_CONFIG[type]
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`p-4 rounded-xl border text-center transition-all bg-white dark:bg-gray-900 ${typeFilter === type ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
              <Badge variant={config.color} className="mt-1">{config.label}</Badge>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un participant…" icon={<Search className="w-4 h-4" />} />
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <tr>
              <Th>Participant</Th>
              <Th>Contact</Th>
              <Th>Type</Th>
              <Th>Profession</Th>
              <Th>Pack coaching</Th>
              <Th>Inscription</Th>
              <Th>Tags</Th>
            </tr>
          </Thead>
          <Tbody>
            {filtered.map(p => {
              const packs = coachingPacks.filter(cp => cp.participantId === p.id && cp.status === 'active')
              const activePack = packs[0]
              return (
                <Tr key={p.id} onClick={() => setSelectedParticipant(p)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${p.firstName} ${p.lastName}`} size="sm" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{p.firstName} {p.lastName}</p>
                        {p.company && <p className="text-xs text-gray-400">{p.company}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <Phone className="w-3 h-3 text-gray-400" /> {p.phone}
                      </div>
                      {p.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Mail className="w-3 h-3" /> {p.email}
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge variant={TYPE_CONFIG[p.type].color}>{TYPE_CONFIG[p.type].label}</Badge>
                  </Td>
                  <Td>
                    <span className="text-xs">{p.profession || '—'}</span>
                  </Td>
                  <Td>
                    {activePack ? (
                      <div className="min-w-32">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{activePack.usedSessions}/{activePack.totalSessions} séances</p>
                        <Progress value={activePack.usedSessions} max={activePack.totalSessions} size="sm" color="blue" showLabel />
                      </div>
                    ) : p.type !== 'training' ? (
                      <span className="text-xs text-gray-400">Aucun pack</span>
                    ) : null}
                  </Td>
                  <Td><span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span></Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {(p.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{tag}</span>
                      ))}
                    </div>
                  </Td>
                </Tr>
              )
            })}
            {filtered.length === 0 && (
              <Tr><Td className="text-center text-gray-400 py-12" colSpan={7 as any}>Aucun participant trouvé</Td></Tr>
            )}
          </Tbody>
        </Table>
      </Card>

      {selectedParticipant && <ParticipantDetail participant={selectedParticipant} onClose={() => setSelectedParticipant(null)} />}
      {showAdd && <AddParticipantModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
