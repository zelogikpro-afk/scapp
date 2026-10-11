import { useEffect, useState } from 'react'
import { useOutletContext, Navigate } from 'react-router-dom'
import { type LearnerSession } from '../../lib/learnerSession'
import { learnerApiCall } from '../../lib/learnerApi'
import { CheckCircle, Lock, ChevronRight, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const LEVELS = {
  N1: {
    label: 'Coach de Vie et Développement Personnel',
    price: '7 500 DHS',
    duration: '2 mois (8 semaines)',
    schedule: 'Samedis ou Dimanches, 10h-14h ou 14h30-18h30',
    modules: ['Développement personnel & transformation humaine', 'Connaissance de soi & intelligence émotionnelle', 'Neurosciences & reprogrammation cérébrale', 'Communication & prise de parole', 'Vision de vie & fixation d\'objectifs', 'Fondamentaux du coaching de vie'],
    color: '#1D3462',
    badge: 'N1',
    badgeBg: 'bg-blue-100 text-blue-700',
    quizRequired: 'quiz_coach',
    quizLabel: 'Quiz Final N1',
  },
  N2: {
    label: 'Master Coach Thérapeute',
    price: '12 000 DHS',
    duration: '2 mois (8 semaines)',
    schedule: 'Samedis ou Dimanches, 10h-14h ou 14h30-18h30',
    modules: ['Psychologie & psychopathologie humaine', 'Coaching thérapeutique & théorie du changement', 'Coaching émotionnel & régulation', 'Neurosciences avancées & reprogrammation mentale', 'EFT (Emotional Freedom Techniques)', 'Analyse transactionnelle'],
    color: '#6b21a8',
    badge: 'N2',
    badgeBg: 'bg-purple-100 text-purple-700',
    quizRequired: 'quiz_coach_n2',
    quizLabel: 'Quiz Final N2',
  },
  N3: {
    label: 'Master Coach Consultant',
    price: '15 000 DHS',
    duration: '4 mois',
    schedule: 'Samedis ou Dimanches, 10h-14h ou 14h30-18h30',
    modules: ['Consulting stratégique & psychologie organisationnelle', 'Executive coaching & leadership', 'Gestion du changement', 'PNL avancée & communication d\'influence', 'Hypnothérapie professionnelle', 'Spécialisations : coaching pro, scolaire, parental, relationnel'],
    color: '#92400e',
    badge: 'N3',
    badgeBg: 'bg-amber-100 text-amber-700',
    quizRequired: null,
    quizLabel: '',
  },
}

const NEXT_LEVEL: Record<string, 'N2' | 'N3'> = { N1: 'N2', N2: 'N3' }

const BETA_USERNAMES = ['a.successcompass']

export default function EspaceInscriptionNiveau() {
  const session = useOutletContext<LearnerSession>()
  const [quizResults, setQuizResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const isBeta = BETA_USERNAMES.includes(session.username)

  // Current highest level
  const allLevels = session.allLevels?.length ? session.allLevels : [session.formationLevel || 'N1']
  const levelOrder = ['N1', 'N2', 'N3']
  const highestLevel = allLevels.sort((a, b) => levelOrder.indexOf(b) - levelOrder.indexOf(a))[0]
  const nextLevelKey = NEXT_LEVEL[highestLevel] as 'N2' | 'N3' | undefined
  const nextLevel = nextLevelKey ? LEVELS[nextLevelKey] : null

  useEffect(() => {
    if (!nextLevel?.quizRequired) { setLoading(false); return }
    learnerApiCall<any>({
      action: 'get_tests',
      payload: { participantId: session.participantId || null, participantName: session.participantName },
    }).then(d => {
      setQuizResults(d.results || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (!isBeta) return <Navigate to="/espace/accueil" replace />
  if (loading) return <div className="text-center py-20 text-gray-400">Chargement…</div>

  // Check quiz validation
  const requiredQuiz = nextLevel?.quizRequired
  const quizResult = requiredQuiz
    ? quizResults.find((r: any) => r.test_type === requiredQuiz)
    : null
  const quizPassed = quizResult
    ? ((quizResult.scores?.percentage ?? 0) >= 75)
    : false
  const canRequest = !requiredQuiz || quizPassed

  async function submit() {
    setSubmitting(true)
    try {
      await learnerApiCall({
        action: 'submit_level_upgrade_request',
        payload: {
          currentLevel: highestLevel,
          requestedLevel: nextLevelKey,
          phone,
          message,
          quizValidated: quizPassed,
        },
      })
      setDone(true)
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'envoi')
    }
    setSubmitting(false)
  }

  if (highestLevel === 'N3') {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inscription au niveau suivant</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <span className="text-5xl mb-4 block">🏆</span>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Félicitations !</h2>
          <p className="text-sm text-gray-500">Vous avez atteint le niveau le plus élevé — Master Coach Consultant N3.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inscription au niveau suivant</h1>
        <p className="text-sm text-gray-500 mt-0.5">Progressez dans votre parcours Success Compass</p>
      </div>

      {/* Current level */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVELS[highestLevel as keyof typeof LEVELS]?.badgeBg || 'bg-gray-100 text-gray-500'}`}>
          {highestLevel}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-700">Votre niveau actuel</p>
          <p className="text-xs text-gray-400">{LEVELS[highestLevel as keyof typeof LEVELS]?.label}</p>
        </div>
      </div>

      {/* Next level card */}
      {nextLevel && nextLevelKey && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50" style={{ background: `${nextLevel.color}10` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${nextLevel.badgeBg}`}>{nextLevel.badge}</span>
              <span className="text-xs text-gray-400">Niveau suivant</span>
            </div>
            <h2 className="text-base font-bold" style={{ color: nextLevel.color }}>{nextLevel.label}</h2>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-xl font-bold text-gray-900">{nextLevel.price}</span>
              <span className="text-sm text-gray-400">· {nextLevel.duration}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{nextLevel.schedule}</p>
          </div>

          <div className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Modules principaux</p>
            <ul className="space-y-1.5">
              {nextLevel.modules.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Quiz condition */}
          {requiredQuiz && (
            <div className={`mx-5 mb-5 p-3.5 rounded-xl border ${canRequest ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-2">
                {canRequest
                  ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  : <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                }
                <div>
                  <p className={`text-sm font-medium ${canRequest ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {canRequest
                      ? `${nextLevel.quizLabel} validé — vous pouvez postuler`
                      : `Condition requise : valider le ${nextLevel.quizLabel} avec 75%+`
                    }
                  </p>
                  {!canRequest && quizResult && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Votre score actuel : {quizResult.scores?.percentage ?? 0}% — continuez à pratiquer !
                    </p>
                  )}
                  {!canRequest && !quizResult && (
                    <p className="text-xs text-amber-600 mt-0.5">Vous n'avez pas encore passé ce quiz</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="px-5 pb-5">
            {canRequest ? (
              <button onClick={() => { setShowForm(true); setDone(false) }}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: nextLevel.color }}>
                Demander mon inscription en {nextLevelKey}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button disabled
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed">
                <Lock className="w-4 h-4" />
                Validez d'abord le {nextLevel.quizLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && nextLevel && nextLevelKey && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            {done ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Demande envoyée !</h3>
                <p className="text-sm text-gray-500 mb-6">Notre équipe vous contactera rapidement pour organiser votre inscription en {nextLevelKey}.</p>
                <button onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-sm text-white hover:opacity-90 transition-opacity"
                  style={{ background: nextLevel.color }}>
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900">Inscription {nextLevelKey}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{nextLevel.label}</p>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-800">{session.participantName}</p>
                    <p className="text-xs text-gray-400">Actuellement en {highestLevel} → demande pour {nextLevelKey}</p>
                  </div>
                  {quizPassed && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <p className="text-xs text-emerald-700 font-medium">{nextLevel.quizLabel} validé ({quizResult?.scores?.percentage}%)</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': nextLevel.color } as any} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      rows={3} placeholder="Questions, disponibilités, mode préféré (présentiel/distanciel)…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none" />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">Tarif {nextLevelKey} : {nextLevel.price} · {nextLevel.duration}. Notre équipe vous contactera pour les modalités de paiement.</p>
                  </div>
                  <button onClick={submit} disabled={submitting || !phone.trim()}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                    style={{ background: nextLevel.color }}>
                    {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
