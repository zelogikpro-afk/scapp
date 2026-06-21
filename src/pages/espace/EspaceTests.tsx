import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabaseAdmin } from '../../lib/supabase'
import { type LearnerSession } from '../../lib/learnerSession'
import { FlaskConical, Lock, ChevronRight } from 'lucide-react'

interface TestUnlock { id: string; test_type: string; unlocked_at: string }

const TESTS = [
  {
    type: 'mapping',
    label: 'Test de personnalité',
    subtitle: 'Découvrez votre profil et vos forces naturelles',
    icon: '🧠',
    path: '/tests/mapping',
    gradient: 'from-purple-500 to-purple-700',
  },
  {
    type: 'ie',
    label: 'Intelligence Émotionnelle',
    subtitle: 'Évaluez votre quotient émotionnel',
    icon: '❤️',
    path: '/tests/ie',
    gradient: 'from-rose-500 to-rose-700',
  },
  {
    type: 'qs',
    label: 'Quotient de Succès',
    subtitle: 'Mesurez votre potentiel de réussite sur 15 piliers',
    icon: '🏆',
    path: '/test/qs',
    gradient: 'from-teal-500 to-blue-700',
  },
]

export default function EspaceTests() {
  const session = useOutletContext<LearnerSession>()
  const navigate = useNavigate()
  const [unlocks, setUnlocks] = useState<TestUnlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabaseAdmin.from('test_unlocks').select('*').eq('learner_id', session.id)
    setUnlocks(data || [])
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tests de personnalité</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ces tests sont déverrouillés par votre formateur au moment opportun dans le programme.</p>
      </div>

      <div className="space-y-4">
        {TESTS.map(test => {
          const unlock = unlocks.find(u => u.test_type === test.type)
          const isUnlocked = !!unlock
          return (
            <div key={test.type} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${!isUnlocked ? 'opacity-75' : ''}`}>
              <div className="flex items-center gap-5 p-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${test.gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                  {test.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900">{test.label}</h2>
                    {!isUnlocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-xs">
                        <Lock className="w-2.5 h-2.5" />Verrouillé
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{test.subtitle}</p>
                  {isUnlocked && unlock && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Déverrouillé le {new Date(unlock.unlocked_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                {isUnlocked ? (
                  <button onClick={() => navigate(test.path)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-br ${test.gradient} hover:opacity-90 transition-opacity shadow-sm flex-shrink-0`}>
                    Commencer <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {unlocks.length === 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          <FlaskConical className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-60" />
          <p className="text-sm text-amber-800 font-medium">Tests verrouillés pour l'instant</p>
          <p className="text-xs text-amber-600 mt-1">Votre formateur vous donnera accès au bon moment dans le programme.</p>
        </div>
      )}
    </div>
  )
}
