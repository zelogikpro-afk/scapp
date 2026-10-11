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

export default function TestQSPage() {
  const [step, setStep]       = useState<Step>('intro')
  const [firstName, setFirst] = useState('')
  const [lastName, setLast]   = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [saving, setSaving]   = useState(false)
  const [downloading, setDL]  = useState(false)
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
      setEmail(s.email || '')
      setPhone(s.phone || '')
      setParticipantId(s.participantId || null)
      setFromSession(true)
    } catch { /* ignore */ }
  }, [])
  const reportRef = useRef<HTMLDivElement>(null)

  const answered    = Object.keys(answers).length
  const total       = QS_QUESTIONS.length
  const allAnswered = answered === total

  function answer(qId: number, val: number) {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  // Group questions by pilier in order
  const grouped = QS_PILIER_ORDER.map(pilier => ({
    pilier,
    info: getPilierInfo(pilier),
    questions: QS_QUESTIONS.filter(q => q.pilier === pilier),
  }))

  async function submit() {
    if (!allAnswered) return
    setSaving(true)
    const totalScore = getTotalScore(answers)
    const globalLevel = getQSGlobalLevel(totalScore)

    // Build scores per pilier
    const scores: Record<string, number> = {}
    QS_PILIER_ORDER.forEach(p => {
      scores[p] = getPilierScore(p, answers)
    })

    await supabase.from('test_results').insert({
      test_type:        'qs',
      participant_id:   participantId,
      first_name:       firstName,
      last_name:        lastName,
      email:            email || null,
      phone:            phone || null,
      scores,
      dominant_profile: globalLevel,
      answers,
    })

    setSaving(false)
    setStep('result')
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
    } catch (err) {
      console.error(err)
    }
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

  // ── QUESTIONS ─────────────────────────────────────────────────────────────
  if (step === 'questions') return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: NAVY, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Test Quotient de Succès</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 180, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(answered / total) * 100}%`, background: TEAL, borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{answered}/{total}</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 120px' }}>
        {/* Scale legend */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 8, alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 12, color: '#888', marginRight: 8 }}>Échelle :</span>
          {QS_ANSWERS.map(a => (
            <span key={a.value} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: a.value === 3 ? '#dcfce7' : a.value === 2 ? '#fef9c3' : '#fee2e2', color: a.value === 3 ? '#166534' : a.value === 2 ? '#854d0e' : '#991b1b' }}>
              {a.label}
            </span>
          ))}
        </div>

        {/* Questions by pilier */}
        {grouped.map(({ pilier, info, questions }) => (
          <div key={pilier} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, background: TEAL, borderRadius: 2 }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: NAVY }}>{info.label}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {questions.map(q => (
                <div key={q.id}>
                  <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6, marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, color: TEAL, marginRight: 6 }}>{q.id}.</span>
                    {q.text}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {QS_ANSWERS.map(a => {
                      const selected = answers[q.id] === a.value
                      const bg = selected
                        ? (a.value === 3 ? '#16a34a' : a.value === 2 ? '#d97706' : '#dc2626')
                        : '#f8fafc'
                      return (
                        <button key={a.value} onClick={() => answer(q.id, a.value)} style={{
                          flex: 1, padding: '9px 4px',
                          background: bg, color: selected ? '#fff' : '#555',
                          border: selected ? 'none' : '1.5px solid #e5e7eb',
                          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}>
                          {a.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', visibility: allAnswered ? 'hidden' : 'visible', margin: 0 }}>
            {total - answered} question{total - answered > 1 ? 's' : ''} restante{total - answered > 1 ? 's' : ''}
          </p>
          <button onClick={submit} disabled={!allAnswered || saving} style={{ padding: '14px 48px', background: allAnswered ? NAVY : '#d1d5db', color: '#fff', borderRadius: 14, border: 'none', fontSize: 16, fontWeight: 700, cursor: allAnswered && !saving ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Enregistrement…' : 'Voir mes résultats →'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── RESULT ────────────────────────────────────────────────────────────────
  const totalScore  = getTotalScore(answers)
  const globalLevel = getQSGlobalLevel(totalScore)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header card */}
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

        {/* All 13 piliers */}
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

        {/* Download */}
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

      {/* Hidden PDF template */}
      <div style={{ position: 'fixed', left: -9999, top: 0, zIndex: -1 }}>
        <QSReportTemplate ref={reportRef} firstName={firstName} lastName={lastName} answers={answers} />
      </div>
    </div>
  )
}
