import { useState, useEffect } from 'react'
import { Plus, ClipboardList, X, Trash2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import type { TestType } from '../../types'
import toast from 'react-hot-toast'

const TEST_TYPES: TestType[] = ['DISC', 'MBTI', 'Enneagram', 'Life Wheel', 'Values', 'Ikigai', 'Strengths', 'LifeBook']

const TEST_COLORS: Record<TestType, string> = {
  DISC: 'info', MBTI: 'purple', Enneagram: 'warning', 'Life Wheel': 'success',
  Values: 'default', Ikigai: 'info', Strengths: 'success', LifeBook: 'purple',
}

const EMPTY = {
  participantId: '', type: 'DISC' as TestType,
  date: new Date().toISOString().split('T')[0],
  result: '', score: '', interpretation: '', coachNotes: '',
}

function NewTestModal({ onClose }: { onClose: () => void }) {
  const { participants, addTest } = useAppStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.participantId) return toast.error('Sélectionnez un participant')
    setLoading(true)
    try {
      await addTest({
        participantId: form.participantId,
        type: form.type,
        date: form.date,
        result: form.result || undefined,
        score: form.score || undefined,
        interpretation: form.interpretation || undefined,
        coachNotes: form.coachNotes || undefined,
        administeredBy: user?.name || user?.email || '',
        pdfUrl: undefined,
      })
      toast.success('Test enregistré !')
      onClose()
    } catch { toast.error('Erreur lors de l\'enregistrement') }
    setLoading(false)
  }

  return (
    <Modal open onClose={onClose} title="Nouveau test psychométrique" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Participant *</label>
          <select value={form.participantId} onChange={e => setF('participantId', e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Sélectionner —</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de test *</label>
            <select value={form.type} onChange={e => setF('type', e.target.value as TestType)}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input label="Date *" type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
        </div>
        <Input label="Résultat" value={form.result} onChange={e => setF('result', e.target.value)} placeholder="Ex: Type D dominant" />
        <Input label="Score" value={form.score} onChange={e => setF('score', e.target.value)} placeholder="Ex: D:70% I:50% S:30% C:40%" />
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Interprétation</label>
          <textarea rows={3} value={form.interpretation} onChange={e => setF('interpretation', e.target.value)}
            placeholder="Description du profil et recommandations…"
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes coach (privées)</label>
          <textarea rows={2} value={form.coachNotes} onChange={e => setF('coachNotes', e.target.value)}
            placeholder="Observations personnelles…"
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !form.participantId}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Tests() {
  const { tests, participants, fetchTests, deleteTest } = useAppStore()
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { fetchTests() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tests Psychométriques</h2>
          <p className="text-sm text-gray-500">{tests.length} tests réalisés</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>
          Nouveau test
        </Button>
      </div>

      {/* Test types summary */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {TEST_TYPES.map(type => {
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
                  {test.administeredBy && (
                    <p className="text-xs text-gray-400 mt-1">Administré par: {test.administeredBy}</p>
                  )}
                  <button
                    onClick={async () => { if (!confirm('Supprimer ce test ?')) return; await deleteTest(test.id); toast.success('Test supprimé') }}
                    className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Supprimer
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
        {tests.length === 0 && (
          <Card className="text-center py-12">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucun test enregistré</p>
            <Button variant="primary" className="mt-4" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>
              Créer le premier test
            </Button>
          </Card>
        )}
      </div>

      {showNew && <NewTestModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
