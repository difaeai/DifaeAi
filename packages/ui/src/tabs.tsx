'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from './cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps extends TabsPrimitive.TabsProps {
  items: TabItem[];
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
}

export function Tabs({
  items,
  className,
  listClassName,
  triggerClassName,
  defaultValue,
  ...props
}: TabsProps) {
  if (!items.length) {
    return null;
  }

  const fallbackValue = items[0]?.id;

  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue ?? fallbackValue}
      {...props}
      className={cn('space-y-4', className)}
    >
      <TabsPrimitive.List
        className={cn(
          'flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 text-sm text-white/60',
          listClassName
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.id}
            value={item.id}
            className={cn(
              'flex-1 rounded-xl px-4 py-2 font-medium transition',
              'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm',
              'hover:text-white',
              triggerClassName
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.id}
          value={item.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
