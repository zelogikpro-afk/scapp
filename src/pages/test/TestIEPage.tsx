import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  IE_QUESTIONS, IE_DIMENSIONS, SECTION_ORDER, getIELevel, getLevelLabel, getLevelColor,
  getDimContent, getDimInfo, type IEDimension,
} from '../../data/testIEQuestions'
import IEReportTemplate, { PAGE_W, PAGE_H } from './IEReportTemplate'

type Step = 'intro' | 'info' | 'questions' | 'result'

const SCALE = [
  { value: 1, label: 'Rarement ou jamais' },
  { value: 2, label: 'Parfois' },
  { value: 3, label: 'Souvent' },
  { value: 4, label: 'Toujours ou presque toujours' },
]

export default function TestIEPage() {
  const [step, setStep] = useState<Step>('intro')
  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [scores, setScores] = useState<Record<IEDimension, number>>({} as any)
  const reportRef = useRef<HTMLDivElement>(null)

  const totalAnswered = Object.keys(answers).length

  function calcScores() {
    const s: Record<IEDimension, number> = { conscience: 0, maitrise: 0, motivation: 0, empathie: 0, social: 0 }
    for (const q of IE_QUESTIONS) s[q.dimension] += answers[q.id] ?? 0
    return s
  }

  async function handleSubmit() {
    if (totalAnswered < 20) return
    setSaving(true)
    const computed = calcScores()
    setScores(computed)

    const { error } = await supabase.from('test_results').insert({
      first_name: info.firstName,
      last_name: info.lastName,
      email: info.email,
      phone: info.phone,
      test_type: 'ie',
      profile_key: null,
      dominant_profile: null,
      profile_name: null,
      scores: computed,
      answers,
    })

    if (error) console.error('IE insert error:', error)

    setSaving(false)
    setStep('result')
    window.scrollTo(0, 0)
  }

  async function handleDownloadPDF() {
    if (!reportRef.current) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const container = reportRef.current
      const pages = Array.from(container.children) as HTMLElement[]
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PAGE_W, PAGE_H] })

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: PAGE_W,
          height: PAGE_H,
        })
        const imgData = canvas.toDataURL('image/jpeg', 0.92)
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait')
        pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W, PAGE_H)
      }

      pdf.save(`Test IE - ${info.firstName} ${info.lastName}.pdf`)
    } catch (err) {
      console.error(err)
    }
    setDownloading(false)
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="Success Compass" className="w-20 h-20 object-contain mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Test d'Intelligence Émotionnelle</h1>
            <p className="text-blue-600 text-lg">Évaluez vos compétences émotionnelles en 5 dimensions</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
            <p className="text-gray-600 text-sm leading-relaxed">
              Ce test évalue votre intelligence émotionnelle à travers 5 dimensions clés : la conscience de soi,
              la maîtrise de soi, la motivation, l'empathie et les compétences sociales. Il comprend 20 questions
              et prend environ 10 minutes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {IE_DIMENSIONS.map(d => (
                <div key={d.key} className="flex items-start gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <div className="text-lg">{d.icon}</div>
                  <div className="text-gray-800 text-sm font-medium">{d.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-700 text-sm">
                <strong>Échelle :</strong> 1 = Rarement / 2 = Parfois / 3 = Souvent / 4 = Toujours
              </p>
            </div>
            <button
              onClick={() => setStep('info')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Commencer le test
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── INFO ───────────────────────────────────────────────────────────────────
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Success Compass" className="w-16 h-16 object-contain mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Vos informations</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prénom *</label>
                <input type="text" value={info.firstName} onChange={e => setInfo({ ...info, firstName: e.target.value })}
                  placeholder="Votre prénom"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom *</label>
                <input type="text" value={info.lastName} onChange={e => setInfo({ ...info, lastName: e.target.value })}
                  placeholder="Votre nom"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
              <input type="email" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })}
                placeholder="votre@email.com"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone</label>
              <input type="tel" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })}
                placeholder="+212 6XX XXX XXX"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <button
              onClick={() => setStep('questions')}
              disabled={!info.firstName || !info.lastName || !info.email}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-all duration-200 mt-2"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── QUESTIONS ──────────────────────────────────────────────────────────────
  if (step === 'questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Success Compass" className="w-12 h-12 object-contain mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Test d'Intelligence Émotionnelle</h2>
            <p className="text-gray-500 text-sm mt-1">{totalAnswered} / 20 questions répondues</p>
            <div className="mt-3 h-1.5 bg-gray-200 rounded-full max-w-xs mx-auto">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(totalAnswered / 20) * 100}%` }} />
            </div>
          </div>

          <div className="space-y-8">
            {SECTION_ORDER.map((dim, si) => {
              const dimInfo = getDimInfo(dim)
              const questions = IE_QUESTIONS.filter(q => q.dimension === dim)
              return (
                <div key={dim} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="mb-5">
                    <div className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">Section {si + 1}</div>
                    <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                      <span>{dimInfo.icon}</span> {dimInfo.label}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {questions.map(q => (
                      <div key={q.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                        <p className="text-gray-700 text-sm mb-3">{q.text}</p>
                        <div className="flex gap-2">
                          {SCALE.map(s => (
                            <button key={s.value} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: s.value }))}
                              title={s.label}
                              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 border
                                ${answers[q.id] === s.value
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}
                            >
                              {s.value}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-1 px-1">
                          <span className="text-gray-400 text-xs">Rarement</span>
                          <span className="text-gray-400 text-xs">Toujours</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            {totalAnswered < 20 && (
              <p className="text-amber-600 text-sm mb-4">
                {20 - totalAnswered} question{20 - totalAnswered > 1 ? 's' : ''} restante{20 - totalAnswered > 1 ? 's' : ''}
              </p>
            )}
            <button onClick={handleSubmit} disabled={totalAnswered < 20 || saving}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-all duration-200">
              {saving ? 'Calcul en cours…' : 'Voir mes résultats'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Result header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Success Compass" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Vos résultats</h1>
          <p className="text-blue-600 text-lg">{info.firstName} {info.lastName}</p>
          <p className="text-gray-500 text-sm mt-1">Score global : {totalScore} / 80</p>
        </div>

        {/* Score overview card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-gray-900 font-bold text-lg mb-5">Vue d'ensemble</h2>
          <div className="space-y-4">
            {SECTION_ORDER.map(dim => {
              const dimInfo = getDimInfo(dim)
              const score = scores[dim] ?? 0
              const level = getIELevel(score)
              const color = getLevelColor(level)
              return (
                <div key={dim}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
                      <span>{dimInfo.icon}</span> {dimInfo.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border"
                        style={{ backgroundColor: color + '20', color, borderColor: color + '50' }}>
                        {getLevelLabel(level)}
                      </span>
                      <span className="text-gray-900 text-sm font-bold">{score}/16</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(score / 16) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Per dimension detail */}
        <div className="space-y-5 mb-8">
          {SECTION_ORDER.map((dim, i) => {
            const dimInfo = getDimInfo(dim)
            const score = scores[dim] ?? 0
            const level = getIELevel(score)
            const color = getLevelColor(level)
            const content = getDimContent(dim, level)
            return (
              <div key={dim} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: '#1B2A4A' }}>
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                        <span>{dimInfo.icon}</span> {dimInfo.label}
                      </h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block"
                        style={{ backgroundColor: color + '20', color, borderColor: color + '50' }}>
                        {getLevelLabel(level)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color }}>
                      {score}<span className="text-sm text-gray-400">/16</span>
                    </div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-1.5 bg-gray-100 rounded-full mb-4">
                  <div className="h-full rounded-full" style={{ width: `${(score / 16) * 100}%`, backgroundColor: color }} />
                </div>

                {/* Description */}
                <div className="rounded-xl p-4 mb-4 border-l-4 bg-gray-50" style={{ borderLeftColor: color }}>
                  <p className="text-gray-600 text-sm leading-relaxed">{content.description}</p>
                </div>

                {/* Plan */}
                <div className="mb-4">
                  <div className="text-gray-800 font-semibold text-sm mb-3">{content.planTitle}</div>
                  <div className="space-y-2">
                    {content.plan.map((item, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: '#1B2A4A' }}>
                          {j + 1}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercice */}
                <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
                  <div className="text-xs font-bold uppercase tracking-wider mb-2 text-blue-700">
                    Exercice recommandé
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{content.exercice}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Download button */}
        <div className="text-center mb-10">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-10 py-4 text-white font-bold rounded-xl text-base transition-all duration-200 shadow-md hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1B2A4A' }}
          >
            {downloading ? 'Génération du PDF…' : 'Télécharger mon rapport PDF'}
          </button>
          <p className="text-gray-400 text-xs mt-2">Rapport personnalisé au format du template Success Compass</p>
        </div>

        <p className="text-center text-gray-400 text-xs">
          Success Compass Academy — Test d'Intelligence Émotionnelle — {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Hidden PDF template — rendered off-screen */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, opacity: 0, pointerEvents: 'none' }}>
        <IEReportTemplate
          ref={reportRef}
          firstName={info.firstName}
          lastName={info.lastName}
          scores={scores}
        />
      </div>
    </div>
  )
}
