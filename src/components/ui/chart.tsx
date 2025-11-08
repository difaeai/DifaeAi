"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; icon?: React.ComponentType; color?: string }>;

type ChartContextValue = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

export type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode | ((dimensions: { width: number; height: number }) => React.ReactNode);
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, children, config, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    const [size, setSize] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
      const element = containerRef.current;
      if (!element) return;
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const box = entry.contentRect;
          setSize({ width: box.width, height: box.height });
        }
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const content = React.useMemo(() => {
      if (typeof children === "function") {
        return children(size);
      }
      return children;
    }, [children, size]);

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={mergedRef}
          className={cn("flex w-full flex-col gap-3 rounded-lg border border-border/50 bg-background p-4", className)}
          {...props}
        >
          {content}
        </div>
      </ChartContext.Provider>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

export type ChartTooltipProps = React.HTMLAttributes<HTMLDivElement>;

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-md border border-border/60 bg-popover px-3 py-2 text-xs shadow-sm", className)}
    {...props}
  >
    {children}
  </div>
));
ChartTooltip.displayName = "ChartTooltip";

export type ChartTooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  value?: React.ReactNode;
};

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ className, children, title, value, ...props }, ref) => (
    <ChartTooltip ref={ref} className={className} {...props}>
      <div className="grid gap-1.5">
        {title ? <span className="font-medium text-foreground">{title}</span> : null}
        {value ? <span className="font-mono text-sm text-muted-foreground">{value}</span> : null}
        {children}
      </div>
    </ChartTooltip>
  )
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export type ChartLegendProps = React.HTMLAttributes<HTMLDivElement> & {
  items?: Array<{ key: string; label?: React.ReactNode }>;
};

const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(({ className, items, children, ...props }, ref) => {
  const { config } = useChart();
  const legendItems = items ?? Object.entries(config).map(([key, value]) => ({ key, label: value.label ?? key }));

  return (
    <div ref={ref} className={cn("flex flex-wrap items-center gap-3 text-xs text-muted-foreground", className)} {...props}>
      {legendItems.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5">
          <span className="inline-flex h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden />
          <span>{item.label}</span>
        </div>
      ))}
      {children}
    </div>
  );
});
ChartLegend.displayName = "ChartLegend";

const ChartLegendContent = ChartLegend;

const ChartStyle: React.FC<{ id: string; config: ChartConfig }> = () => null;

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, useChart };
