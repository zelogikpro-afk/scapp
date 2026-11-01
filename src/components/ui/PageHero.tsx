import type { ReactNode } from 'react'

interface PageHeroProps {
  emoji: string
  title: string
  sub?: string
  gradient?: string
  actions?: ReactNode
  stats?: { label: string; value: string | number; color?: string }[]
}

export function PageHero({ emoji, title, sub, gradient, actions, stats }: PageHeroProps) {
  const bg = gradient || 'linear-gradient(135deg, #1A73E8 0%, #4F94F0 60%, #00B4D8 100%)'

  return (
    <div style={{
      background: bg,
      borderRadius: 22,
      padding: '22px 22px 20px',
      marginBottom: 22,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* decorative circles */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {emoji}
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(17px,4vw,22px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>{title}</h1>
              {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '3px 0 0' }}>{sub}</p>}
            </div>
          </div>
          {actions && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {actions}
            </div>
          )}
        </div>

        {/* Stats row */}
        {stats && stats.length > 0 && (
          <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Hero button style (white, for use inside PageHero)
export function HeroBtn({ children, onClick, outlined, disabled }: { children: ReactNode; onClick?: () => void; outlined?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outlined ? 'transparent' : '#fff',
      color: outlined ? '#fff' : '#1A73E8',
      border: outlined ? '1.5px solid rgba(255,255,255,0.5)' : 'none',
      borderRadius: 12,
      padding: '8px 16px',
      fontSize: 13,
      fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  )
}

// Stat pill — inline usage
export function HeroStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}
