'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  bgColorClass?: string;
  textColorClass?: string;
  onClick: (e: React.MouseEvent) => void;
}

interface ListRowProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  subvalue?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
  swipeActions?: SwipeAction[];
  className?: string;
  pressFeedback?: boolean;
}

let hasNudgedSession = false;

export default function ListRow({
  icon,
  title,
  subtitle,
  value,
  subvalue,
  badge,
  onClick,
  swipeActions = [],
  className = '',
  pressFeedback = true,
}: ListRowProps) {
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isNudging, setIsNudging] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const maxSwipeOffset = swipeActions.length * 70; // 70px per action button

  useEffect(() => {
    if (swipeActions.length > 0 && !hasNudgedSession) {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('agora_swipe_nudged')) {
        hasNudgedSession = true;
        sessionStorage.setItem('agora_swipe_nudged', 'true');
        const timer1 = setTimeout(() => setIsNudging(true), 400);
        const timer2 = setTimeout(() => setIsNudging(false), 1200);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [swipeActions]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (swipeActions.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || swipeActions.length === 0)
      return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Only swipe if horizontal movement dominates vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swiping left to reveal actions
        const newOffset = Math.min(maxSwipeOffset, Math.abs(diffX));
        setSwipeOffset(newOffset);
      } else if (diffX > 0 && swipeOffset > 0) {
        // Swiping back right
        const newOffset = Math.max(0, swipeOffset - diffX);
        setSwipeOffset(newOffset);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    if (swipeOffset > maxSwipeOffset / 2) {
      setSwipeOffset(maxSwipeOffset);
    } else {
      setSwipeOffset(0);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const resetSwipe = () => {
    setSwipeOffset(0);
  };

  const effectiveOffset = isNudging ? 15 : swipeOffset;

  return (
    <div className="relative group overflow-hidden rounded-2xl mb-1.5 transition-all select-none">
      {/* Swipe Actions Background Layer (Mobile / Touch) */}
      {swipeActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end z-0 pr-1">
          {swipeActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetSwipe();
                  act.onClick(e);
                }}
                className={`h-[calc(100%-8px)] my-auto px-4 flex flex-col items-center justify-center font-bold text-xs rounded-xl transition-transform ${
                  act.bgColorClass || 'bg-agora-terracotta text-agora-card'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 mb-0.5" />}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop Hover Action Shortcuts (Non-Touch / Mouse users) */}
      {swipeActions.length > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-agora-card/95 backdrop-blur-sm p-1 rounded-xl shadow-md border border-agora-border">
          {swipeActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetSwipe();
                  act.onClick(e);
                }}
                className={`px-2.5 py-1 flex items-center gap-1 font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-sm ${
                  act.bgColorClass || 'bg-agora-terracotta text-agora-card'
                }`}
                title={act.label}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Foreground Main Row Content */}
      <div
        onClick={() => {
          if (swipeOffset > 0) {
            resetSwipe();
          } else if (onClick) {
            onClick();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(-${effectiveOffset}px)` }}
        className={`relative z-10 bg-agora-card border border-agora-border/80 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-transform duration-200 ease-out select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${
          pressFeedback && onClick
            ? 'active:scale-[0.99] active:bg-agora-bg hover:border-agora-brass/50'
            : ''
        } ${className}`}
      >
        {/* Left Icon / Avatar Slot */}
        {icon && <div className="shrink-0 flex items-center justify-center">{icon}</div>}

        {/* Middle Two-Line Block */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="font-bold text-agora-ink text-sm leading-snug truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-agora-ink-muted font-medium truncate">{subtitle}</div>
          )}
        </div>

        {/* Right-Aligned Value & Badges Block */}
        <div className="text-right shrink-0 flex flex-col items-end space-y-1 sm:group-hover:opacity-20 transition-opacity">
          {value && (
            <div className="font-serif font-bold text-agora-ink text-sm sm:text-base leading-none">
              {value}
            </div>
          )}
          {badge ? (
            <div>{badge}</div>
          ) : subvalue ? (
            <div className="text-xs text-agora-ink-muted font-medium">{subvalue}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
