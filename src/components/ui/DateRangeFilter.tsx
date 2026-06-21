import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'

export type DateRange = { from: string; to: string }

export type Preset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'

export const PRESET_LABELS: Record<Preset, string> = {
  today:   "Aujourd'hui",
  week:    'Cette semaine',
  month:   'Ce mois',
  quarter: 'Ce trimestre',
  year:    'Cette année',
  all:     'Tout',
  custom:  'Personnalisé',
}

export function getRange(preset: Preset, custom?: DateRange): DateRange {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`

  switch (preset) {
    case 'today':
      return { from: fmt(now), to: fmt(now) }
    case 'week': {
      const day = now.getDay() || 7
      const mon = new Date(now); mon.setDate(d - day + 1)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return { from: fmt(mon), to: fmt(sun) }
    }
    case 'month':
      return { from: `${y}-${pad(m+1)}-01`, to: fmt(new Date(y, m+1, 0)) }
    case 'quarter': {
      const q = Math.floor(m / 3)
      return { from: `${y}-${pad(q*3+1)}-01`, to: fmt(new Date(y, q*3+3, 0)) }
    }
    case 'year':
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    case 'custom':
      return custom || { from: '', to: '' }
    default:
      return { from: '', to: '' }
  }
}

export function inRange(dateStr: string | null | undefined, range: DateRange): boolean {
  if (!dateStr) return true
  if (!range.from && !range.to) return true
  const d = dateStr.slice(0, 10)
  if (range.from && d < range.from) return false
  if (range.to && d > range.to) return false
  return true
}

interface Props {
  value: Preset
  onChange: (preset: Preset, range: DateRange) => void
  className?: string
}

export default function DateRangeFilter({ value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState<DateRange>({ from: '', to: '' })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (preset: Preset) => {
    if (preset !== 'custom') { setOpen(false); onChange(preset, getRange(preset)) }
  }

  const applyCustom = () => {
    if (custom.from || custom.to) { setOpen(false); onChange('custom', custom) }
  }

  const label = value === 'custom' && (custom.from || custom.to)
    ? `${custom.from || '…'} → ${custom.to || '…'}`
    : PRESET_LABELS[value]

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-medium">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-2">
          <div className="grid grid-cols-2 gap-1">
            {(['today','week','month','quarter','year','all'] as Preset[]).map(p => (
              <button key={p} onClick={() => select(p)}
                className={`text-xs px-3 py-2 rounded-lg text-left font-medium transition-colors ${value === p && value !== 'custom' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
            <p className="text-xs font-semibold text-gray-400 mb-2 px-1">Période personnalisée</p>
            <div className="flex items-center gap-2">
              <input type="date" value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
              <span className="text-xs text-gray-400">→</span>
              <input type="date" value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
            </div>
            <button onClick={applyCustom}
              className="w-full mt-2 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
