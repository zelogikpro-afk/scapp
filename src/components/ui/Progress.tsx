import { cn } from '../../lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const colors = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

export function Progress({ value, max = 100, className, color = 'blue', size = 'md', showLabel }: ProgressProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  const h = size === 'sm' ? 'h-1.5' : 'h-2'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden', h)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{pct}%</span>}
    </div>
  )
}
