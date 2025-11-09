import * as React from 'react';

export interface MetricStatProps {
  label: string;
  value: string;
  trend?: string;
}

export const MetricStat: React.FC<MetricStatProps> = ({ label, value, trend }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-[0_20px_50px_rgba(11,18,32,0.45)]">
    <div className="text-xs uppercase tracking-[0.2em] text-[#22D3EE]/80">{label}</div>
    <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    {trend ? (
      <div className="mt-3 text-xs text-white/60">{trend}</div>
    ) : null}
  </div>
);
