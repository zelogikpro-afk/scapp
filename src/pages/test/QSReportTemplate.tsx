import { forwardRef } from 'react'
import {
  QS_PILIER_ORDER, getQSLevel, getPilierInfo, getTop5Forces, getBottom5Axes,
  type QSPilier,
} from '../../data/testQSQuestions'

interface Props {
  firstName: string
  lastName: string
  scores: Record<QSPilier, number>
}

export const PAGE_W = 794
export const PAGE_H = 1123

const TEAL   = '#3BAAB5'
const CORAL  = '#E8484A'
const NAVY   = '#1D3562'
const YELLOW = '#F5C00A'
const WHITE  = '#FFFFFF'
const GRAY   = '#F7F8FA'

// ── Decorative corner shapes (top-right) ──────────────────────────────────────
function TopRightDecor() {
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 220, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Teal wavy arc */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200,
        borderRadius: '50%',
        border: `28px solid ${TEAL}`,
        opacity: 0.85,
      }} />
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 150, height: 150,
        borderRadius: '50%',
        border: `20px solid ${TEAL}`,
        opacity: 0.5,
      }} />
      {/* Coral half-circle */}
      <div style={{
        position: 'absolute', top: 10, right: -30,
        width: 130, height: 130,
        borderRadius: '50%',
        background: CORAL,
        opacity: 0.9,
      }} />
      {/* Navy quarter circle */}
      <div style={{
        position: 'absolute', top: -20, right: 60,
        width: 120, height: 120,
        borderRadius: '50%',
        background: NAVY,
      }} />
      {/* Yellow dot */}
      <div style={{
        position: 'absolute', top: 90, right: 0,
        width: 55, height: 55,
        borderRadius: '50%',
        background: YELLOW,
      }} />
    </div>
  )
}

// ── Decorative corner shapes (bottom-left) ─────────────────────────────────────
function BottomLeftDecor() {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 200, height: 180, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Navy block */}
      <div style={{
        position: 'absolute', bottom: -10, left: -30,
        width: 110, height: 110,
        background: NAVY,
        borderRadius: '0 50% 0 0',
      }} />
      {/* Coral circle */}
      <div style={{
        position: 'absolute', bottom: 40, left: 40,
        width: 55, height: 55,
        borderRadius: '50%',
        background: CORAL,
      }} />
      {/* Yellow circle */}
      <div style={{
        position: 'absolute', bottom: 5, left: 95,
        width: 42, height: 42,
        borderRadius: '50%',
        background: YELLOW,
      }} />
      {/* Teal arcs */}
      <div style={{
        position: 'absolute', bottom: -40, left: -40,
        width: 140, height: 140,
        borderRadius: '50%',
        border: `20px solid ${TEAL}`,
        opacity: 0.6,
      }} />
    </div>
  )
}

// ── Score icon (bottom right on cover) ────────────────────────────────────────
function ScoreIcon({ total }: { total: number }) {
  const level = getQSLevel(total)
  return (
    <div style={{
      position: 'absolute', bottom: 60, right: 48,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        border: `4px solid ${level.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: level.bg,
        flexDirection: 'column',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: level.color, letterSpacing: 0.5 }}>QS</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: level.color, lineHeight: 1 }}>
          {Math.round(total)}
        </span>
        <span style={{ fontSize: 9, color: '#999' }}>/450</span>
      </div>
    </div>
  )
}

// ── Header (repeated on every page) ───────────────────────────────────────────
function Header({ firstName, lastName }: { firstName: string; lastName: string }) {
  return (
    <div style={{
      padding: '28px 48px 0',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      position: 'relative', zIndex: 2,
    }}>
      {/* Logo area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/logo.png"
          alt="Success Compass"
          style={{ width: 56, height: 56, objectFit: 'contain' }}
          crossOrigin="anonymous"
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 400, color: '#888', letterSpacing: 3, textTransform: 'uppercase' }}>
            Quotient
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: NAVY, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1 }}>
            DE SUCCÈS
          </div>
          <div style={{ fontSize: 13, color: '#555', fontWeight: 500, marginTop: 2 }}>
            {firstName} {lastName.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page wrapper ───────────────────────────────────────────────────────────────
function Page({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: PAGE_W, minHeight: PAGE_H, background: WHITE,
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Segoe UI", Arial, sans-serif',
      boxSizing: 'border-box',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── COVER PAGE ────────────────────────────────────────────────────────────────
function CoverPage({ firstName, lastName, scores }: Props) {
  const total = QS_PILIER_ORDER.reduce((s, p) => s + (scores[p] ?? 0), 0)
  const level = getQSLevel(total)

  return (
    <Page>
      <TopRightDecor />
      <BottomLeftDecor />

      {/* Logo */}
      <div style={{ padding: '36px 48px 0', position: 'relative', zIndex: 2 }}>
        <img src="/logo.png" alt="Success Compass" style={{ width: 64, height: 64, objectFit: 'contain' }} crossOrigin="anonymous" />
      </div>

      {/* Main title */}
      <div style={{ padding: '24px 48px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 15, fontWeight: 400, color: '#777', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>
          Quotient
        </div>
        <div style={{ fontSize: 58, fontWeight: 900, color: NAVY, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
          DE SUCCÈS
        </div>
        <div style={{ fontSize: 28, color: '#444', fontWeight: 500, marginTop: 8 }}>
          {firstName} {lastName.toUpperCase()}
        </div>
      </div>

      {/* Level badge */}
      <div style={{ padding: '52px 48px 0', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
          Niveau de QS :
        </div>
        <div style={{
          display: 'inline-block',
          fontSize: 36, fontWeight: 900, color: level.color,
          background: level.bg,
          padding: '10px 40px',
          borderRadius: 12,
          border: `2px solid ${level.color}`,
          letterSpacing: 2,
        }}>
          {level.label}
        </div>

        {/* Description */}
        <div style={{
          marginTop: 36, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
          fontSize: 15, lineHeight: 1.75, color: '#444', textAlign: 'center',
        }}>
          {level.description}
        </div>
      </div>

      <ScoreIcon total={total} />
    </Page>
  )
}

// ── FORCES PAGE ───────────────────────────────────────────────────────────────
function ForcesPage({ firstName, lastName, scores, forces }: Props & { forces: QSPilier[] }) {
  const displayForces = forces.slice(0, 3)

  return (
    <Page>
      <TopRightDecor />
      <BottomLeftDecor />
      <Header firstName={firstName} lastName={lastName} />

      <div style={{ padding: '36px 48px 0', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: NAVY, textAlign: 'center', marginBottom: 36 }}>
          Vos 5 forces fondamentales
        </h2>

        {displayForces.map((pilierKey, i) => {
          const info = getPilierInfo(pilierKey)
          const score = scores[pilierKey]
          return (
            <div key={pilierKey} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: TEAL, color: WHITE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                  {info.content.forceTitle}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 13, fontWeight: 700,
                  color: TEAL, background: '#EBF8FA', padding: '2px 10px', borderRadius: 20,
                }}>
                  {score}/30
                </span>
              </div>
              {/* Score bar */}
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 4, marginLeft: 36, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${(score / 30) * 100}%`, background: TEAL, borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: '#555', margin: 0, marginLeft: 36 }}>
                {info.content.forceDesc}
              </p>
            </div>
          )
        })}
      </div>

      <div style={{ position: 'absolute', bottom: 40, right: 48, zIndex: 2 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `3px solid ${NAVY}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>⭐</div>
      </div>
    </Page>
  )
}

function Forces2Page({ firstName, lastName, scores, forces }: Props & { forces: QSPilier[] }) {
  const displayForces = forces.slice(3, 5)

  return (
    <Page>
      <TopRightDecor />
      <BottomLeftDecor />
      <Header firstName={firstName} lastName={lastName} />

      <div style={{ padding: '36px 48px 0', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: NAVY, textAlign: 'center', marginBottom: 36 }}>
          Vos 5 forces fondamentales
        </h2>

        {displayForces.map((pilierKey, i) => {
          const info = getPilierInfo(pilierKey)
          const score = scores[pilierKey]
          return (
            <div key={pilierKey} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: TEAL, color: WHITE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {i + 4}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                  {info.content.forceTitle}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 13, fontWeight: 700,
                  color: TEAL, background: '#EBF8FA', padding: '2px 10px', borderRadius: 20,
                }}>
                  {score}/30
                </span>
              </div>
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 4, marginLeft: 36, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${(score / 30) * 100}%`, background: TEAL, borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: '#555', margin: 0, marginLeft: 36 }}>
                {info.content.forceDesc}
              </p>
            </div>
          )
        })}
      </div>

      <div style={{ position: 'absolute', bottom: 40, right: 48, zIndex: 2 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `3px solid ${NAVY}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>⭐</div>
      </div>
    </Page>
  )
}

// ── AXES D'AMÉLIORATION PAGES ──────────────────────────────────────────────────
function AxesPage({ firstName, lastName, scores, axes, startIndex }: Props & { axes: QSPilier[]; startIndex: number }) {
  return (
    <Page>
      <TopRightDecor />
      <BottomLeftDecor />
      <Header firstName={firstName} lastName={lastName} />

      <div style={{ padding: '36px 48px 0', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: NAVY, textAlign: 'center', marginBottom: 6 }}>
          Axes d'amélioration
        </h2>
        <p style={{ textAlign: 'center', color: '#777', fontSize: 14, marginBottom: 32, marginTop: 0 }}>
          pour aller encore plus loin
        </p>

        {axes.map((pilierKey, i) => {
          const info = getPilierInfo(pilierKey)
          const score = scores[pilierKey]
          return (
            <div key={pilierKey} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: CORAL, color: WHITE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {startIndex + i + 1}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                  {info.content.axeTitle}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 13, fontWeight: 700,
                  color: CORAL, background: '#FEF2F2', padding: '2px 10px', borderRadius: 20,
                }}>
                  {score}/30
                </span>
              </div>
              <div style={{ height: 4, background: '#E5E7EB', borderRadius: 4, marginLeft: 36, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${(score / 30) * 100}%`, background: CORAL, borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: '#555', margin: 0, marginLeft: 36 }}>
                {info.content.axeDesc}
              </p>
            </div>
          )
        })}
      </div>

      <div style={{ position: 'absolute', bottom: 40, right: 48, zIndex: 2 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `3px solid ${CORAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>💡</div>
      </div>
    </Page>
  )
}

// ── SCORES DÉTAILLÉS PAGE ──────────────────────────────────────────────────────
function ScoresPage({ firstName, lastName, scores }: Props) {
  const total = QS_PILIER_ORDER.reduce((s, p) => s + (scores[p] ?? 0), 0)
  const level = getQSLevel(total)
  const piliersByType = {
    principal: QS_PILIER_ORDER.filter(p => getPilierInfo(p).type === 'principal'),
    secondaire: QS_PILIER_ORDER.filter(p => getPilierInfo(p).type === 'secondaire'),
  }

  return (
    <Page>
      <TopRightDecor />
      <BottomLeftDecor />
      <Header firstName={firstName} lastName={lastName} />

      <div style={{ padding: '32px 48px 0', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 24 }}>
          Détail de vos scores par pilier
        </h2>

        {/* Total QS */}
        <div style={{
          background: level.bg, border: `2px solid ${level.color}`,
          borderRadius: 12, padding: '14px 20px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Score QS Total</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: level.color }}>{total}</span>
            <span style={{ fontSize: 14, color: '#888' }}> / 450</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: level.color }}>{level.label}</div>
          </div>
        </div>

        {/* Piliers principaux */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            Piliers principaux
          </div>
          {piliersByType.principal.map(p => {
            const info = getPilierInfo(p)
            const score = scores[p]
            const pct = (score / 30) * 100
            return (
              <div key={p} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: '#444' }}>{info.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{score}/30</span>
                </div>
                <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4 }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: pct >= 70 ? TEAL : pct >= 40 ? YELLOW : CORAL,
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Piliers secondaires */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            Piliers secondaires
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
            {piliersByType.secondaire.map(p => {
              const info = getPilierInfo(p)
              const score = scores[p]
              const pct = (score / 30) * 100
              return (
                <div key={p}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#444' }}>{info.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{score}/30</span>
                  </div>
                  <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: pct >= 70 ? TEAL : pct >= 40 ? YELLOW : CORAL,
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Page>
  )
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
const QSReportTemplate = forwardRef<HTMLDivElement, Props>(({ firstName, lastName, scores }, ref) => {
  const forces = getTop5Forces(scores)
  const axes = getBottom5Axes(scores)

  return (
    <div ref={ref} style={{ display: 'inline-block' }}>
      <CoverPage firstName={firstName} lastName={lastName} scores={scores} />
      <ForcesPage firstName={firstName} lastName={lastName} scores={scores} forces={forces} />
      <Forces2Page firstName={firstName} lastName={lastName} scores={scores} forces={forces} />
      <AxesPage firstName={firstName} lastName={lastName} scores={scores} axes={axes.slice(0, 3)} startIndex={0} />
      <AxesPage firstName={firstName} lastName={lastName} scores={scores} axes={axes.slice(3, 5)} startIndex={3} />
      <ScoresPage firstName={firstName} lastName={lastName} scores={scores} />
    </div>
  )
})

QSReportTemplate.displayName = 'QSReportTemplate'
export default QSReportTemplate
