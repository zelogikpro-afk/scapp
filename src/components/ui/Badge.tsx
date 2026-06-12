import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline'
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

const variants = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  outline: 'border border-current bg-transparent',
}

const dotColors = {
  default: 'bg-gray-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
  outline: 'bg-current',
}

export function Badge({ children, variant = 'default', size = 'md', className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      variants[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
