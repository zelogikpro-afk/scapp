import type { ReactNode } from 'react'

interface Props { name: string; email?: string; children: ReactNode }

export default function VideoWatermark({ name, email, children }: Props) {
  const label = email ? `${name} · ${email}` : name
  const wStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.32)',
    fontFamily: 'monospace',
    fontWeight: 600,
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  }
  return (
    <div className="relative select-none">
      {children}
      <div className="absolute inset-0 overflow-hidden rounded-xl" style={{ zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ ...wStyle, position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%) rotate(-18deg)', fontSize: 14 }}>{label}</div>
        <div style={{ ...wStyle, position: 'absolute', bottom: 52, left: 12, fontSize: 11 }}>{label}</div>
        <div style={{ ...wStyle, position: 'absolute', top: 10, right: 12, fontSize: 11 }}>{label}</div>
      </div>
    </div>
  )
}
