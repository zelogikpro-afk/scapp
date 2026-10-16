import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import type { LearnerSession } from '../../lib/learnerSession'
import { CheckCircle, Lock, Trophy, Star, BookOpen, FlaskConical, PlayCircle, FileText, Target } from 'lucide-react'

const TESTS_LIST = ['mapping', 'ie', 'qs', 'compass', 'valeurs']
const TEST_LABELS: Record<string, string> = {
  mapping: 'Mapping', ie: 'Intelligence Émotionnelle', qs: 'Quotient de Succès',
  compass: 'Test Compass', valeurs: 'Test des Valeurs',
}

interface Stats {
  testsCompleted: number
  totalTests: number
  totalDocs: number
  totalRecordings: number
  lessonsCompleted: number
  totalLessons: number
  objectivesCompleted: number
  totalObjectives: number
  totalDevoirs: number
  devoirsSubmitted: number
  testResults: { type: string; done: boolean }[]
}

export default function EspaceProgression() {
  const session = useOutletContext<LearnerSession>()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const promotionIds = session.allPromotionIds?.length ? session.allPromotionIds : session.promotionId ? [session.promotionId] : []

    const data = await learnerApi.getProgression({
      allPromotionIds: promotionIds,
      allLevels: session.allLevels?.length ? session.allLevels : [session.formationLevel],
      participantId: session.participantId || null,
      participantName: session.participantName || null,
    }) as any

    const doneTypes = new Set(data.testTypes || [])
    const testResults = TESTS_LIST.map(t => ({ type: t, done: doneTypes.has(t) }))
    const objectives = data.objectives || []

    setStats({
      testsCompleted: testResults.filter(t => t.done).length,
      totalTests: TESTS_LIST.length,
      totalDocs: data.totalDocs || 0,
      totalRecordings: data.totalRecordings || 0,
      lessonsCompleted: data.lessonsCompleted || 0,
      totalLessons: data.totalLessons || 0,
      objectivesCompleted: objectives.filter((o: any) => o.status === 'completed').length,
      totalObjectives: objectives.length,
      totalDevoirs: data.totalDevoirs || 0,
      devoirsSubmitted: data.devoirsSubmitted || 0,
      testResults,
    })
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>
  if (!stats) return null

  // Only use real per-learner metrics — no fake session attendance
  const testPct = stats.testsCompleted / stats.totalTests
  const lessonPct = stats.totalLessons > 0 ? stats.lessonsCompleted / stats.totalLessons : 0
  const objectivePct = stats.totalObjectives > 0 ? stats.objectivesCompleted / stats.totalObjectives : 0

  // If no lessons data, split weight between tests and objectives
  const hasLessons = stats.totalLessons > 0
  const overallPct = Math.round(hasLessons
    ? (testPct * 0.4 + lessonPct * 0.3 + objectivePct * 0.3) * 100
    : (testPct * 0.6 + objectivePct * 0.4) * 100
  )

  const badges = [
    { label: 'Premier test', icon: '🧠', earned: stats.testsCompleted >= 1 },
    { label: 'Tous les tests', icon: '🏆', earned: stats.testsCompleted === stats.totalTests },
    { label: 'Première leçon', icon: '📚', earned: stats.lessonsCompleted >= 1 },
    { label: 'Mi-parcours', icon: '⭐', earned: overallPct >= 50 },
    { label: 'Parcours complet', icon: '🎓', earned: overallPct >= 90 },
    { label: 'Objectif atteint', icon: '✅', earned: stats.objectivesCompleted >= 1 },
  ]

  function ProgressBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-semibold text-gray-700 w-16 text-right">{value}/{max}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ma progression</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de votre parcours</p>
      </div>

      {/* Overall */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">Progression globale</p>
            <p className="text-4xl font-black mt-1">{overallPct}%</p>
          </div>
          <Trophy className="w-12 h-12 text-blue-300 opacity-60" />
        </div>
        <div className="h-3 bg-blue-900/50 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-5 h-5 text-purple-500" />
            <p className="font-semibold text-gray-900 text-sm">Tests</p>
          </div>
          <ProgressBar value={stats.testsCompleted} max={stats.totalTests} color="bg-purple-500" />
          <div className="mt-3 space-y-1.5">
            {stats.testResults.map(t => (
              <div key={t.type} className="flex items-center gap-2">
                {t.done ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <Lock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                <span className={`text-xs ${t.done ? 'text-gray-700' : 'text-gray-400'}`}>{TEST_LABELS[t.type]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {/* E-learning lessons */}
          {stats.totalLessons > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <p className="font-semibold text-gray-900 text-sm">Leçons e-learning</p>
              </div>
              <ProgressBar value={stats.lessonsCompleted} max={stats.totalLessons} color="bg-indigo-500" />
            </div>
          )}

          {/* Objectives */}
          {stats.totalObjectives > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-orange-500" />
                <p className="font-semibold text-gray-900 text-sm">Objectifs</p>
              </div>
              <ProgressBar value={stats.objectivesCompleted} max={stats.totalObjectives} color="bg-orange-500" />
            </div>
          )}

          {/* Devoirs */}
          {stats.totalDevoirs > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-teal-500" />
                <p className="font-semibold text-gray-900 text-sm">Devoirs rendus</p>
              </div>
              <ProgressBar value={stats.devoirsSubmitted} max={stats.totalDevoirs} color="bg-teal-500" />
            </div>
          )}

          {/* Resources (docs + recordings — shown as info, not completion metric) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="w-5 h-5 text-blue-500" />
              <p className="font-semibold text-gray-900 text-sm">Ressources disponibles</p>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>📄 {stats.totalDocs} document{stats.totalDocs !== 1 ? 's' : ''}</span>
              <span>🎬 {stats.totalRecordings} enregistrement{stats.totalRecordings !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-500" />
          <p className="font-semibold text-gray-900">Badges obtenus</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map(b => (
            <div key={b.label} className={`flex items-center gap-2 p-3 rounded-xl border ${b.earned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100 opacity-50 grayscale'}`}>
              <span className="text-2xl">{b.icon}</span>
              <span className="text-xs font-medium text-gray-700">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
