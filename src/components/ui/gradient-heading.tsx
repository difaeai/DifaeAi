import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GradientHeadingProps extends HTMLAttributes<HTMLHeadingElement> {}

export function GradientHeading({ className, ...props }: GradientHeadingProps) {
  return (
    <h2
      className={cn(
        "bg-gradient-to-r from-primary via-primary/70 to-accent bg-clip-text font-headline text-3xl font-semibold tracking-tight text-transparent sm:text-4xl lg:text-5xl",
        className,
      )}
      {...props}
    />
  );
}
