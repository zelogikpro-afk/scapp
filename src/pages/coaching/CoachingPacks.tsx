import { useState } from 'react'
import { BookOpen, Plus, TrendingUp } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Progress } from '../../components/ui/Progress'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { formatCurrency, formatDate, percentage } from '../../lib/utils'

const PACK_STATUS = {
  active: { label: 'Actif', color: 'success' as const },
  completed: { label: 'Terminé', color: 'info' as const },
  expired: { label: 'Expiré', color: 'danger' as const },
  paused: { label: 'Pausé', color: 'warning' as const },
}

export default function CoachingPacks() {
  const { coachingPacks, participants, coachingSessions } = useAppStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Packs de Coaching</h2>
          <p className="text-sm text-gray-500">{coachingPacks.filter(p => p.status === 'active').length} packs actifs</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Nouveau pack</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['active', 'completed', 'paused', 'expired'] as const).map(status => (
          <Card key={status}>
            <p className="text-xs text-gray-500">{PACK_STATUS[status].label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {coachingPacks.filter(p => p.status === status).length}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {coachingPacks.map(pack => {
          const participant = participants.find(p => p.id === pack.participantId)
          const sessions = coachingSessions.filter(s => s.packId === pack.id)
          const remaining = pack.totalSessions - pack.usedSessions
          const netPrice = pack.price - pack.discount
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
                <Badge variant={PACK_STATUS[pack.status].color}>{PACK_STATUS[pack.status].label}</Badge>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{pack.usedSessions} séances réalisées</span>
                  <span className="font-medium text-blue-600">{remaining} restantes</span>
                </div>
                <Progress value={pack.usedSessions} max={pack.totalSessions} color="blue" showLabel />
              </div>

              {/* Financial */}
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

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                <span>Acheté le {formatDate(pack.purchaseDate)}</span>
                {pack.expirationDate && <span>Exp: {formatDate(pack.expirationDate)}</span>}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
