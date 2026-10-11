import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { learnerApi } from '../../lib/learnerApi'
import { type LearnerSession } from '../../lib/learnerSession'
import { Award, Calendar, CheckCircle } from 'lucide-react'

interface QuizResult {
  test_type: string
  created_at: string
  scores: Record<string, number> | null
}

const LEVEL_META: Record<string, { label: string; gradient: string; badge: string }> = {
  quiz_coach:    { label: 'Coach de Vie & Développement Personnel — Niveau 1', gradient: 'from-blue-600 to-indigo-700',   badge: 'N1' },
  quiz_coach_n2: { label: 'Master Coach Thérapeute — Niveau 2',                gradient: 'from-purple-600 to-indigo-700', badge: 'N2' },
  quiz_coach_n3: { label: 'Master Coach Consultant — Niveau 3',                gradient: 'from-amber-600 to-orange-700',  badge: 'N3' },
}

export default function EspaceCertificat() {
  const session = useOutletContext<LearnerSession>()
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const quizTypes = ['quiz_coach', 'quiz_coach_n2', 'quiz_coach_n3']
    const all = await learnerApi.getCertif({
      participantId: session.participantId || null,
      participantName: session.participantName,
    }) as any[]
    setResults((all || []).filter(r => quizTypes.includes(r.test_type)))
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-1">
          <Award className="w-5 h-5 text-yellow-500" />
          <h1 className="text-xl font-bold text-gray-900">Mes certificats</h1>
        </div>
        <p className="text-sm text-gray-500">Obtenus après validation du quiz final de chaque niveau</p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Aucun certificat pour l'instant</h2>
          <p className="text-sm text-gray-400 mt-1">Votre certificat apparaîtra ici après validation du quiz final</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(r => {
            const meta = LEVEL_META[r.test_type] || { label: r.test_type, gradient: 'from-blue-600 to-indigo-700', badge: '' }
            const date = new Date(r.created_at)
            return (
              <div key={r.test_type} className={`bg-gradient-to-br ${meta.gradient} rounded-2xl p-6 text-white shadow-lg`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">{meta.badge}</span>
                    <span className="flex items-center gap-1 text-xs bg-green-400/30 text-white px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Validé
                    </span>
                  </div>
                </div>

                <p className="text-white/70 text-xs mb-0.5">Certificat délivré à</p>
                <h2 className="text-xl font-bold text-white mb-4">{session.participantName}</h2>

                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-white/70 text-xs mb-1">Formation certifiée</p>
                  <p className="text-white font-bold text-base">{meta.label}</p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-white/80 text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Quiz validé le {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/60 text-xs">Délivré par</p>
                  <p className="text-white text-sm font-medium">Sofya EL QOUASSI — Master Trainer</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
