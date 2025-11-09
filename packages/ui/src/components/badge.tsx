import * as React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'accent' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  tone = 'accent',
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
      tone === 'accent'
        ? 'bg-[#22D3EE]/15 text-[#22D3EE]'
        : 'bg-white/10 text-white/70',
      className
    )}
    {...props}
  />
);
