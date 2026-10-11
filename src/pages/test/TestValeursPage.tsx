import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { VALEURS, VALEURS_QUESTIONS, VALEURS_SCALE, getAllValeurScores } from '../../data/testValeursData'
import { CheckCircle2, ChevronRight, Download } from 'lucide-react'
import ValeursReportTemplate, { PAGE_W, PAGE_H, getProfileText } from './ValeursReportTemplate'

type Step = 'intro' | 'info' | 'questions' | 'result'

const NAVY = '#1D3462'
const GOLD = '#F5C542'

export default function TestValeursPage() {
  const [step, setStep]       = useState<Step>('intro')
  const [firstName, setFirst] = useState('')
  const [lastName, setLast]   = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const reportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving]   = useState(false)
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
  const total       = VALEURS_QUESTIONS.length
  const allAnswered = answered === total

  function rate(qId: number, val: number) {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  async function submit() {
    if (!allAnswered) return
    setSaving(true)
    const scores = getAllValeurScores(answers)
    const sorted = [...VALEURS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
    const top = sorted[0]

    await supabase.from('test_results').insert({
      test_type:        'valeurs',
      participant_id:   participantId,
      first_name:       firstName,
      last_name:        lastName,
      scores,
      answers,
      dominant_profile: top.key,
    })
    setSaving(false)
    setStep('result')
  }

  async function downloadPDF() {
    if (!reportRef.current) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(reportRef.current.children[0] as HTMLElement, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H,
      })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PAGE_W, PAGE_H] })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_W, PAGE_H)
      pdf.save(`TEST DES VALEURS_${firstName} ${lastName?.toUpperCase()}.pdf`)
    } catch {
      // silent
    }
    setDownloading(false)
  }

  /* ── INTRO ── */
  if (step === 'intro') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a4a8a 100%)` }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center">
        <img src="/logo.png" alt="Success Compass" className="h-14 mx-auto mb-6 object-contain" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>Test des Valeurs</h1>
        <p className="text-gray-500 text-sm mb-8">Découvrez vos valeurs fondamentales</p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { val: '45', label: 'Affirmations' },
            { val: '~10 min', label: 'Durée' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: '#f8fafc' }}>
              <div className="text-xl font-bold mb-1" style={{ color: NAVY }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="text-left bg-gray-50 rounded-2xl p-4 mb-8">
          <p className="text-sm text-gray-600 font-medium mb-3">Échelle de notation :</p>
          <div className="space-y-1.5">
            {VALEURS_SCALE.map(s => (
              <div key={s.value} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: NAVY }}>{s.value}</span>
                <span className="text-sm text-gray-600">{s.label}</span>
              </div>
            ))}
          </div>
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
            <input type="text" value={firstName} onChange={e => setFirst(e.target.value)}
              placeholder="Votre prénom"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input type="text" value={lastName} onChange={e => setLast(e.target.value)}
              placeholder="Votre nom"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        </div>

        <button onClick={() => setStep('questions')}
          disabled={!firstName.trim() || !lastName.trim()}
          className="mt-6 w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: NAVY }}>
          Démarrer le test
        </button>
      </div>
    </div>
  )

  /* ── QUESTIONS ── */
  if (step === 'questions') return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* sticky progress */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression</span>
              <span className="font-medium" style={{ color: NAVY }}>{answered}/{total}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(answered / total) * 100}%`, background: NAVY }} />
            </div>
          </div>
          <button onClick={submit} disabled={!allAnswered || saving}
            className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            style={{ background: NAVY }}>
            {saving ? 'Envoi…' : 'Terminer'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* group by valeur */}
        {VALEURS.map(valeur => (
          <div key={valeur.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50" style={{ background: valeur.bg }}>
              <span className="text-sm font-semibold" style={{ color: valeur.color }}>{valeur.label}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {valeur.questions.map(qId => {
                const q = VALEURS_QUESTIONS.find(q => q.id === qId)!
                const chosen = answers[qId]
                return (
                  <div key={qId} className="px-5 py-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                        style={{ background: NAVY }}>{qId}</span>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{q.question}</p>
                    </div>
                    <div className="flex gap-2 ml-9">
                      {VALEURS_SCALE.map(s => {
                        const selected = chosen === s.value
                        return (
                          <button key={s.value} onClick={() => rate(qId, s.value)}
                            title={s.label}
                            className="flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all"
                            style={{
                              borderColor: selected ? valeur.color : '#e5e7eb',
                              background:  selected ? valeur.color : 'white',
                              color:       selected ? 'white'       : '#9ca3af',
                            }}>
                            {s.value}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex justify-between ml-9 mt-1">
                      <span className="text-xs text-gray-400">Pas important</span>
                      <span className="text-xs text-gray-400">Très important</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div>
          <p className={`text-center text-sm font-semibold text-amber-600 mb-2 ${allAnswered ? 'invisible' : ''}`}>
            {total - answered} affirmation{total - answered > 1 ? 's' : ''} restante{total - answered > 1 ? 's' : ''}
          </p>
          <button onClick={submit} disabled={!allAnswered || saving}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: NAVY }}>
            {saving ? 'Enregistrement…' : 'Soumettre le test'}
          </button>
        </div>
      </div>
    </div>
  )

  /* ── RESULT ── */
  const scores = getAllValeurScores(answers)
  const sorted = [...VALEURS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
  const top5 = sorted.slice(0, 5)
  const profileText = getProfileText(firstName, top5)

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* Confirmation */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0f4ff' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: NAVY }} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>Test complété</h2>
          <p className="text-gray-500 text-sm">
            Merci {firstName} {lastName}, vos réponses ont bien été enregistrées.
          </p>
        </div>

        {/* Résultats — style PDF */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-0.5">Analyse</p>
            <p className="text-2xl font-black" style={{ color: NAVY, letterSpacing: 1 }}>DES VALEURS</p>
          </div>

          {/* Subtitle with left border */}
          <div className="mx-6 mb-5 border-l-4 pl-3" style={{ borderColor: NAVY }}>
            <span className="font-bold text-sm" style={{ color: NAVY }}>
              Voici vos cinq valeurs Fondamentales :
            </span>
          </div>

          {/* Top 5 — centered bold names with separators */}
          <div className="px-6">
            {top5.map((v) => (
              <div key={v.key}>
                <p className="text-center font-bold text-base py-3" style={{ color: NAVY }}>
                  {v.label}
                </p>
                <div className="h-px" style={{ background: NAVY }} />
              </div>
            ))}
          </div>

          {/* Profile text */}
          <p className="text-center text-sm text-gray-600 leading-relaxed px-8 py-6">
            {profileText}
          </p>
        </div>

        {/* Download button */}
        <button onClick={downloadPDF} disabled={downloading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: NAVY }}>
          <Download className="w-4 h-4" />
          {downloading ? 'Génération du PDF…' : 'Télécharger mon rapport PDF'}
        </button>
      </div>

      {/* Hidden PDF template */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
        <ValeursReportTemplate
          ref={reportRef}
          firstName={firstName}
          lastName={lastName}
          scores={scores as Record<string, number>}
        />
      </div>
    </div>
  )
}
