import { forwardRef } from 'react'
import {
  SECTION_ORDER, getIELevel, getDimContent, getDimInfo,
  type IEDimension
} from '../../data/testIEQuestions'

interface Props {
  firstName: string
  lastName: string
  scores: Record<IEDimension, number>
}

const NAVY = '#1D3461'
const TEAL = '#4AB5BD'
const YELLOW = '#F5C542'
const WHITE = '#FFFFFF'

export const PAGE_W = 794
export const PAGE_H = 1123

// ── Thin colored top bar ──────────────────────────────────────────────────────
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
function CoverPage({ firstName, lastName, scores }: Props) {
  const total = SECTION_ORDER.reduce((a, d) => a + (scores[d] ?? 0), 0)

  return (
    <Page>
      {/* Header: logo + title */}
      <div style={{ padding: '32px 48px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 400, color: '#999', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 8 }}>
            RAPPORT DE
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: NAVY, lineHeight: 1.05, textTransform: 'uppercase' }}>
            INTELLIGENCE
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: NAVY, lineHeight: 1.05, textTransform: 'uppercase' }}>
            ÉMOTIONNELLE
          </div>
          <div style={{ marginTop: 12, height: 4, width: 56, background: TEAL, borderRadius: 2 }} />
        </div>
        <img src="/logo.png" alt="Success Compass" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
      </div>

      {/* Name + score global */}
      <div style={{ padding: '22px 48px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#222' }}>
          {firstName} {lastName}
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#777' }}>Score global :</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: NAVY }}>{total}</span>
          <span style={{ fontSize: 13, color: '#999' }}>/ 80</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: '24px 48px', height: 1, background: '#e5e7eb' }} />

      {/* Dimensions */}
      <div style={{ padding: '0 48px', display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
        {SECTION_ORDER.map((dim, i) => {
          const info = getDimInfo(dim)
          const score = scores[dim] ?? 0
          const level = getIELevel(score)
          const content = getDimContent(dim, level)
          const col = level === 'forte' ? '#22c55e' : level === 'moyenne' ? '#f59e0b' : '#ef4444'
          const lbl = level === 'forte' ? 'Forte' : level === 'moyenne' ? 'Moyenne' : 'Faible'
          const pct = Math.round((score / 16) * 100)

          return (
            <div key={dim} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 4, borderRadius: 2, background: TEAL, alignSelf: 'stretch', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{info.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{lbl}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>{score}/16</span>
                  </div>
                </div>
                {/* Bar */}
                <div style={{ height: 7, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 11.5, color: '#666', lineHeight: 1.55 }}>{content.summary}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '20px 48px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontSize: 10, color: '#bbb' }}>Success Compass Academy</span>
        <span style={{ fontSize: 10, color: '#bbb' }}>Test d'Intelligence Émotionnelle</span>
      </div>
    </Page>
  )
}

// ── DIMENSION PAGE ────────────────────────────────────────────────────────────
function DimPage({ dim, index, scores, firstName, lastName }: {
  dim: IEDimension; index: number; scores: Record<IEDimension, number>
  firstName: string; lastName: string
}) {
  const info = getDimInfo(dim)
  const score = scores[dim] ?? 0
  const level = getIELevel(score)
  const content = getDimContent(dim, level)
  const col = level === 'forte' ? '#22c55e' : level === 'moyenne' ? '#f59e0b' : '#ef4444'
  const lbl = level === 'forte' ? 'Compétence forte' : level === 'moyenne' ? 'Compétence moyenne' : 'Compétence à renforcer'
  const pct = Math.round((score / 16) * 100)

  return (
    <Page>
      {/* Header */}
      <div style={{ padding: '18px 48px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="SC" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 400, color: '#aaa', letterSpacing: 3, textTransform: 'uppercase' }}>
              INTELLIGENCE ÉMOTIONNELLE
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{firstName} {lastName}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: '#bbb' }}>Dimension {index + 1} / 5</span>
      </div>

      <div style={{ padding: '24px 48px', flex: 1 }}>
        {/* Dimension title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 5, borderRadius: 2, background: TEAL, alignSelf: 'stretch', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: NAVY }}>{info.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{lbl}</span>
              <span style={{ fontSize: 12, color: '#777' }}>Score : {score} / 16</span>
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 5 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, color: '#ccc' }}>0</span>
            <span style={{ fontSize: 10, color: '#ccc' }}>16</span>
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

// ── Main export ───────────────────────────────────────────────────────────────
const IEReportTemplate = forwardRef<HTMLDivElement, Props>(function IEReportTemplate(
  { firstName, lastName, scores }, ref
) {
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <CoverPage firstName={firstName} lastName={lastName} scores={scores} />
      {SECTION_ORDER.map((dim, i) => (
        <DimPage key={dim} dim={dim} index={i} scores={scores} firstName={firstName} lastName={lastName} />
      ))}
    </div>
  )
})

export default IEReportTemplate
