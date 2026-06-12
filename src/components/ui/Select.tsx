import { cn } from '../../lib/utils'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            {...props}
            className={cn(
              'w-full appearance-none text-sm bg-white dark:bg-gray-900 border rounded-lg px-3 py-2 pr-8',
              'text-gray-900 dark:text-gray-100',
              'border-gray-200 dark:border-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150',
              error && 'border-red-500',
              className
            )}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
