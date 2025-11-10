import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoCloudItem {
  name: string;
  src?: string;
}

interface LogoCloudProps {
  logos: LogoCloudItem[];
  className?: string;
}

export function LogoCloud({ logos, className }: LogoCloudProps) {
  return (
    <div className={cn("grid items-center gap-6 sm:grid-cols-3 lg:grid-cols-6", className)}>
      {logos.map((logo) => (
        <div
          key={logo.name}
          className="flex h-16 items-center justify-center rounded-2xl border border-border/60 bg-white/70 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-inner shadow-primary/5"
        >
          {logo.src ? (
            <Image src={logo.src} alt={logo.name} width={120} height={40} className="max-h-10 w-auto object-contain" />
          ) : (
            <span>{logo.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}
