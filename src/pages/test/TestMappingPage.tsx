import { useState, useRef, useEffect } from 'react'
import { QUESTIONS, PROFILE_NAMES, PROFILE_DESCRIPTIONS, PROFILE_PDF, type ProfileKey } from '../../data/testMappingQuestions'
import { supabase } from '../../lib/supabase'

const SUPABASE_URL = 'https://twcqvpgpzayjxiwzzesb.supabase.co'

type Step = 'intro' | 'info' | 'questions' | 'result'

interface ParticipantInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const SECTIONS = [...new Set(QUESTIONS.map(q => q.section))]

export default function TestMappingPage() {
  const [step, setStep] = useState<Step>('intro')
  const [info, setInfo] = useState<ParticipantInfo>({ firstName: '', lastName: '', email: '', phone: '' })
  const [answers, setAnswers] = useState<Record<number, { profile: ProfileKey; label: string }>>({})
  const [currentSection, setCurrentSection] = useState(0)
  const [result, setResult] = useState<ProfileKey | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fromSession, setFromSession] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sc_learner_session')
      if (!raw) return
      const s = JSON.parse(raw)
      const parts = (s.participantName || '').trim().split(' ')
      setInfo({ firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', email: s.email || '', phone: s.phone || '' })
      setParticipantId(s.participantId || null)
      setFromSession(true)
    } catch { /* ignore */ }
  }, [])

  const sectionQuestions = QUESTIONS.filter(q => q.section === SECTIONS[currentSection])
  const totalAnswered = QUESTIONS.filter(q => answers[q.id] != null).length
  const progress = Math.round((totalAnswered / QUESTIONS.length) * 100)

  const sectionAnswered = sectionQuestions.every(q => answers[q.id] != null)

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleAnswer(questionId: number, profile: ProfileKey, label: string) {
    setAnswers(prev => ({ ...prev, [questionId]: { profile, label } }))
  }

  function nextSection() {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(s => s + 1)
      scrollTop()
    } else {
      submitTest()
    }
  }

  function prevSection() {
    if (currentSection > 0) {
      setCurrentSection(s => s - 1)
      scrollTop()
    }
  }

  function calculateResult(): ProfileKey {
    const counts: Record<ProfileKey, number> = {
      sentinelle: 0, gardien: 0, alchimiste: 0, navigateur: 0,
      explorateur: 0, architecte: 0, marcheur: 0,
    }
    Object.values(answers).forEach(a => { counts[a.profile]++ })
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as ProfileKey
  }

  async function submitTest() {
    setSaving(true)
    const dominant = calculateResult()
    setResult(dominant)

    const { error } = await supabase.from('test_results').insert({
      participant_id: participantId,
      first_name: info.firstName,
      last_name: info.lastName,
      email: info.email,
      phone: info.phone,
      test_type: 'mapping',
      profile_key: dominant,
      dominant_profile: dominant,
      profile_name: PROFILE_NAMES[dominant],
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.label])),
    })
    if (error) console.error('Mapping insert error:', error)

    setSaving(false)
    setStep('result')
    scrollTop()
  }

  async function downloadPDF() {
    if (!result) return
    const filename = PROFILE_PDF[result]
    if (!filename) return

    setDownloading(true)
    try {
      const url = `${SUPABASE_URL}/storage/v1/object/public/test-profiles/${filename}`
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${PROFILE_NAMES[result]}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (_) {}
    setDownloading(false)
  }

  const infoValid = info.firstName.trim() && info.lastName.trim() && info.email.trim() && info.phone.trim()

  return (
    <div ref={topRef} className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="Success Compass" className="w-10 h-10 object-contain" />
          <div>
            <div className="text-sm font-semibold text-gray-800">Success Compass</div>
            <div className="text-xs text-gray-400">Coaching & Formation</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* INTRO */}
        {step === 'intro' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-white text-center">
              <div className="flex items-center justify-center mx-auto mb-5">
                <img src="/logo.png" alt="Success Compass" className="w-20 h-20 object-contain drop-shadow-lg" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Découvrez votre Profil</h1>
              <p className="text-indigo-100 text-lg">Test de Mapping des Profils de Personnalité</p>
            </div>
            <div className="px-8 py-8">
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed mb-8">
                <p>Ce test vous permettra de <strong className="text-gray-800">découvrir votre profil dominant</strong> parmi 8 profils uniques, chacun incarnant une façon particulière d'être, de ressentir et d'agir dans le monde.</p>
                <p>Il comprend <strong className="text-gray-800">64 questions</strong> réparties en 25 thèmes. Répondez spontanément, en choisissant la réponse qui vous ressemble le plus — il n'y a ni bonne ni mauvaise réponse.</p>
                <p>À la fin, vous recevrez <strong className="text-gray-800">votre rapport personnalisé</strong> décrivant votre profil en profondeur.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  'La Sentinelle des Cimes',
                  'Le Gardien des Racines',
                  "L'Alchimiste des Émotions",
                  'Le Navigateur des Profondeurs',
                  "L'Explorateur des Horizons",
                  "L'Architecte des Ponts",
                  'Le Marcheur des Tempêtes',
                  'Le Gardien des Flammes',
                ].map(name => (
                  <div key={name} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 font-medium">{name}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(fromSession ? 'questions' : 'info')}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-md"
              >
                Commencer le test →
              </button>
            </div>
          </div>
        )}

        {/* INFO */}
        {step === 'info' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Vos informations</h2>
            <p className="text-sm text-gray-500 mb-6">Ces informations permettent de vous envoyer votre rapport.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Prénom *</label>
                  <input
                    value={info.firstName}
                    onChange={e => setInfo(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom *</label>
                  <input
                    value={info.lastName}
                    onChange={e => setInfo(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={info.email}
                  onChange={e => setInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone *</label>
                <input
                  type="tel"
                  value={info.phone}
                  onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('intro')}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                ← Retour
              </button>
              <button
                disabled={!infoValid}
                onClick={() => setStep('questions')}
                className="flex-2 flex-grow py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Démarrer le test →
              </button>
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {step === 'questions' && (
          <div>
            {/* Progress bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  Section {currentSection + 1} / {SECTIONS.length} — <span className="font-medium text-gray-700">{SECTIONS[currentSection]}</span>
                </span>
                <span className="text-xs font-medium text-indigo-600">{progress}% complété</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-1 mt-2">
                {SECTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      i < currentSection ? 'bg-indigo-500' : i === currentSection ? 'bg-purple-400' : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {sectionQuestions.map((q, qi) => (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <p className="text-sm font-semibold text-gray-800 mb-4">
                    <span className="text-indigo-500 font-bold mr-2">{qi + 1}.</span>
                    {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => handleAnswer(q.id, opt.profile, opt.label)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          answers[q.id]?.label === opt.label
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium'
                            : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="font-semibold text-indigo-400 mr-2">{opt.label}.</span>
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {currentSection > 0 && (
                <button
                  onClick={prevSection}
                  className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Précédent
                </button>
              )}
              <button
                disabled={!sectionAnswered || saving}
                onClick={nextSection}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calcul en cours…
                  </>
                ) : currentSection < SECTIONS.length - 1 ? (
                  'Section suivante →'
                ) : (
                  'Voir mon résultat 🎯'
                )}
              </button>
            </div>

            <p className={`text-center text-xs text-gray-400 mt-3 ${sectionAnswered ? 'invisible' : ''}`}>
              Répondez à toutes les questions de cette section pour continuer
            </p>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && result && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white text-center">
                <div className="flex items-center justify-center mx-auto mb-4">
                  <img src="/logo.png" alt="Success Compass" className="w-16 h-16 object-contain drop-shadow-lg" />
                </div>
                <p className="text-indigo-200 text-sm uppercase tracking-widest mb-2">Votre profil dominant</p>
                <h1 className="text-3xl font-bold">{PROFILE_NAMES[result]}</h1>
                <p className="text-indigo-100 mt-3 text-sm max-w-md mx-auto">{PROFILE_DESCRIPTIONS[result]}</p>
              </div>

              <div className="px-8 py-8">
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Félicitations ! Votre test est complété. Votre profil dominant a été identifié et votre rapport personnalisé est prêt.
                  Ce rapport vous donnera une analyse approfondie de votre archétype, vos forces, vos défis et votre potentiel de croissance.
                </p>

                {PROFILE_PDF[result] ? (
                  <button
                    onClick={downloadPDF}
                    disabled={downloading}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 flex items-center justify-center gap-3"
                  >
                    {downloading ? (
                      <>
                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Téléchargement…
                      </>
                    ) : (
                      <>
                        📄 Télécharger mon rapport complet
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-4 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl text-center text-sm">
                    📋 Votre rapport personnalisé sera disponible prochainement
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-4">
                  Votre résultat a été enregistré. L'équipe Success Compass vous contactera pour vous accompagner dans votre parcours.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
