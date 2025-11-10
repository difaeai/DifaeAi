import * as React from 'react';

import { cn } from './cn';

type BadgeTone = 'accent' | 'neutral' | 'danger' | 'success';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, string> = {
  accent: 'border-transparent bg-primary/90 text-white',
  neutral: 'border border-white/20 bg-white/5 text-white/80',
  danger: 'border-transparent bg-destructive/80 text-white',
  success: 'border-transparent bg-emerald-500 text-white'
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = 'accent', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
          'shadow-sm ring-1 ring-inset ring-white/10 backdrop-blur-sm',
          toneStyles[tone],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
