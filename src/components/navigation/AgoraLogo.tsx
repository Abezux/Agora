import React from 'react';

interface AgoraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function AgoraLogo({
  className = '',
  size = 'md',
  showSubtitle = true,
}: AgoraLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-xl',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Alpha Monogram with Ledger Line */}
      <div
        className={`${iconSizes[size]} bg-agora-terracotta text-agora-card rounded-xl flex items-center justify-center font-serif font-black shadow-sm shrink-0 border border-agora-terracotta-hover relative overflow-hidden`}
      >
        {/* Monogram Symbol: Alpha Α with Ledger Line */}
        <span className="relative z-10 leading-none">Α</span>
        <div className="absolute inset-x-0 top-1/2 h-[2px] bg-agora-card/70 -translate-y-1/2 z-20 pointer-events-none" />
      </div>

      <div className="flex flex-col">
        <span
          className={`${titleSizes[size]} font-serif font-extrabold tracking-tight text-agora-ink leading-none`}
        >
          AGORA
        </span>
        {showSubtitle && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-agora-brass mt-0.5 leading-none">
            Digital Ledger
          </span>
        )}
      </div>
    </div>
  );
}
