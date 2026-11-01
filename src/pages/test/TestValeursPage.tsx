import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { VALEURS, VALEURS_QUESTIONS, getAllValeurScores } from '../../data/testValeursData'
import { Download } from 'lucide-react'
import ValeursReportTemplate, { PAGE_W, PAGE_H, getProfileText } from './ValeursReportTemplate'

type Step = 'intro' | 'info' | 'questions' | 'result'

const NAVY = '#1D3462'
const TOTAL = VALEURS_QUESTIONS.length

// Find which valeur a question belongs to
function getValeurForQuestion(qId: number) {
  return VALEURS.find(v => v.questions.includes(qId))!
}

export default function TestValeursPage() {
  const [step, setStep]         = useState<Step>('intro')
  const [firstName, setFirst]   = useState('')
  const [lastName, setLast]     = useState('')
  const [answers, setAnswers]   = useState<Record<number, number>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [fromSession, setFromSession] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

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

  function selectAnswer(qId: number, val: number, isLast: boolean) {
    if (transitioning) return
    const newAnswers = { ...answers, [qId]: val }
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

  async function submitDirect(finalAnswers: Record<number, number>) {
    setSaving(true)
    const scores = getAllValeurScores(finalAnswers)
    const sorted = [...VALEURS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
    const top = sorted[0]
    setSaving(false)
    setStep('result')
    supabase.from('test_results').insert({
      test_type: 'valeurs', participant_id: participantId,
      first_name: firstName, last_name: lastName,
      scores, answers: finalAnswers, dominant_profile: top.key,
    }).then(({ error }) => { if (error) console.error('Valeurs insert error:', error) })
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
    } catch { /* silent */ }
    setDownloading(false)
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
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
          <p className="text-sm text-gray-600 font-medium mb-2">Échelle de notation :</p>
          <div className="flex gap-2 flex-wrap">
            {[1,2,3,4,5].map(v => (
              <span key={v} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: NAVY }}>{v}</span>
                {v === 1 ? 'Pas important' : v === 5 ? 'Très important' : ''}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => setStep(fromSession ? 'questions' : 'info')}
          className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
          style={{ background: NAVY }}>
          Commencer →
        </button>
      </div>
    </div>
  )

  // ── INFO ──────────────────────────────────────────────────────────────────
  if (step === 'info') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a4a8a 100%)` }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Votre identité</h2>
        <p className="text-gray-400 text-sm mb-6">Renseignez votre nom et prénom avant de commencer</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input type="text" value={firstName} onChange={e => setFirst(e.target.value)} placeholder="Votre prénom"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input type="text" value={lastName} onChange={e => setLast(e.target.value)} placeholder="Votre nom"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        </div>
        <button onClick={() => setStep('questions')} disabled={!firstName.trim() || !lastName.trim()}
          className="mt-6 w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: NAVY }}>
          Démarrer le test
        </button>
      </div>
    </div>
  )

  // ── QUESTIONS (une par une) ────────────────────────────────────────────────
  if (step === 'questions') {
    if (saving) return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div style={{ width: 48, height: 48, border: `4px solid ${NAVY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: NAVY, fontWeight: 700 }}>Analyse de vos valeurs…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )

    const q = VALEURS_QUESTIONS[currentQ]
    const valeur = getValeurForQuestion(q.id)
    const isLast = currentQ === TOTAL - 1
    const selected = answers[q.id]
    const pct = Math.round(((currentQ + (selected !== undefined ? 1 : 0)) / TOTAL) * 100)

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', opacity: transitioning ? 0.35 : 1, transition: 'opacity 0.15s' }}>
        {/* Progress header */}
        <div style={{ background: NAVY, padding: '14px 20px', flexShrink: 0 }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 13, marginBottom: 8 }}>
              <span style={{ opacity: 0.7, fontWeight: 600 }}>Test des Valeurs</span>
              <span style={{ fontWeight: 700 }}>{currentQ + 1} / {TOTAL}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: valeur.color, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Question card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
          <div style={{ maxWidth: 560, width: '100%' }}>
            {/* Valeur badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: valeur.bg, borderRadius: 20, padding: '5px 14px', marginBottom: 20, border: `1.5px solid ${valeur.color}22` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: valeur.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: valeur.color }}>{valeur.label}</span>
            </div>

            {/* Affirmation */}
            <p style={{ fontSize: 20, fontWeight: 700, color: NAVY, lineHeight: 1.5, marginBottom: 8 }}>
              {q.question}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 28 }}>
              Dans quelle mesure cette affirmation vous correspond-elle ?
            </p>

            {/* Rating buttons 1-5 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(val => {
                const isSelected = selected === val
                return (
                  <button key={val} onClick={() => selectAnswer(q.id, val, isLast)}
                    style={{
                      flex: 1, aspectRatio: '1', borderRadius: 14, border: 'none',
                      background: isSelected ? valeur.color : valeur.bg,
                      color: isSelected ? '#fff' : valeur.color,
                      fontSize: 18, fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'background 0.15s, transform 0.1s',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isSelected ? `0 4px 12px ${valeur.color}44` : 'none',
                    }}>
                    {val}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingInline: 4 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Pas important</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Très important</span>
            </div>

            {/* Back button */}
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(q => q - 1)}
                style={{ marginTop: 20, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                ← Affirmation précédente
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  const scores = getAllValeurScores(answers)
  const sorted = [...VALEURS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
  const top5 = sorted.slice(0, 5)
  const profileText = getProfileText(firstName, top5)

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0f4ff' }}>
            <span style={{ fontSize: 28 }}>✓</span>
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>Test complété</h2>
          <p className="text-gray-500 text-sm">
            Merci {firstName} {lastName}, vos réponses ont bien été enregistrées.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-0.5">Analyse</p>
            <p className="text-2xl font-black" style={{ color: NAVY, letterSpacing: 1 }}>DES VALEURS</p>
          </div>
          <div className="mx-6 mb-5 border-l-4 pl-3" style={{ borderColor: NAVY }}>
            <span className="font-bold text-sm" style={{ color: NAVY }}>
              Voici vos cinq valeurs Fondamentales :
            </span>
          </div>
          <div className="px-6">
            {top5.map((v) => (
              <div key={v.key}>
                <p className="text-center font-bold text-base py-3" style={{ color: NAVY }}>{v.label}</p>
                <div className="h-px" style={{ background: NAVY }} />
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 leading-relaxed px-8 py-6">{profileText}</p>
        </div>

        <button onClick={downloadPDF} disabled={downloading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: NAVY }}>
          <Download className="w-4 h-4" />
          {downloading ? 'Génération du PDF…' : 'Télécharger mon rapport PDF'}
        </button>
      </div>

      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
        <ValeursReportTemplate ref={reportRef} firstName={firstName} lastName={lastName} scores={scores as Record<string, number>} />
      </div>
    </div>
  )
}
