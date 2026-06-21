import { forwardRef } from 'react'
import {
  QS_PILIER_ORDER, getQSLevel, getPilierInfo, getPilierScore,
  getQSGlobalLevel, getTotalScore,
  type QSPilier,
} from '../../data/testQSQuestions'

interface Props {
  firstName: string
  lastName: string
  answers: Record<number, number>
}

const NAVY   = '#1D3461'
const TEAL   = '#4AB5BD'
const YELLOW = '#F5C542'
const WHITE  = '#FFFFFF'

export const PAGE_W = 794
export const PAGE_H = 1123

function TopBar() {
  return (
    <div style={{ display: 'flex', height: 6, width: '100%' }}>
      <div style={{ flex: 1, background: NAVY }} />
      <div style={{ flex: 1, background: TEAL }} />
      <div style={{ flex: 1, background: YELLOW }} />
    </div>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: PAGE_W, minHeight: PAGE_H, background: WHITE,
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Segoe UI", Arial, sans-serif',
      boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      <TopBar />
      {children}
    </div>
  )
}

// ── COVER PAGE ────────────────────────────────────────────────────────────────
function CoverPage({ firstName, lastName, answers }: Props) {
  const total       = getTotalScore(answers)
  const globalLevel = getQSGlobalLevel(total)

  const colMap: Record<string, string> = {
    forte: '#22c55e', moyenne: '#f59e0b', faible: '#ef4444',
  }
  const lblMap: Record<string, string> = {
    forte: 'Forte', moyenne: 'Moyenne', faible: 'Faible',
  }

  return (
    <Page>
      {/* Header */}
      <div style={{ padding: '30px 48px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 400, color: '#999', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 8 }}>
            RAPPORT DE
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: NAVY, lineHeight: 1.05, textTransform: 'uppercase' }}>
            QUOTIENT DE
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: NAVY, lineHeight: 1.05, textTransform: 'uppercase' }}>
            SUCCÈS
          </div>
          <div style={{ marginTop: 12, height: 4, width: 56, background: TEAL, borderRadius: 2 }} />
        </div>
        <img src="/logo.png" alt="Success Compass" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
      </div>

      {/* Name + global score */}
      <div style={{ padding: '16px 48px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#222' }}>
          {firstName} {lastName}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#777' }}>Score global :</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: NAVY }}>{total}</span>
          <span style={{ fontSize: 13, color: '#999' }}>/ 90</span>
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: NAVY, color: WHITE, padding: '2px 10px', borderRadius: 20 }}>
            {globalLevel}
          </span>
        </div>
      </div>

      <div style={{ margin: '14px 48px', height: 1, background: '#e5e7eb' }} />

      {/* All 13 piliers — compact 2-column grid */}
      <div style={{ padding: '0 48px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
          {QS_PILIER_ORDER.map((pilier) => {
            const info  = getPilierInfo(pilier)
            const score = getPilierScore(pilier, answers)
            const level = getQSLevel(score, info.maxScore)
            const col   = colMap[level]
            const lbl   = lblMap[level]
            const pct   = Math.round((score / info.maxScore) * 100)

            return (
              <div key={pilier} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 3, borderRadius: 2, background: TEAL, alignSelf: 'stretch', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: NAVY }}>{info.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: col }}>{lbl}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#555' }}>{score}/{info.maxScore}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: '#777', lineHeight: 1.45 }}>
                    {info[level].summary}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 48px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontSize: 10, color: '#bbb' }}>Success Compass Academy</span>
        <span style={{ fontSize: 10, color: '#bbb' }}>Test Quotient de Succès</span>
      </div>
    </Page>
  )
}

// ── PILIER PAGE ────────────────────────────────────────────────────────────────
function PilierPage({ pilier, index, answers, firstName, lastName }: {
  pilier: QSPilier; index: number; answers: Record<number, number>
  firstName: string; lastName: string
}) {
  const info    = getPilierInfo(pilier)
  const score   = getPilierScore(pilier, answers)
  const level   = getQSLevel(score, info.maxScore)
  const content = info[level]
  const col     = level === 'forte' ? '#22c55e' : level === 'moyenne' ? '#f59e0b' : '#ef4444'
  const lbl     = level === 'forte' ? 'Compétence forte' : level === 'moyenne' ? 'Compétence moyenne' : 'Compétence à renforcer'
  const pct     = Math.round((score / info.maxScore) * 100)

  return (
    <Page>
      {/* Header */}
      <div style={{ padding: '18px 48px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="SC" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 400, color: '#aaa', letterSpacing: 3, textTransform: 'uppercase' }}>
              QUOTIENT DE SUCCÈS
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{firstName} {lastName}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: '#bbb' }}>Pilier {index + 1} / {QS_PILIER_ORDER.length}</span>
      </div>

      <div style={{ padding: '22px 48px', flex: 1 }}>
        {/* Pilier title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{ width: 5, borderRadius: 2, background: TEAL, alignSelf: 'stretch', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: NAVY }}>{info.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{lbl}</span>
              <span style={{ fontSize: 12, color: '#777' }}>Score : {score} / {info.maxScore}</span>
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 5 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, color: '#ccc' }}>0</span>
            <span style={{ fontSize: 10, color: '#ccc' }}>{info.maxScore}</span>
          </div>
        </div>

        {/* Analyse */}
        <div style={{
          background: '#f8fafc', borderRadius: 10, padding: '18px 22px',
          marginBottom: 24, borderLeft: `4px solid ${TEAL}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            Analyse
          </div>
          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.8 }}>{content.description}</div>
        </div>

        {/* Plan d'action */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 14 }}>{content.planTitle}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {content.plan.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, flex: 1 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercice */}
        <div style={{ background: NAVY, borderRadius: 10, padding: '18px 22px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            Exercice recommandé
          </div>
          <div style={{ fontSize: 13, color: WHITE, lineHeight: 1.8 }}>{content.exercice}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 48px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#bbb' }}>Success Compass Academy</span>
        <span style={{ fontSize: 10, color: '#bbb' }}>{info.label}</span>
      </div>
    </Page>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
const QSReportTemplate = forwardRef<HTMLDivElement, Props>(function QSReportTemplate(
  { firstName, lastName, answers }, ref
) {
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <CoverPage firstName={firstName} lastName={lastName} answers={answers} />
      {QS_PILIER_ORDER.map((pilier, i) => (
        <PilierPage key={pilier} pilier={pilier} index={i} answers={answers} firstName={firstName} lastName={lastName} />
      ))}
    </div>
  )
})

export default QSReportTemplate
