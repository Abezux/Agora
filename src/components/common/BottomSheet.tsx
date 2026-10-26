'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  maxWidthClass = 'max-w-lg',
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-agora-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`bg-agora-card border border-agora-border rounded-t-3xl sm:rounded-3xl w-full ${maxWidthClass} shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-agora-ink`}
      >
        {/* Mobile Pull/Drag Handle Indicator */}
        <div className="w-12 h-1 rounded-full bg-agora-border/80 mx-auto my-2 shrink-0 sm:hidden" />

        {/* Optional Header */}
        {(title || subtitle || headerRight) && (
          <div className="px-5 py-3.5 border-b border-agora-border flex items-center justify-between bg-agora-bg/50 shrink-0">
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (
                <h3 className="font-serif font-bold text-agora-ink text-base sm:text-lg leading-tight truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-agora-ink-muted mt-0.5 font-medium truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              {headerRight}
              <button
                onClick={onClose}
                className="text-agora-ink-muted hover:text-agora-ink p-1.5 rounded-xl hover:bg-agora-bg transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 text-agora-ink space-y-4">{children}</div>
      </div>
    </div>
  );
}
