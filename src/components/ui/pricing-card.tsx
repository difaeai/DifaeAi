import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { HTMLAttributes } from "react";
import { Button } from "./button";

interface PricingCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  ctaLabel,
  ctaHref,
  featured,
  className,
  ...props
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-3xl border border-border/60 bg-white/80 p-8 shadow-xl shadow-primary/10",
        featured && "border-primary/70 bg-white",
        className,
      )}
      {...props}
    >
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/70">{name}</p>
        <h3 className="mt-4 font-headline text-4xl font-semibold text-text">{price}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
      <ul className="space-y-3 text-sm text-text/90">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-1 h-4 w-4 text-success" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button asChild size="lg" className="mt-8 w-full rounded-full">
        <a href={ctaHref}>{ctaLabel}</a>
      </Button>
    </div>
  );
}
