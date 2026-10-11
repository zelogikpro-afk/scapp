import { useEffect, useState } from 'react'
import { trainerApiCall } from '../../lib/trainerApi'
import { Users, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react'
import toast from 'react-hot-toast'

const TEST_TYPES = [
  { type: 'mapping',       label: 'Mapping',    icon: '🧠' },
  { type: 'ie',            label: 'IE',          icon: '❤️' },
  { type: 'qs',            label: 'QS',          icon: '🏆' },
  { type: 'compass',       label: 'Compass',     icon: '🧭' },
  { type: 'valeurs',       label: 'Valeurs',     icon: '💎' },
  { type: 'quiz_coach',    label: 'Quiz N1',     icon: '📝' },
  { type: 'quiz_coach_n2', label: 'Quiz N2',     icon: '📋' },
  { type: 'quiz_dev_pers', label: 'Dév. Pers.',  icon: '🌱' },
]

export default function TrainerApprenants() {
  const [learners, setLearners]   = useState<any[]>([])
  const [promoMap, setPromoMap]   = useState<Record<string, any>>({})
  const [unlocks, setUnlocks]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [toggling, setToggling]   = useState<string | null>(null)
  const [togglingTest, setTogglingTest] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      trainerApiCall({ action: 'get_learners' }),
      trainerApiCall({ action: 'get_test_unlocks' }),
    ]).then(([ld, ud]) => {
      setLearners(ld.learners || [])
      setPromoMap(ld.promoMap || {})
      setUnlocks(ud.unlocks || [])
      setLoading(false)
    })
  }, [])

  async function toggleLearner(l: any) {
    setToggling(l.id)
    try {
      await trainerApiCall({ action: 'toggle_learner', payload: { learnerId: l.id, isActive: !l.is_active } })
      setLearners(prev => prev.map(x => x.id === l.id ? { ...x, is_active: !x.is_active } : x))
      toast.success(l.is_active ? 'Apprenant désactivé' : 'Apprenant activé')
    } catch { toast.error('Erreur') }
    setToggling(null)
  }

  async function toggleTest(learnerId: string, testType: string) {
    const key = `${learnerId}:${testType}`
    setTogglingTest(key)
    try {
      const d = await trainerApiCall({ action: 'toggle_test_unlock', payload: { learnerId, testType } })
      if (d.unlocked) {
        setUnlocks(prev => [...prev, { learner_id: learnerId, test_type: testType }])
        toast.success('Test ouvert')
      } else {
        setUnlocks(prev => prev.filter(u => !(u.learner_id === learnerId && u.test_type === testType)))
        toast.success('Test fermé')
      }
    } catch { toast.error('Erreur') }
    setTogglingTest(null)
  }

  async function unlockAll(learnerId: string) {
    for (const t of TEST_TYPES) {
      const isUnlocked = unlocks.some(u => u.learner_id === learnerId && u.test_type === t.type)
      if (!isUnlocked) {
        await trainerApiCall({ action: 'toggle_test_unlock', payload: { learnerId, testType: t.type } })
        setUnlocks(prev => [...prev, { learner_id: learnerId, test_type: t.type }])
      }
    }
    toast.success('Tous les tests ouverts')
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  const byPromo: Record<string, any[]> = {}
  for (const l of learners) {
    const k = l.promotion_id || 'other'
    if (!byPromo[k]) byPromo[k] = []
    byPromo[k].push(l)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes apprenants</h1>
        <p className="text-sm text-gray-500 mt-0.5">{learners.length} apprenant{learners.length > 1 ? 's' : ''} dans votre groupe</p>
      </div>

      {Object.entries(byPromo).map(([promoId, list]) => {
        const info = promoMap[promoId]
        return (
          <div key={promoId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{info?.level || '?'}</span>
              <span className="text-sm font-semibold text-gray-800">{info?.name || 'Groupe'}</span>
              <span className="ml-auto text-xs text-gray-400">{list.length} apprenant{list.length > 1 ? 's' : ''}</span>
            </div>

            {/* Header tests */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="text-left px-4 py-2 font-medium text-gray-500 w-48">Apprenant</th>
                    <th className="text-center px-2 py-2 font-medium text-gray-500">Accès</th>
                    {TEST_TYPES.map(t => (
                      <th key={t.type} className="text-center px-2 py-2 font-medium text-gray-500 whitespace-nowrap">
                        {t.icon} {t.label}
                      </th>
                    ))}
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {list.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm">{l.participant_name}</p>
                        <p className="text-xs text-gray-400">{l.username}</p>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button onClick={() => toggleLearner(l)} disabled={toggling === l.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            l.is_active
                              ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600'
                              : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                          }`}>
                          {toggling === l.id ? '…' : l.is_active
                            ? <><CheckCircle className="w-3 h-3" />Actif</>
                            : <><XCircle className="w-3 h-3" />Inactif</>
                          }
                        </button>
                      </td>
                      {TEST_TYPES.map(t => {
                        const isUnlocked = unlocks.some(u => u.learner_id === l.id && u.test_type === t.type)
                        const key = `${l.id}:${t.type}`
                        return (
                          <td key={t.type} className="px-2 py-3 text-center">
                            <button onClick={() => toggleTest(l.id, t.type)} disabled={togglingTest === key}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isUnlocked
                                  ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600'
                                  : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                              }`}>
                              {togglingTest === key ? '…' : isUnlocked
                                ? <><Unlock className="w-3 h-3" />Ouvert</>
                                : <><Lock className="w-3 h-3" />Fermé</>
                              }
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => unlockAll(l.id)}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                          Tout ouvrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {learners.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucun apprenant dans votre groupe</p>
        </div>
      )}
    </div>
  )
}
