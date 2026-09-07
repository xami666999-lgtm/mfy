import * as React from 'react'
import { cn } from './Button'

interface SelectOption {
  value: string
  label: string
  description?: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, id, ...props }, ref) => {
    const selectId = id || placeholder?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className="w-full">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'input-base w-full appearance-none bg-mfy-dark-300/50',
            'focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'