import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', loading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mfy-dark-400 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      primary: 'bg-gradient-to-r from-pink-600 to-pink-700 text-white hover:from-pink-500 hover:to-pink-600 active:from-pink-700 active:to-pink-800 shadow-glow-pink',
      secondary: 'glass text-white border border-white/10 hover:bg-white/10 hover:border-white/20 active:bg-white/5',
      ghost: 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/5',
      icon: 'p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 active:bg-white/5',
    }

    const sizes = {
      default: 'px-5 py-2.5 text-sm',
      sm: 'px-3 py-1.5 text-xs',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'