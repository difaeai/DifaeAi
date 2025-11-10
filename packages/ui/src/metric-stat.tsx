import * as React from 'react';

import { cn } from './cn';

export interface MetricStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  trend?: string;
}

export function MetricStat({ label, value, trend, className, ...props }: MetricStatProps) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 text-white shadow-lg shadow-black/5 backdrop-blur',
        className
      )}
      {...props}
    >
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">{label}</span>
      <span className="mt-4 text-3xl font-semibold text-white">{value}</span>
      {trend ? <span className="mt-2 text-sm text-white/60">{trend}</span> : null}
    </div>
  );
}
