import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";
import { Container } from "./container";

interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  background?: "default" | "muted" | "tint";
  id?: string;
}

export function PageSection({
  className,
  children,
  background = "default",
  id,
  ...props
}: PageSectionProps) {
  const backgroundClass =
    background === "muted"
      ? "bg-muted/60"
      : background === "tint"
        ? "bg-gradient-to-b from-white/80 via-background to-white/70"
        : "";

  return (
    <section
      id={id}
      className={cn("py-16 sm:py-20 lg:py-28", backgroundClass, className)}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
}
