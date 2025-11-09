import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, href, badge, className }: FeatureCardProps) {
  const content = (
    <div
      className={cn(
        "group flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-white/80 p-6 shadow-lg shadow-primary/10 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        {badge && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-headline text-xl font-semibold text-text">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
      {href && (
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Explore
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
