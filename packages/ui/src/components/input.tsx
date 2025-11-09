"use client";

import * as React from 'react';
import { cn } from '../utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/50 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
