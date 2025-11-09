"use client";

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 pr-10 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
      </div>
    );
  }
);
Select.displayName = 'Select';
