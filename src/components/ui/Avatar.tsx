import { cn, getInitials } from '../../lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: string
}

const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' }

const colors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
]

function colorFor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffff
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ name, src, size = 'md', className, color }: AvatarProps) {
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden',
      sizes[size],
      !src && (color || colorFor(name)),
      className
    )}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : getInitials(name)}
    </div>
  )
}
