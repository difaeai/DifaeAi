import * as React from 'react';
import { cn } from '../utils/cn';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_70px_rgba(11,18,32,0.45)] backdrop-blur-lg transition-transform hover:-translate-y-1',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('mb-6 flex flex-col gap-3', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3 className={cn('text-xl font-semibold text-white', className)} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={cn('text-sm text-white/70', className)} {...props} />
);
