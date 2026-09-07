import * as React from 'react'
import { cn } from './Button'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <label className="flex items-center gap-3 cursor-pointer" htmlFor={switchId}>
        <div className="relative">
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            className="peer h-6 w-6 appearance-none rounded-full bg-white/10 border border-white/20 checked:bg-pink-500 checked:border-pink-500 checked:after:translate-x-full transition-all duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mfy-dark-400 disabled:opacity-50 disabled:cursor-not-allowed"
            {...props}
          />
        </div>
        {label && (
          <span className="text-sm font-medium text-white/80 peer-disabled:text-white/40">{label}</span>
        )}
      </label>
    )
  }
)

Switch.displayName = 'Switch'