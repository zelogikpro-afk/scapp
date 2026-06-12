import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, hover, onClick, padding = 'md' }: CardProps) {
  const p = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' }[padding]
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800',
        'shadow-sm',
        hover && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200',
        onClick && 'cursor-pointer',
        p,
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-semibold text-gray-900 dark:text-gray-100', className)}>{children}</h3>
}
