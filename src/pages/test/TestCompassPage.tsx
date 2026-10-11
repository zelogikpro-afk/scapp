import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  COMPASS_QUESTIONS, COMPASS_SCALE, COMPASS_PROFILES,
  getDominantProfile, getAllScores,
  type CompassProfileKey,
} from '../../data/testCompassData'

type Step = 'intro' | 'info' | 'questions' | 'result'

const NAVY = '#1D3461'
const TEAL = '#4AB5BD'

export default function TestCompassPage() {
  const [step, setStep]       = useState<Step>('intro')
  const [firstName, setFirst] = useState('')
  const [lastName, setLast]   = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [saving, setSaving]   = useState(false)
  const [profile, setProfile] = useState<CompassProfileKey | null>(null)
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

  const answered    = Object.keys(answers).length
  const total       = COMPASS_QUESTIONS.length
  const allAnswered = answered === total
  const pct         = Math.round((answered / total) * 100)

  function answer(qId: number, val: number) {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  async function submit() {
    if (!allAnswered) return
    setSaving(true)
    const dominant = getDominantProfile(answers)
    const scores   = getAllScores(answers)

    await supabase.from('test_results').insert({
      test_type:        'compass',
      participant_id:   participantId,
      first_name:       firstName,
      last_name:        lastName,
      email:            email || null,
      phone:            phone || null,
      scores,
      dominant_profile: dominant,
      answers,
    })

    setProfile(dominant)
    setSaving(false)
    setStep('result')
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, width: '100%', background: '#fff', borderRadius: 20, padding: 48, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <img src="/logo.png" alt="Success Compass" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 3, textTransform: 'uppercase' }}>Success Compass Academy</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: NAVY }}>Test Compass</div>
          </div>
        </div>
        <p style={{ color: '#555', lineHeight: 1.8, marginBottom: 24 }}>
          Ce test de <strong>32 questions</strong> identifie votre profil de leadership parmi <strong>10 archétypes</strong>.
          Pour chaque affirmation, répondez spontanément selon votre comportement habituel.
        </p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          {[['32', 'questions'], ['10', 'profils'], ['~12 min', 'durée']].map(([v, l]) => (
            <div key={l} style={{ flex: 1, minWidth: 90, background: '#f0f9fa', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: TEAL }}>{v}</div>
              <div style={{ fontSize: 11, color: '#777' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {Object.values(COMPASS_PROFILES).map(p => (
            <span key={p.key} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: p.bgColor, color: p.color }}>
              {p.label}
            </span>
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
          { label: 'Nom *',    val: lastName,  set: setLast,  placeholder: 'Votre nom' },
          { label: 'Email',    val: email,      set: setEmail, placeholder: 'votre@email.com' },
          { label: 'Téléphone', val: phone,     set: setPhone, placeholder: '+212 6...' },
        ].map(({ label, val, set, placeholder }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>{label}</label>
            <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button onClick={() => setStep('intro')} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#666' }}>
            ← Retour
          </button>
          <button onClick={() => setStep('questions')} disabled={!firstName.trim() || !lastName.trim()}
            style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: (!firstName.trim() || !lastName.trim()) ? '#d1d5db' : NAVY, color: '#fff', fontSize: 14, fontWeight: 700, cursor: (!firstName.trim() || !lastName.trim()) ? 'not-allowed' : 'pointer' }}>
            Commencer le test →
          </button>
        </div>
      </div>
    </div>
  )

  // ── QUESTIONS ──────────────────────────────────────────────────────────────
  if (step === 'questions') return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Test Compass</span>
              <span style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>{answered}/{total} réponses</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(to right, ${TEAL}, ${NAVY})`, width: `${pct}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px 120px' }}>
        {COMPASS_QUESTIONS.map((q, idx) => {
          const selected = answers[q.id]
          return (
            <div key={q.id} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: selected ? `2px solid ${TEAL}` : '2px solid transparent' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: NAVY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                <p style={{ margin: 0, fontSize: 15, color: '#222', lineHeight: 1.6, fontWeight: 500 }}>{q.text}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COMPASS_SCALE.map(opt => {
                  const isSelected = selected === opt.value
                  return (
                    <button key={opt.value} onClick={() => answer(q.id, opt.value)} style={{
                      flex: 1, minWidth: 100, padding: '10px 8px', borderRadius: 10,
                      border: `2px solid ${isSelected ? NAVY : '#e5e7eb'}`,
                      background: isSelected ? NAVY : '#f9fafb',
                      color: isSelected ? '#fff' : '#555',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 16, marginBottom: 2 }}>{opt.value}</div>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#f59e0b', fontSize: 13, marginBottom: 8, fontWeight: 600, visibility: allAnswered ? 'hidden' : 'visible' }}>
            {total - answered} question{total - answered > 1 ? 's' : ''} sans réponse
          </p>
          <button onClick={submit} disabled={!allAnswered || saving} style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: allAnswered ? NAVY : '#d1d5db', color: '#fff',
            fontSize: 16, fontWeight: 700, cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}>
            {saving ? 'Enregistrement…' : 'Voir mes résultats →'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (step === 'result' && profile) {
    const prof  = COMPASS_PROFILES[profile]
    const scores = getAllScores(answers)
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a) as [CompassProfileKey, number][]

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <img src="/logo.png" alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 3, textTransform: 'uppercase' }}>Test Compass — Résultats</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{firstName} {lastName.toUpperCase()}</div>
            </div>
          </div>

          {/* Dominant profile card */}
          <div style={{ background: `linear-gradient(135deg, ${prof.color}15, ${prof.color}30)`, border: `2px solid ${prof.color}`, borderRadius: 20, padding: 32, marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: prof.color, textTransform: 'uppercase', marginBottom: 8 }}>
              Votre profil dominant
            </div>
            <div style={{ display: 'inline-block', background: prof.color, color: '#fff', borderRadius: 12, padding: '6px 20px', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              {prof.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: NAVY, marginBottom: 16 }}>{prof.name}</div>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0, fontSize: 15 }}>{prof.traits}</p>
          </div>

          {/* Points forts + Zones dev */}
          {!fromSession && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 800, color: '#16a34a', marginBottom: 10, fontSize: 14 }}>✦ Points forts</div>
              <p style={{ margin: 0, color: '#444', fontSize: 14, lineHeight: 1.7 }}>{prof.pointsForts}</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: 10, fontSize: 14 }}>▲ Zones de développement</div>
              <p style={{ margin: 0, color: '#444', fontSize: 14, lineHeight: 1.7 }}>{prof.zonesDev}</p>
            </div>
          </div>}

          {/* All scores bar chart */}
          {!fromSession && <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 24 }}>
            <div style={{ fontWeight: 800, color: NAVY, marginBottom: 16, fontSize: 15 }}>Tous vos scores</div>
            {sorted.map(([pk, sc]) => {
              const p = COMPASS_PROFILES[pk]
              const maxSc = COMPASS_PROFILES[pk] && (Object.keys(scores).length > 0) ? Math.max(...Object.values(scores)) : 1
              const barPct = maxSc > 0 ? Math.round((sc / maxSc) * 100) : 0
              return (
                <div key={pk} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: pk === profile ? 700 : 500, color: pk === profile ? p.color : '#555' }}>
                      {p.label} — {p.name}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{sc} pts</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99 }}>
                    <div style={{ height: '100%', borderRadius: 99, background: p.color, width: `${barPct}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>}

          {/* PDF Download */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8, fontSize: 16 }}>Télécharger votre rapport détaillé</div>
            <p style={{ color: '#777', fontSize: 13, marginBottom: 20 }}>
              Votre rapport personnalisé contient votre profil complet, vos stratégies de collaboration et vos axes d'évolution.
            </p>
            <a
              href={`/pdfs/compass/${encodeURIComponent(prof.pdfFile)}`}
              download={`TEST COMPASS_${firstName} ${lastName.toUpperCase()}.pdf`}
              style={{
                display: 'inline-block', padding: '14px 40px', background: NAVY, color: '#fff',
                borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none',
              }}
            >
              ↓ Télécharger mon rapport PDF
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
