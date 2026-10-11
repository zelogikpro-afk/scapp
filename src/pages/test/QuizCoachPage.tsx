import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { QUIZ_QUESTIONS, getQuizScore } from '../../data/quizCoachData'
import { CheckCircle2, XCircle, ChevronRight, BookOpen } from 'lucide-react'

type Step = 'intro' | 'info' | 'questions' | 'result'

const NAVY = '#1D3462'
const OPTION_LETTERS = ['A', 'B', 'C', 'D']
const PASS_THRESHOLD = 75

function getLevel(pct: number) {
  if (pct >= 90) return { label: 'Excellent', color: '#166534', bg: '#dcfce7', passed: true }
  if (pct >= PASS_THRESHOLD) return { label: 'Validé', color: '#1e40af', bg: '#dbeafe', passed: true }
  return { label: 'Non validé', color: '#991b1b', bg: '#fee2e2', passed: false }
}

export default function QuizCoachPage() {
  const [step, setStep]       = useState<Step>('intro')
  const [firstName, setFirst] = useState('')
  const [lastName, setLast]   = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [saving, setSaving]   = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [fromSession, setFromSession] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sc_learner_session')
      if (!raw) return
      const s = JSON.parse(raw)
      const parts = (s.participantName || '').trim().split(' ')
      setFirst(parts[0] || '')
      setLast(parts.slice(1).join(' ') || '')
      setParticipantId(s.participantId || null)
      setFromSession(true)
    } catch { /* ignore */ }
  }, [])

  const answered    = Object.keys(answers).length
  const total       = QUIZ_QUESTIONS.length
  const allAnswered = answered === total

  function answer(qId: number, idx: number) {
    setAnswers(prev => ({ ...prev, [qId]: idx }))
  }

  async function submit() {
    if (!allAnswered) return
    setSaving(true)
    const score = getQuizScore(answers)
    const pct   = Math.round((score / total) * 100)
    const level = getLevel(pct)

    await supabase.from('test_results').insert({
      test_type:        'quiz_coach',
      participant_id:   participantId,
      first_name:       firstName,
      last_name:        lastName,
      scores:           { correct: score, total, percentage: pct },
      dominant_profile: level.label,
      answers,
    })
    setSaving(false)
    setStep('result')
  }

  const score = getQuizScore(answers)
  const pct   = Math.round((score / total) * 100)
  const level = getLevel(pct)

  /* ── INTRO ── */
  if (step === 'intro') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a4a8a 100%)` }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center">
        <img src="/logo.png" alt="Success Compass" className="h-14 mx-auto mb-6 object-contain" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>Quiz Final</h1>
        <p className="text-gray-500 text-sm mb-8">Formation Coach de Vie &amp; Développement Personnel</p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { val: '40', label: 'Questions' },
            { val: '~20 min', label: 'Durée' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: '#f8fafc' }}>
              <div className="text-xl font-bold mb-1" style={{ color: NAVY }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setStep(fromSession ? 'questions' : 'info')}
          className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
          style={{ background: NAVY }}>
          Commencer <ChevronRight className="inline w-5 h-5" />
        </button>
      </div>
    </div>
  )

  /* ── INFO ── */
  if (step === 'info') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a4a8a 100%)` }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Votre identité</h2>
        <p className="text-gray-400 text-sm mb-6">Renseignez votre nom et prénom avant de commencer</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirst(e.target.value)}
              placeholder="Votre prénom"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLast(e.target.value)}
              placeholder="Votre nom"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <button
          onClick={() => setStep('questions')}
          disabled={!firstName.trim() || !lastName.trim()}
          className="mt-6 w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: NAVY }}>
          Démarrer le quiz
        </button>
      </div>
    </div>
  )

  /* ── QUESTIONS ── */
  if (step === 'questions') return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression</span>
              <span className="font-medium" style={{ color: NAVY }}>{answered}/{total}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(answered / total) * 100}%`, background: NAVY }} />
            </div>
          </div>
          <button
            onClick={submit}
            disabled={!allAnswered || saving}
            className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            style={{ background: NAVY }}>
            {saving ? 'Envoi…' : 'Terminer'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {QUIZ_QUESTIONS.map(q => {
          const chosen = answers[q.id]
          return (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: NAVY }}>
                  {q.id}
                </span>
                <p className="text-gray-800 font-medium text-sm leading-relaxed">{q.question}</p>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const selected = chosen === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => answer(q.id, idx)}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm"
                      style={{
                        borderColor: selected ? NAVY : '#e5e7eb',
                        background: selected ? NAVY + '0d' : 'white',
                        color: selected ? NAVY : '#374151',
                      }}>
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                        style={{
                          borderColor: selected ? NAVY : '#d1d5db',
                          background: selected ? NAVY : 'transparent',
                          color: selected ? 'white' : '#6b7280',
                        }}>
                        {OPTION_LETTERS[idx]}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div>
          <p className={`text-center text-sm font-semibold text-amber-600 mb-2 ${allAnswered ? 'invisible' : ''}`}>
            {total - answered} question{total - answered > 1 ? 's' : ''} restante{total - answered > 1 ? 's' : ''}
          </p>
          <button
            onClick={submit}
            disabled={!allAnswered || saving}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: NAVY }}>
            {saving ? 'Enregistrement…' : 'Soumettre le quiz'}
          </button>
        </div>
      </div>
    </div>
  )

  /* ── RESULT ── */
  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* confirmation + score card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: level.passed ? '#dcfce7' : '#fee2e2' }}>
            {level.passed
              ? <CheckCircle2 className="w-10 h-10" style={{ color: '#16a34a' }} />
              : <XCircle className="w-10 h-10" style={{ color: '#dc2626' }} />
            }
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Quiz complété</h2>
          <p className="text-gray-500 text-sm mb-6">
            Merci {firstName} {lastName}, vos réponses ont bien été enregistrées.
          </p>

          {/* Score principal */}
          <div className="rounded-2xl p-6 mb-4" style={{ background: level.bg }}>
            <div className="text-6xl font-extrabold mb-1" style={{ color: level.color }}>{pct}%</div>
            <div className="text-base font-semibold mb-2" style={{ color: level.color }}>
              {score} / {total} bonnes réponses
            </div>
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold" style={{ background: level.color, color: '#fff' }}>
              {level.label}
            </span>
          </div>

        </div>

        {/* correction détaillée */}
        <button
          onClick={() => setShowReview(r => !r)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-medium text-sm hover:border-gray-300 transition-colors">
          <BookOpen className="w-4 h-4" />
          {showReview ? 'Masquer' : 'Voir'} la correction détaillée
        </button>

        {showReview && (
          <div className="space-y-4">
            {QUIZ_QUESTIONS.map(q => {
              const chosen = answers[q.id]
              const isCorrect = chosen === q.correct
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start gap-2 mb-3">
                    {isCorrect
                      ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
                      : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                    }
                    <p className="text-sm font-medium text-gray-800">{q.id}. {q.question}</p>
                  </div>
                  <div className="ml-7 space-y-1.5">
                    {q.options.map((opt, idx) => {
                      const isChosen     = chosen === idx
                      const isCorrectOpt = q.correct === idx
                      let bg = 'transparent', color = '#6b7280', border = '#e5e7eb'
                      if (isCorrectOpt) { bg = '#dcfce7'; color = '#166534'; border = '#86efac' }
                      else if (isChosen && !isCorrectOpt) { bg = '#fee2e2'; color = '#991b1b'; border = '#fca5a5' }
                      return (
                        <div key={idx} className="flex items-start gap-2 px-3 py-2 rounded-lg border text-xs"
                          style={{ background: bg, color, borderColor: border }}>
                          <span className="font-bold flex-shrink-0">{OPTION_LETTERS[idx]}.</span>
                          <span>{opt}</span>
                          {isCorrectOpt && <span className="ml-auto flex-shrink-0 font-semibold">Correct</span>}
                          {isChosen && !isCorrectOpt && <span className="ml-auto flex-shrink-0 font-semibold">Votre réponse</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
