import * as React from 'react'
import { cn } from './Button'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'pink' | 'cyan' | 'success' | 'warning'
  size?: 'sm' | 'md'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white/10 text-white/80 border border-white/10',
      pink: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      success: 'bg-green-500/20 text-green-300 border border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'