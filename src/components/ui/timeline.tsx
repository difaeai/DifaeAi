import { cn } from "@/lib/utils";

export interface TimelineItem {
  title: string;
  description: string;
  eyebrow?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("grid gap-10 md:grid-cols-3", className)}>
      {items.map((item, index) => (
        <div key={item.title} className="relative">
          <div className="flex items-center gap-3 text-primary/80">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-headline text-lg font-semibold text-primary">
              {index + 1}
            </span>
            {item.eyebrow && (
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/70">{item.eyebrow}</span>
            )}
          </div>
          <div className="mt-6 space-y-3 rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/10">
            <h3 className="font-headline text-xl font-semibold text-text">{item.title}</h3>
            <p className="text-sm text-muted">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
