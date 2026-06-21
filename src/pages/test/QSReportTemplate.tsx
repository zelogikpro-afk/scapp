import { forwardRef } from 'react'
import {
  getTop5Forces, getBottom5Axes, getPilierInfo,
  getTotalScore, getQSGlobalLevel, QS_GLOBAL_CONTENT,
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

function PageHeader({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <div style={{ padding: '16px 56px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/logo.png" alt="SC" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: 8, color: '#aaa', letterSpacing: 3, textTransform: 'uppercase' }}>QUOTIENT DE SUCCÈS</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{firstName} {lastName?.toUpperCase()}</div>
        </div>
      </div>
    </div>
  )
}

function PageFooter() {
  return (
    <div style={{ padding: '14px 56px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 10, color: '#bbb' }}>Success Compass Academy</span>
      <span style={{ fontSize: 10, color: '#bbb' }}>Test Quotient de Succès</span>
    </div>
  )
}

// ── COVER PAGE ────────────────────────────────────────────────────────────────
function CoverPage({ firstName, lastName, answers }: Props) {
  const total    = getTotalScore(answers)
  const levelKey = getQSGlobalLevel(total)
  const content  = QS_GLOBAL_CONTENT[levelKey]

  return (
    <Page>
      <div style={{ padding: '44px 56px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#999', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 10 }}>RAPPORT DE</div>
          <div style={{ fontSize: 40, fontWeight: 300, color: NAVY, lineHeight: 1.0, textTransform: 'uppercase' }}>Quotient</div>
          <div style={{ fontSize: 58, fontWeight: 900, color: NAVY, lineHeight: 1.0, textTransform: 'uppercase' }}>DE SUCCÈS</div>
          <div style={{ marginTop: 18, height: 4, width: 64, background: TEAL, borderRadius: 2 }} />
        </div>
        <img src="/logo.png" alt="Success Compass" style={{ width: 90, height: 90, objectFit: 'contain', flexShrink: 0 }} />
      </div>

      <div style={{ padding: '20px 56px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#222' }}>{firstName} {lastName?.toUpperCase()}</div>
      </div>

      <div style={{ margin: '36px 56px', height: 1, background: '#e5e7eb' }} />

      <div style={{ padding: '0 56px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 14 }}>Niveau de QS :</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: NAVY, marginBottom: 52 }}>{content.level}</div>
        <div style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <p style={{ fontSize: 16, color: '#333', lineHeight: 1.9, margin: 0, textAlign: 'center' }}>{content.para1}</p>
          <p style={{ fontSize: 16, color: '#333', lineHeight: 1.9, margin: 0, textAlign: 'center' }}>{content.para2}</p>
        </div>
      </div>

      <PageFooter />
    </Page>
  )
}

// ── FORCES PAGE (all 5) ───────────────────────────────────────────────────────
function ForcesPage({ firstName, lastName, answers }: Props) {
  const forces = getTop5Forces(answers)

  return (
    <Page>
      <PageHeader firstName={firstName} lastName={lastName} />
      <div style={{ padding: '24px 56px', flex: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 30 }}>Vos 5 forces fondamentales</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {forces.map((pilier, i) => {
            const info = getPilierInfo(pilier)
            return (
              <div key={pilier} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 4, borderRadius: 2, background: TEAL, alignSelf: 'stretch', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
                    {i + 1}. {info.forceTitle}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#444', lineHeight: 1.75 }}>{info.forceDesc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <PageFooter />
    </Page>
  )
}

// ── AXES PAGE (all 5) ─────────────────────────────────────────────────────────
function AxesPage({ firstName, lastName, answers }: Props) {
  const axes = getBottom5Axes(answers)

  return (
    <Page>
      <PageHeader firstName={firstName} lastName={lastName} />
      <div style={{ padding: '24px 56px', flex: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 6 }}>Axes d'amélioration</div>
        <div style={{ fontSize: 15, color: '#777', marginBottom: 30 }}>pour aller encore plus loin</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {axes.map((pilier, i) => {
            const info = getPilierInfo(pilier)
            return (
              <div key={pilier} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 4, borderRadius: 2, background: YELLOW, alignSelf: 'stretch', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 6 }}>
                    {i + 1}. {info.axeTitle}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#444', lineHeight: 1.75 }}>{info.axeDesc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <PageFooter />
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
      <ForcesPage firstName={firstName} lastName={lastName} answers={answers} />
      <AxesPage   firstName={firstName} lastName={lastName} answers={answers} />
    </div>
  )
})

export default QSReportTemplate
