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

const SCALE_COLORS = [
  { bg: '#fee2e2', text: '#991b1b', sel: '#dc2626' },
  { bg: '#fef9c3', text: '#854d0e', sel: '#d97706' },
  { bg: '#f0f9fa', text: '#0e7490', sel: '#0891b2' },
  { bg: '#dbeafe', text: '#1e40af', sel: '#2563eb' },
  { bg: '#dcfce7', text: '#166534', sel: '#16a34a' },
]

export default function TestCompassPage() {
  const [step, setStep]         = useState<Step>('intro')
  const [firstName, setFirst]   = useState('')
  const [lastName, setLast]     = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [answers, setAnswers]   = useState<Record<number, number>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [profile, setProfile]   = useState<CompassProfileKey | null>(null)
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
    const dominant = getDominantProfile(finalAnswers)
    const scores   = getAllScores(finalAnswers)
    setProfile(dominant)
    setSaving(false)
    setStep('result')
    supabase.from('test_results').insert({
      test_type: 'compass', participant_id: participantId,
      first_name: firstName, last_name: lastName,
      email: email || null, phone: phone || null,
      scores, dominant_profile: dominant, answers: finalAnswers,
    }).then(({ error }) => { if (error) console.error('Compass insert error:', error) })
  }

  // ── INTRO ────────────────────────────────────────────────────────────────
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

  // ── INFO ─────────────────────────────────────────────────────────────────
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

  // ── QUESTIONS (une par une) ───────────────────────────────────────────────
  if (step === 'questions') {
    if (saving) return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${TEAL}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: NAVY, fontWeight: 700 }}>Calcul de votre profil…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )

    const q = COMPASS_QUESTIONS[currentQ]
    const isLast = currentQ === COMPASS_QUESTIONS.length - 1
    const selected = answers[q.id]
    const pct = Math.round(((currentQ + (selected !== undefined ? 1 : 0)) / COMPASS_QUESTIONS.length) * 100)

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', opacity: transitioning ? 0.35 : 1, transition: 'opacity 0.15s' }}>
        {/* Progress header */}
        <div style={{ background: NAVY, padding: '14px 20px', flexShrink: 0 }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 13, marginBottom: 8 }}>
              <span style={{ opacity: 0.7, fontWeight: 600 }}>Test Compass</span>
              <span style={{ fontWeight: 700 }}>{currentQ + 1} / {COMPASS_QUESTIONS.length}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(to right, ${TEAL}, #7c3aed)`, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Question card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
          <div style={{ maxWidth: 560, width: '100%' }}>
            <p style={{ fontSize: 19, fontWeight: 700, color: NAVY, lineHeight: 1.55, marginBottom: 32 }}>
              {q.text}
            </p>

            {/* Scale buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COMPASS_SCALE.map((opt, idx) => {
                const c = SCALE_COLORS[idx]
                const isSelected = selected === opt.value
                return (
                  <button key={opt.value} onClick={() => selectAnswer(q.id, opt.value, isLast)}
                    style={{
                      padding: '15px 20px', borderRadius: 14, border: 'none',
                      background: isSelected ? c.sel : c.bg,
                      color: isSelected ? '#fff' : c.text,
                      fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                      textAlign: 'center',
                    }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>

            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(q => q - 1)}
                style={{ marginTop: 20, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                ← Question précédente
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ───────────────────────────────────────────────────────────────
  if (step === 'result' && profile) {
    const prof   = COMPASS_PROFILES[profile]
    const scores = getAllScores(answers)
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a) as [CompassProfileKey, number][]

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <img src="/logo.png" alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 3, textTransform: 'uppercase' }}>Test Compass — Résultats</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{firstName} {lastName.toUpperCase()}</div>
            </div>
          </div>

          <div style={{ background: `linear-gradient(135deg, ${prof.color}15, ${prof.color}30)`, border: `2px solid ${prof.color}`, borderRadius: 20, padding: 32, marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: prof.color, textTransform: 'uppercase', marginBottom: 8 }}>Votre profil dominant</div>
            <div style={{ display: 'inline-block', background: prof.color, color: '#fff', borderRadius: 12, padding: '6px 20px', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{prof.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: NAVY, marginBottom: 16 }}>{prof.name}</div>
            <p style={{ color: '#555', lineHeight: 1.8, margin: 0, fontSize: 15 }}>{prof.traits}</p>
          </div>

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

          {!fromSession && <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 24 }}>
            <div style={{ fontWeight: 800, color: NAVY, marginBottom: 16, fontSize: 15 }}>Tous vos scores</div>
            {sorted.map(([pk, sc]) => {
              const p = COMPASS_PROFILES[pk]
              const maxSc = Math.max(...Object.values(scores))
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

          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8, fontSize: 16 }}>Télécharger votre rapport détaillé</div>
            <p style={{ color: '#777', fontSize: 13, marginBottom: 20 }}>
              Votre rapport personnalisé contient votre profil complet, vos stratégies et vos axes d'évolution.
            </p>
            <a href={`/pdfs/compass/${encodeURIComponent(prof.pdfFile)}`}
              download={`TEST COMPASS_${firstName} ${lastName.toUpperCase()}.pdf`}
              style={{ display: 'inline-block', padding: '14px 40px', background: NAVY, color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              ↓ Télécharger mon rapport PDF
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
