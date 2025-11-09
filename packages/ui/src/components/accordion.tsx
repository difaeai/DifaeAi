"use client";

import * as React from 'react';
import { cn } from '../utils/cn';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, defaultOpenId }) => {
  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId ?? null);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              'overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg transition'
            )}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <span>{item.title}</span>
              <span className="ml-4 text-[#22D3EE]">{isOpen ? '−' : '+'}</span>
            </button>
            <div
              className={cn(
                'grid transition-all duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden px-6 pb-6 text-sm text-white/70">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
