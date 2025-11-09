"use client";

import * as React from 'react';
import { cn } from '../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, defaultValue }) => {
  const [active, setActive] = React.useState<string>(defaultValue ?? items[0]?.id ?? '');

  return (
    <div className="w-full">
      <div className="flex gap-2 rounded-full bg-white/5 p-1">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-[#4F46E5] text-white shadow-[0_10px_30px_rgba(79,70,229,0.35)]'
                  : 'text-white/60 hover:text-white'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6 rounded-3xl border border-white/5 bg-white/5 p-6 text-white/80">
        {items.find((item) => item.id === active)?.content}
      </div>
    </div>
  );
};
