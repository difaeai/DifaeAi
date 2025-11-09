import * as React from 'react';
import { cn } from '../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'animate-pulse rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 text-transparent',
      className
    )}
    {...props}
  />
);
