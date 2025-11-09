"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  side = 'right',
  children
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return isOpen
    ? createPortal(
        <div className="fixed inset-0 z-40 flex">
          <button
            aria-label="Close drawer"
            className="h-full w-full bg-black/60"
            onClick={onClose}
          />
          <aside
            className={cn(
              'relative h-full w-full max-w-md border-l border-white/10 bg-[#0B1220]/95 shadow-[0_0_50px_rgba(11,18,32,0.65)] transition-transform duration-300 ease-out',
              side === 'right' ? 'translate-x-0' : 'order-first border-l-0 border-r'
            )}
          >
            <div className="h-full overflow-y-auto p-8">{children}</div>
          </aside>
        </div>,
        document.body
      )
    : null;
};
