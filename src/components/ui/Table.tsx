import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-gray-100 dark:border-gray-800">{children}</thead>
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">{children}</tbody>
}

export function Tr({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-100',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className, colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn('px-4 py-3 text-gray-700 dark:text-gray-300', className)}>{children}</td>
}
