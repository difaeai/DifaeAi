"use client";

import { cn } from "@/lib/utils";
import { ElementType, ReactNode, useEffect, useRef, useState } from "react";

interface FadeInProps {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function FadeIn({ as: Component = "div", delay = 0, className, children }: FadeInProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Component
      ref={ref as any}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "translate-y-6 opacity-0 transition-all duration-700 ease-out will-change-transform",
        isVisible && "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </Component>
  );
}
