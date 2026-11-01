import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accent?: string
}

export function Card({ children, className, hover, onClick, padding = 'md', accent }: CardProps) {
  const p = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' }[padding]
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-[#0F2040] rounded-2xl border border-[#E2ECF8] dark:border-[rgba(26,115,232,0.12)]',
        'shadow-[0_2px_12px_rgba(26,115,232,0.06)]',
        hover && 'hover:shadow-[0_6px_24px_rgba(26,115,232,0.12)] hover:-translate-y-0.5 cursor-pointer transition-all duration-200',
        onClick && 'cursor-pointer',
        p,
        className
      )}
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-semibold text-[#0A1628] dark:text-[#E8F1FF]', className)}>{children}</h3>
}
