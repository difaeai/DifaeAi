"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children }) => {
  const [mounted, setMounted] = React.useState(false);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);

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
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
          onClick={(event) => {
            if (event.target === overlayRef.current) {
              onClose();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1220]/90 p-8 shadow-[0_30px_70px_rgba(11,18,32,0.65)]">
            {children}
          </div>
        </div>,
        document.body
      )
    : null;
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('mb-6 flex flex-col gap-2', className)} {...props} />;

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => <h2 className={cn('text-2xl font-semibold text-white', className)} {...props} />;

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('text-sm text-white/70', className)} {...props} />;
