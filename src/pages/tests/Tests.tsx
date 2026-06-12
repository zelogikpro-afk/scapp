import { useState } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { useAppStore } from '../../store/appStore'
import { formatDate } from '../../lib/utils'
import type { TestType } from '../../types'

const TEST_COLORS: Record<TestType, string> = {
  DISC: 'info', MBTI: 'purple', Enneagram: 'warning', 'Life Wheel': 'success',
  Values: 'default', Ikigai: 'info', Strengths: 'success', LifeBook: 'purple',
}

export default function Tests() {
  const { tests, participants } = useAppStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tests Psychométriques</h2>
          <p className="text-sm text-gray-500">{tests.length} tests réalisés</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>Nouveau test</Button>
      </div>

      {/* Test types summary */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {(['DISC', 'MBTI', 'Enneagram', 'Life Wheel', 'Values', 'Ikigai', 'Strengths', 'LifeBook'] as TestType[]).map(type => {
          const count = tests.filter(t => t.type === type).length
          return (
            <Card key={type} className="text-center p-3">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{type}</p>
            </Card>
          )
        })}
      </div>

      {/* Tests list */}
      <div className="space-y-3">
        {tests.map(test => {
          const participant = participants.find(p => p.id === test.participantId)
          return (
            <Card key={test.id} hover>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {participant && <Avatar name={`${participant.firstName} ${participant.lastName}`} size="sm" />}
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {participant ? `${participant.firstName} ${participant.lastName}` : '—'}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(test.date)}</p>
                      </div>
                    </div>
                    <Badge variant={TEST_COLORS[test.type] as any}>{test.type}</Badge>
                  </div>
                  {test.result && (
                    <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Résultat: <span className="text-blue-600 dark:text-blue-400">{test.result}</span>
                    </p>
                  )}
                  {test.score && <p className="text-xs text-gray-500 mt-0.5">{test.score}</p>}
                  {test.interpretation && (
                    <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">{test.interpretation}</p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
        {tests.length === 0 && (
          <Card className="text-center py-12">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucun test enregistré</p>
          </Card>
        )}
      </div>
    </div>
  )
}
