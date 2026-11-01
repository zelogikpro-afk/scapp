import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  QS_QUESTIONS, QS_ANSWERS, QS_PILIER_ORDER,
  getPilierInfo, getPilierScore, getQSLevel, getTotalScore, getQSGlobalLevel,
  type QSPilier,
} from '../../data/testQSQuestions'
import QSReportTemplate, { PAGE_W, PAGE_H } from './QSReportTemplate'

type Step = 'intro' | 'info' | 'questions' | 'result'

const NAVY  = '#1D3462'
const TEAL  = '#3BAAB5'

const ANSWER_COLORS: Record<number, { bg: string; light: string; text: string }> = {
  3: { bg: '#16a34a', light: '#dcfce7', text: '#166534' },
  2: { bg: '#d97706', light: '#fef9c3', text: '#854d0e' },
  1: { bg: '#dc2626', light: '#fee2e2', text: '#991b1b' },
}

export default function TestQSPage() {
  const [step, setStep]       = useState<Step>('intro')
  const [firstName, setFirst] = useState('')
  const [lastName, setLast]   = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [downloading, setDL]  = useState(false)
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
      setEmail(s.email || '')
      setPhone(s.phone || '')
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
    const totalScore = getTotalScore(finalAnswers)
    const globalLevel = getQSGlobalLevel(totalScore)
    const scores: Record<string, number> = {}
    QS_PILIER_ORDER.forEach(p => { scores[p] = getPilierScore(p, finalAnswers) })
    setSaving(false)
    setStep('result')
    supabase.from('test_results').insert({
      test_type: 'qs', participant_id: participantId,
      first_name: firstName, last_name: lastName,
      email: email || null, phone: phone || null,
      scores, dominant_profile: globalLevel, answers: finalAnswers,
    }).then(({ error }) => { if (error) console.error('QS insert error:', error) })
  }

  async function downloadPDF() {
    if (!reportRef.current) return
    setDL(true)
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
      pdf.save(`TEST QS_${firstName} ${lastName.toUpperCase()}.pdf`)
    } catch (err) { console.error(err) }
    setDL(false)
  }

  const colMap: Record<string, string> = { forte: '#22c55e', moyenne: '#f59e0b', faible: '#ef4444' }
  const lblMap: Record<string, string> = { forte: 'Forte', moyenne: 'Moyenne', faible: 'Faible' }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, width: '100%', background: '#fff', borderRadius: 20, padding: 48, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <img src="/logo.png" alt="Success Compass" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 3, textTransform: 'uppercase' }}>Success Compass Academy</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: NAVY }}>Test Quotient de Succès</div>
          </div>
        </div>
        <p style={{ color: '#555', lineHeight: 1.8, marginBottom: 24 }}>
          Ce test de <strong>30 questions</strong> évalue vos compétences clés sur <strong>13 piliers</strong> du succès
          professionnel et personnel. Pour chaque affirmation, répondez spontanément selon votre comportement habituel.
        </p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          {[['30', 'questions'], ['13', 'piliers'], ['~10 min', 'durée']].map(([v, l]) => (
            <div key={l} style={{ flex: 1, minWidth: 100, background: '#f0f9fa', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: TEAL }}>{v}</div>
              <div style={{ fontSize: 11, color: '#777' }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setStep(fromSession ? 'questions' : 'info')} style={{
          width: '100%', padding: '14px 0', background: NAVY, color: '#fff',
          borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}>
          Commencer →
        </button>
      </div>
    </div>
  )

  // ── INFO ──────────────────────────────────────────────────────────────────
  if (step === 'info') return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 20, padding: 40, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Vos informations</div>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 28 }}>Elles apparaîtront sur votre rapport personnalisé.</p>
        {[
          { label: 'Prénom *', val: firstName, set: setFirst, placeholder: 'Votre prénom' },
          { label: 'Nom *', val: lastName, set: setLast, placeholder: 'Votre nom' },
          { label: 'Email', val: email, set: setEmail, placeholder: 'votre@email.com' },
          { label: 'Téléphone', val: phone, set: setPhone, placeholder: '+212 6...' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={() => setStep('intro')} style={{ flex: 1, padding: '12px 0', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#555' }}>
            ← Retour
          </button>
          <button onClick={() => setStep('questions')} disabled={!firstName || !lastName}
            style={{ flex: 2, padding: '12px 0', background: firstName && lastName ? NAVY : '#c8cdd6', color: '#fff', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: firstName && lastName ? 'pointer' : 'not-allowed' }}>
            Continuer →
          </button>
        </div>
      </div>
    </div>
  )

  // ── QUESTIONS (une par une) ────────────────────────────────────────────────
  if (step === 'questions') {
    if (saving) return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${TEAL}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: NAVY, fontWeight: 700 }}>Calcul de vos résultats…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )

    const q = QS_QUESTIONS[currentQ]
    const pilierInfo = getPilierInfo(q.pilier)
    const isLast = currentQ === QS_QUESTIONS.length - 1
    const selected = answers[q.id]
    const pct = Math.round(((currentQ + (selected !== undefined ? 1 : 0)) / QS_QUESTIONS.length) * 100)

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', opacity: transitioning ? 0.4 : 1, transition: 'opacity 0.15s' }}>
        {/* Progress header */}
        <div style={{ background: NAVY, padding: '14px 20px', flexShrink: 0 }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 13, marginBottom: 8 }}>
              <span style={{ opacity: 0.7, fontWeight: 600 }}>Quotient de Succès</span>
              <span style={{ fontWeight: 700 }}>{currentQ + 1} / {QS_QUESTIONS.length}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: TEAL, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Question card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
          <div style={{ maxWidth: 560, width: '100%' }}>
            {/* Pilier badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: TEAL + '22', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 0.5 }}>{pilierInfo.label}</span>
            </div>

            {/* Question text */}
            <p style={{ fontSize: 19, fontWeight: 700, color: NAVY, lineHeight: 1.55, marginBottom: 32 }}>
              {q.text}
            </p>

            {/* Answer buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {QS_ANSWERS.map(a => {
                const c = ANSWER_COLORS[a.value]
                const isSelected = selected === a.value
                return (
                  <button key={a.value} onClick={() => selectAnswer(q.id, a.value, isLast)}
                    style={{
                      padding: '16px 20px', borderRadius: 14, border: 'none',
                      background: isSelected ? c.bg : c.light,
                      color: isSelected ? '#fff' : c.text,
                      fontSize: 16, fontWeight: 700, cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      textAlign: 'center',
                    }}>
                    {a.label}
                  </button>
                )
              })}
            </div>

            {/* Back button */}
            {currentQ > 0 && (
              <button onClick={() => { setCurrentQ(q => q - 1) }}
                style={{ marginTop: 20, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                ← Question précédente
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  const totalScore  = getTotalScore(answers)
  const globalLevel = getQSGlobalLevel(totalScore)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ background: NAVY, borderRadius: 20, padding: '32px 36px', marginBottom: 24, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <img src="/logo.png" alt="SC" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>RAPPORT QUOTIENT DE SUCCÈS</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{firstName} {lastName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 48, fontWeight: 900 }}>{Math.round((totalScore / 90) * 100)}%</span>
            <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 700, background: TEAL, padding: '4px 14px', borderRadius: 20 }}>{globalLevel}</span>
          </div>
        </div>

        {!fromSession && <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 20 }}>Vos 13 piliers de succès</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {QS_PILIER_ORDER.map(pilier => {
              const info  = getPilierInfo(pilier)
              const score = getPilierScore(pilier, answers)
              const level = getQSLevel(score, info.maxScore)
              const col   = colMap[level]
              const pct   = Math.round((score / info.maxScore) * 100)
              return (
                <div key={pilier} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 3, height: 32, background: TEAL, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{info.label}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{lblMap[level]}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 7, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>}

        <div style={{ textAlign: 'center' }}>
          <button onClick={downloadPDF} disabled={downloading} style={{
            padding: '14px 40px', background: TEAL, color: '#fff', borderRadius: 14,
            border: 'none', fontSize: 15, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer',
            opacity: downloading ? 0.7 : 1,
          }}>
            {downloading ? 'Génération en cours…' : '📄 Télécharger mon rapport PDF'}
          </button>
        </div>
      </div>

      <div style={{ position: 'fixed', left: -9999, top: 0, zIndex: -1 }}>
        <QSReportTemplate ref={reportRef} firstName={firstName} lastName={lastName} answers={answers} />
      </div>
    </div>
  )
}
