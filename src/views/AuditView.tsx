'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StockMovement, MovementReason } from '@/types';
import { api } from '@/services/api';
import { formatDate } from '@/utils/formatters';
import ListRow from '@/components/common/ListRow';
import FilterSheet from '@/components/common/FilterSheet';
import ListSkeleton from '@/components/common/ListSkeleton';
import {
  FileText,
  Search,
  PlusCircle,
  ShoppingCart,
  RotateCcw,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const BATCH_SIZE = 25;

function getDateGroupLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) return 'Today';
  if (target.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AuditView() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [displayCount, setDisplayCount] = useState<number>(BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStockMovements();
      setMovements(data);
    } catch (err) {
      console.error('Error loading activity log:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesReason = reasonFilter === 'ALL' || m.reason === reasonFilter;
      const matchesSearch =
        m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.reference_id || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesReason && matchesSearch;
    });
  }, [movements, reasonFilter, searchQuery]);

  // Infinite Scroll Sentinel Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => Math.min(filteredMovements.length, prev + BATCH_SIZE));
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [filteredMovements]);

  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [reasonFilter, searchQuery]);

  const displayedMovements = useMemo(() => {
    return filteredMovements.slice(0, displayCount);
  }, [filteredMovements, displayCount]);

  const groupedMovements = useMemo(() => {
    const groups: { label: string; items: StockMovement[] }[] = [];
    const map = new Map<string, StockMovement[]>();

    displayedMovements.forEach((m) => {
      const label = getDateGroupLabel(m.timestamp);
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(m);
    });

    map.forEach((items, label) => {
      groups.push({ label, items });
    });

    return groups;
  }, [displayedMovements]);

  const activeFilterCount = reasonFilter !== 'ALL' ? 1 : 0;

  const getReasonBadge = (reason: MovementReason) => {
    switch (reason) {
      case 'SALE':
        return (
          <span className="px-2 py-0.5 rounded-full bg-agora-bg text-agora-ink text-[10px] font-bold border border-agora-border flex items-center gap-1 w-max">
            <ShoppingCart className="w-3 h-3 text-agora-terracotta" /> Sale
          </span>
        );
      case 'RESTOCK':
        return (
          <span className="px-2 py-0.5 rounded-full bg-agora-sage-light border border-agora-sage-border text-agora-sage text-[10px] font-bold flex items-center gap-1 w-max">
            <PlusCircle className="w-3 h-3 text-agora-sage" /> Restock
          </span>
        );
      case 'VOID_SALE':
        return (
          <span className="px-2 py-0.5 rounded-full bg-agora-brick-light border border-agora-brick-border text-agora-brick text-[10px] font-bold flex items-center gap-1 w-max">
            <RotateCcw className="w-3 h-3 text-agora-brick" /> Voided
          </span>
        );
      case 'MANUAL_ADJUSTMENT':
        return (
          <span className="px-2 py-0.5 rounded-full bg-agora-brass-light border border-agora-brass-border text-agora-brass text-[10px] font-bold flex items-center gap-1 w-max">
            <Edit3 className="w-3 h-3 text-agora-brass" /> Edit
          </span>
        );
      default:
        return <span className="text-agora-ink-muted text-[10px]">{reason}</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-agora-ink pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-black text-agora-ink tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-agora-terracotta" />
          Activity
        </h1>
      </div>

      {/* Toolbar: Search + FilterSheet */}
      <div className="ledger-card p-3 sm:p-4 shadow-sm flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-agora-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product or note..."
            className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 pl-9 pr-4 text-xs text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
          />
        </div>

        <FilterSheet
          activeCount={activeFilterCount}
          title="Filter Activity Log"
          onReset={() => setReasonFilter('ALL')}
        >
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
              Event Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'ALL', label: 'All Events' },
                { id: 'SALE', label: 'Sales' },
                { id: 'RESTOCK', label: 'Restocks' },
                { id: 'VOID_SALE', label: 'Voided' },
                { id: 'MANUAL_ADJUSTMENT', label: 'Edits' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setReasonFilter(f.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    reasonFilter === f.id
                      ? 'bg-agora-terracotta/15 border-agora-terracotta text-agora-terracotta shadow-sm'
                      : 'bg-agora-bg border-agora-border text-agora-ink-muted hover:text-agora-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </FilterSheet>
      </div>

      {/* Wallet-App Date-Grouped List View */}
      <div className="space-y-4">
        {isLoading ? (
          <ListSkeleton count={6} />
        ) : filteredMovements.length === 0 ? (
          <div className="ledger-card p-8 text-center text-xs text-agora-ink-muted">
            No activity recorded.
          </div>
        ) : (
          groupedMovements.map((group) => (
            <div key={group.label} className="space-y-1.5">
              {/* Sticky Date Group Header */}
              <div className="sticky top-[56px] sm:top-[65px] z-10 bg-agora-bg/95 backdrop-blur-sm py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-agora-brass border-b border-agora-border/60">
                {group.label}
              </div>

              {/* Event Rows */}
              {group.items.map((m) => {
                const isPositive = m.change_amount > 0;

                return (
                  <ListRow
                    key={m.id}
                    icon={
                      <div className="bg-agora-card p-2.5 rounded-xl border border-agora-border/80 shrink-0">
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4 text-agora-sage" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-agora-terracotta" />
                        )}
                      </div>
                    }
                    title={m.product_name}
                    subtitle={
                      <span className="text-agora-ink-muted">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {m.note || 'No note'}
                      </span>
                    }
                    value={
                      <span
                        className={`font-serif font-bold text-sm inline-flex items-center gap-0.5 ${
                          isPositive ? 'text-agora-sage' : 'text-agora-terracotta'
                        }`}
                      >
                        {isPositive ? `+${m.change_amount}` : m.change_amount} pcs
                      </span>
                    }
                    subvalue={<span>After: {m.quantity_after} pcs</span>}
                    badge={getReasonBadge(m.reason)}
                  />
                );
              })}
            </div>
          ))
        )}

        {/* Sentinel element for infinite scroll */}
        <div ref={sentinelRef} className="h-4 w-full" />
      </div>
    </div>
  );
}
