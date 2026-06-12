import { cn } from '../../lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconRight, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
        <div className="relative">
          {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
          <input
            ref={ref}
            {...props}
            className={cn(
              'w-full text-sm bg-white dark:bg-gray-900 border rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-600',
              'border-gray-200 dark:border-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150',
              icon && 'pl-9',
              iconRight && 'pr-9',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
          />
          {iconRight && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{iconRight}</span>}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
