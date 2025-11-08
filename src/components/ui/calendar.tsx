"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CalendarProps = {
  className?: string;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
};

function formatDateValue(date: Date | undefined): string {
  if (!date) {
    return "";
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? undefined : result;
}

function Calendar({ className, selected, onSelect, disabled }: CalendarProps) {
  const [value, setValue] = React.useState<string>(() => formatDateValue(selected));

  React.useEffect(() => {
    setValue(formatDateValue(selected));
  }, [selected?.getTime?.()]);

  return (
    <div className={cn("p-3", className)}>
      <input
        type="date"
        className={cn(
          "flex h-9 w-full items-center justify-center rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          disabled ? "opacity-50" : ""
        )}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          onSelect?.(parseDateValue(next));
        }}
        disabled={disabled}
      />
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
