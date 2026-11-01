import { useState, useEffect } from 'react'
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

const TOTAL = QUESTIONS.length

export default function TestMappingPage() {
  const [step, setStep]         = useState<Step>('intro')
  const [info, setInfo]         = useState<ParticipantInfo>({ firstName: '', lastName: '', email: '', phone: '' })
  const [answers, setAnswers]   = useState<Record<number, { profile: ProfileKey; label: string }>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [result, setResult]     = useState<ProfileKey | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [fromSession, setFromSession] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)

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

  function selectOption(qId: number, profile: ProfileKey, label: string, isLast: boolean) {
    if (transitioning) return
    const newAnswers = { ...answers, [qId]: { profile, label } }
    setAnswers(newAnswers)
    if (!isLast) {
      setTransitioning(true)
      setTimeout(() => {
        setCurrentQ(q => q + 1)
        setTransitioning(false)
      }, 220)
    } else {
      submitDirect(newAnswers)
    }
  }

  function calculateResult(finalAnswers: Record<number, { profile: ProfileKey; label: string }>): ProfileKey {
    const counts: Record<ProfileKey, number> = {
      sentinelle: 0, gardien: 0, alchimiste: 0, navigateur: 0,
      explorateur: 0, architecte: 0, marcheur: 0,
    }
    Object.values(finalAnswers).forEach(a => { counts[a.profile]++ })
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as ProfileKey
  }

  async function submitDirect(finalAnswers: Record<number, { profile: ProfileKey; label: string }>) {
    setSaving(true)
    const dominant = calculateResult(finalAnswers)
    setResult(dominant)
    setSaving(false)
    setStep('result')
    supabase.from('test_results').insert({
      participant_id: participantId,
      first_name: info.firstName, last_name: info.lastName,
      email: info.email, phone: info.phone,
      test_type: 'mapping', profile_key: dominant,
      dominant_profile: dominant, profile_name: PROFILE_NAMES[dominant],
      answers: Object.fromEntries(Object.entries(finalAnswers).map(([k, v]) => [k, v.label])),
    }).then(({ error }) => { if (error) console.error('Mapping insert error:', error) })
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

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-white text-center">
            <img src="/logo.png" alt="Success Compass" className="w-20 h-20 object-contain mx-auto mb-5 drop-shadow-lg" />
            <h1 className="text-3xl font-bold mb-3">Découvrez votre Profil</h1>
            <p className="text-indigo-100 text-lg">Test de Mapping des Profils de Personnalité</p>
          </div>
          <div className="px-8 py-8">
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed mb-8">
              <p>Ce test vous permettra de <strong className="text-gray-800">découvrir votre profil dominant</strong> parmi 8 profils uniques, chacun incarnant une façon particulière d'être, de ressentir et d'agir dans le monde.</p>
              <p>Il comprend <strong className="text-gray-800">{TOTAL} questions</strong>. Répondez spontanément, en choisissant la réponse qui vous ressemble le plus — il n'y a ni bonne ni mauvaise réponse.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {Object.values(PROFILE_NAMES).map(name => (
                <div key={name} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 font-medium">{name}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(fromSession ? 'questions' : 'info')}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-md">
              Commencer le test →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── INFO ──────────────────────────────────────────────────────────────────
  if (step === 'info') return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Vos informations</h2>
        <p className="text-sm text-gray-500 mb-6">Ces informations permettent de vous envoyer votre rapport.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Prénom *</label>
              <input value={info.firstName} onChange={e => setInfo(p => ({ ...p, firstName: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Votre prénom" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom *</label>
              <input value={info.lastName} onChange={e => setInfo(p => ({ ...p, lastName: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Votre nom" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
            <input type="email" value={info.email} onChange={e => setInfo(p => ({ ...p, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone *</label>
            <input type="tel" value={info.phone} onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+212 6XX XXX XXX" />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={() => setStep('intro')} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            ← Retour
          </button>
          <button disabled={!infoValid} onClick={() => setStep('questions')}
            className="flex-grow py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
            Démarrer le test →
          </button>
        </div>
      </div>
    </div>
  )

  // ── QUESTIONS (une par une) ────────────────────────────────────────────────
  if (step === 'questions') {
    if (saving) return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-800 font-bold">Calcul de votre profil…</p>
        </div>
      </div>
    )

    const q = QUESTIONS[currentQ]
    const isLast = currentQ === TOTAL - 1
    const selected = answers[q.id]
    const pct = Math.round(((currentQ + (selected !== undefined ? 1 : 0)) / TOTAL) * 100)

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col"
        style={{ opacity: transitioning ? 0.35 : 1, transition: 'opacity 0.15s' }}>
        {/* Progress header */}
        <div className="bg-white border-b border-gray-100 shadow-sm px-5 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-semibold text-gray-700">Mapping des Profils</span>
              <span className="font-bold text-indigo-600">{currentQ + 1} / {TOTAL}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="max-w-2xl w-full">
            {/* Section badge */}
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600">{q.section}</span>
            </div>

            <p className="text-lg font-bold text-gray-800 leading-snug mb-6">{q.text}</p>

            <div className="space-y-2.5">
              {q.options.map(opt => {
                const isSelected = selected?.label === opt.label
                return (
                  <button key={opt.label} onClick={() => selectOption(q.id, opt.profile, opt.label, isLast)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-semibold'
                        : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50 text-gray-600'
                    }`}>
                    <span className="font-bold text-indigo-400 mr-2">{opt.label}.</span>
                    {opt.text}
                  </button>
                )
              })}
            </div>

            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(q => q - 1)}
                className="mt-5 text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors">
                ← Question précédente
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (step === 'result' && result) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white text-center">
            <img src="/logo.png" alt="Success Compass" className="w-16 h-16 object-contain mx-auto mb-4 drop-shadow-lg" />
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
              <button onClick={downloadPDF} disabled={downloading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 flex items-center justify-center gap-3">
                {downloading ? (
                  <><span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Téléchargement…</>
                ) : <>📄 Télécharger mon rapport complet</>}
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
    </div>
  )

  return null
}
