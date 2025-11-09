"use client";

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(79,70,229,0.35)]',
  {
    variants: {
      variant: {
        primary: 'bg-[#4F46E5] text-white hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(79,70,229,0.4)] focus-visible:ring-[#22D3EE] focus-visible:ring-offset-[#0B1220]',
        secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-[#0B1220]',
        outline: 'border border-white/30 text-white bg-transparent hover:bg-white/10 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-[#0B1220]',
        ghost: 'text-white/80 hover:text-white hover:bg-white/10 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-[#0B1220]'
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-11 px-6',
        lg: 'h-12 px-8 text-base'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
