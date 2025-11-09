import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";

interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, icon, className, ...props }: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/5 backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 text-primary">
        {icon && <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span>}
        <span className="text-sm font-medium uppercase tracking-[0.18em] text-primary/70">{label}</span>
      </div>
      <p className="mt-6 font-headline text-3xl font-semibold text-text">{value}</p>
    </div>
  );
}
