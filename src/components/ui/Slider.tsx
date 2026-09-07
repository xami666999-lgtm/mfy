import * as React from 'react'
import { cn } from './Button'

interface SliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
  id?: string
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, value, onChange, min = 0, max = 1, step = 0.01, id, disabled, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100
    const sliderId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={sliderId} className="block text-sm font-medium text-white/70 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={sliderId}
          type="range"
          className={cn(
            'progress-bar w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:ring-offset-2 focus:ring-offset-mfy-dark-400',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          style={{
            background: `linear-gradient(to right, #FF1493 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`,
          }}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = 'Slider'