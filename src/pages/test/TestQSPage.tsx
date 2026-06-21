import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  QS_QUESTIONS, QS_PILIER_ORDER, getPilierInfo, getPilierScore,
  getTop5Forces, getBottom5Axes, getQSLevel,
  type QSPilier,
} from '../../data/testQSQuestions'
import QSReportTemplate, { PAGE_W, PAGE_H } from './QSReportTemplate'

type Step = 'intro' | 'info' | 'questions' | 'result'

export default function TestQSPage() {
  const [step, setStep]         = useState<Step>('intro')
  const [info, setInfo]         = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [answers, setAnswers]   = useState<Record<number, number>>({})
  const [saving, setSaving]     = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [scores, setScores]     = useState<Record<QSPilier, number>>({} as any)
  const reportRef = useRef<HTMLDivElement>(null)

  const totalAnswered = Object.keys(answers).length
  const totalQuestions = QS_QUESTIONS.length // 45

  function calcScores(): Record<QSPilier, number> {
    const s = {} as Record<QSPilier, number>
    for (const p of QS_PILIER_ORDER) s[p] = getPilierScore(p, answers)
    return s
  }

  async function handleSubmit() {
    if (totalAnswered < totalQuestions) return
    setSaving(true)
    const computed = calcScores()
    setScores(computed)

    const total = QS_PILIER_ORDER.reduce((acc, p) => acc + computed[p], 0)
    const level = getQSLevel(total)

    await supabase.from('test_results').insert({
      first_name: info.firstName,
      last_name: info.lastName,
      email: info.email,
      phone: info.phone,
      test_type: 'qs',
      profile_key: null,
      dominant_profile: level.label,
      profile_name: `QS ${level.label} (${total}/450)`,
      scores: computed,
      answers,
    })

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
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H,
        })
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait')
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_W, PAGE_H)
      }
      pdf.save(`TEST QS_${info.firstName} ${info.lastName.toUpperCase()}.pdf`)
    } catch (e) {
      console.error('PDF error:', e)
    }
    setDownloading(false)
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Success Compass" className="w-16 h-16 object-contain mx-auto mb-4" />
            <div className="text-sm font-medium text-teal-600 uppercase tracking-widest mb-2">Test de mesure</div>
            <h1 className="text-4xl font-black text-navy-900 leading-tight" style={{ color: '#1D3562' }}>
              Quotient<br />
              <span className="text-5xl">DE SUCCÈS</span>
            </h1>
            <p className="text-gray-600 mt-4 text-sm leading-relaxed max-w-md mx-auto">
              Ce test évalue votre Quotient de Succès (QS) à travers <strong>15 piliers</strong> fondamentaux
              répartis en 7 piliers principaux et 8 piliers secondaires.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ce que vous allez mesurer</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['🧠', 'Intelligence Émotionnelle'],
                ['💪', 'Résilience'],
                ['🗣️', 'Communication'],
                ['♟️', 'Pensée Stratégique'],
                ['🔄', 'Adaptabilité'],
                ['🎯', 'Détermination'],
                ['⚡', 'Discipline'],
                ['✨', 'Créativité'],
                ['⏱️', 'Gestion du Temps'],
                ['👑', 'Leadership'],
                ['🦁', 'Confiance en Soi'],
                ['⚖️', 'Éthique & Intégrité'],
                ['🌊', 'Gestion du Stress'],
                ['🚀', 'Auto-motivation'],
                ['☀️', 'Optimisme'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl border border-teal-100 p-4 mb-6 text-sm text-teal-800">
            <strong>45 questions</strong> · Notation de 1 à 10 · Durée estimée : <strong>15–20 min</strong>
          </div>

          <button
            onClick={() => setStep('info')}
            className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 active:scale-98"
            style={{ background: 'linear-gradient(135deg, #1D3562, #3BAAB5)' }}
          >
            Commencer le test →
          </button>
        </div>
      </div>
    )
  }

  // ── INFO ───────────────────────────────────────────────────────────────────
  if (step === 'info') {
    const ok = info.firstName.trim() && info.lastName.trim() && info.phone.trim()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="" className="w-12 h-12 object-contain mx-auto mb-3" />
            <h2 className="text-2xl font-black" style={{ color: '#1D3562' }}>Vos informations</h2>
            <p className="text-gray-500 text-sm mt-1">Ces informations apparaîtront sur votre rapport personnalisé</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prénom <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={info.firstName} onChange={e => setInfo(p => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={info.lastName} onChange={e => setInfo(p => ({ ...p, lastName: e.target.value }))} placeholder="NOM" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone <span className="text-red-500">*</span></label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={info.phone} onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))} placeholder="06 XX XX XX XX" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={info.email} onChange={e => setInfo(p => ({ ...p, email: e.target.value }))} placeholder="email@exemple.ma" />
            </div>
            <button
              disabled={!ok}
              onClick={() => setStep('questions')}
              className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-40"
              style={{ background: ok ? 'linear-gradient(135deg, #1D3562, #3BAAB5)' : '#9CA3AF' }}
            >
              Accéder au questionnaire →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── QUESTIONS ──────────────────────────────────────────────────────────────
  if (step === 'questions') {
    const progress = (totalAnswered / totalQuestions) * 100

    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 sticky top-4 z-10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-medium text-gray-500">Quotient DE SUCCÈS</div>
                <div className="text-sm font-semibold text-gray-900">{info.firstName} {info.lastName}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black" style={{ color: '#1D3562' }}>{totalAnswered}</div>
                <div className="text-xs text-gray-400">/ {totalQuestions}</div>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #1D3562, #3BAAB5)' }}
              />
            </div>
          </div>

          {/* Questions grouped by pilier */}
          {QS_PILIER_ORDER.map(pilierKey => {
            const info2 = getPilierInfo(pilierKey)
            const questions = QS_QUESTIONS.filter(q => q.pilier === pilierKey)
            return (
              <div key={pilierKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50" style={{ background: 'linear-gradient(135deg, #1D356208, #3BAAB508)' }}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      info2.type === 'principal'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {info2.type === 'principal' ? 'Pilier principal' : 'Pilier secondaire'}
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#1D3562' }}>{info2.label}</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {questions.map((q, qi) => {
                    const val = answers[q.id]
                    return (
                      <div key={q.id} className="px-5 py-4">
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          <span className="text-xs font-bold text-gray-400 mr-2">{qi + 1}.</span>
                          {q.text}
                        </p>
                        {/* Scale 1-10 */}
                        <div className="space-y-2">
                          <div className="flex gap-1.5 flex-wrap">
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <button
                                key={n}
                                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: n }))}
                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                                  val === n
                                    ? 'text-white shadow-sm scale-105'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                style={val === n ? {
                                  background: n <= 3 ? '#E8484A' : n <= 6 ? '#F5C00A' : '#3BAAB5',
                                } : {}}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>1 — Très faible</span>
                            <span>10 — Excellent</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Submit */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-2">
            {totalAnswered < totalQuestions && (
              <p className="text-sm text-amber-600 mb-3 text-center">
                ⚠️ {totalQuestions - totalAnswered} question(s) sans réponse
              </p>
            )}
            <button
              disabled={totalAnswered < totalQuestions || saving}
              onClick={handleSubmit}
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-40"
              style={{ background: totalAnswered >= totalQuestions ? 'linear-gradient(135deg, #1D3562, #3BAAB5)' : '#9CA3AF' }}
            >
              {saving ? 'Calcul en cours…' : 'Voir mes résultats →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  const total = QS_PILIER_ORDER.reduce((acc, p) => acc + (scores[p] ?? 0), 0)
  const level = getQSLevel(total)
  const forces = getTop5Forces(scores)
  const axes = getBottom5Axes(scores)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6">
          <img src="/logo.png" alt="" className="w-12 h-12 object-contain mx-auto mb-4" />
          <div className="text-sm font-medium tracking-widest text-gray-500 uppercase mb-1">Quotient DE SUCCÈS</div>
          <div className="text-2xl font-black mb-4" style={{ color: '#1D3562' }}>
            {info.firstName} {info.lastName.toUpperCase()}
          </div>

          {/* Score donut */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div
              className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-4"
              style={{ borderColor: level.color, background: level.bg }}
            >
              <div className="text-3xl font-black" style={{ color: level.color }}>{total}</div>
              <div className="text-xs text-gray-400">/450</div>
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Niveau de QS</div>
              <div className="text-2xl font-black" style={{ color: level.color }}>{level.label}</div>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">{level.description}</p>
        </div>

        {/* Forces */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h3 className="text-base font-bold mb-4" style={{ color: '#1D3562' }}>⭐ Vos 5 forces fondamentales</h3>
          <div className="space-y-3">
            {forces.map((p, i) => {
              const pInfo = getPilierInfo(p)
              const s = scores[p]
              return (
                <div key={p}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      <span className="text-teal-500 font-bold mr-1">{i + 1}.</span>
                      {pInfo.content.forceTitle}
                    </span>
                    <span className="text-xs font-bold text-teal-600">{s}/30</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${(s / 30) * 100}%`, background: '#3BAAB5' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Axes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-bold mb-4" style={{ color: '#1D3562' }}>💡 Axes d'amélioration prioritaires</h3>
          <div className="space-y-3">
            {axes.map((p, i) => {
              const pInfo = getPilierInfo(p)
              const s = scores[p]
              return (
                <div key={p}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      <span className="text-red-400 font-bold mr-1">{i + 1}.</span>
                      {pInfo.content.axeTitle}
                    </span>
                    <span className="text-xs font-bold text-red-400">{s}/30</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${(s / 30) * 100}%`, background: '#E8484A' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full py-4 rounded-xl font-bold text-white text-lg mb-4 transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1D3562, #3BAAB5)' }}
        >
          {downloading ? 'Génération du PDF…' : '⬇️ Télécharger mon rapport PDF'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Rapport personnalisé Success Compass Academy · {new Date().toLocaleDateString('fr-MA')}
        </p>
      </div>

      {/* Hidden PDF template */}
      <div style={{ position: 'fixed', left: -9999, top: 0, opacity: 0, pointerEvents: 'none' }}>
        <QSReportTemplate
          ref={reportRef}
          firstName={info.firstName}
          lastName={info.lastName}
          scores={scores}
        />
      </div>
    </div>
  )
}
