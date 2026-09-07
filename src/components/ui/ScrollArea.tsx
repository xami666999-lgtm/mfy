import * as React from 'react'
import { cn } from './Button'

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  horizontal?: boolean
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, horizontal, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20',
        horizontal ? 'flex overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

ScrollArea.displayName = 'ScrollArea'