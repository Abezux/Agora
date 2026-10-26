'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sale, StoreSettings } from '@/types';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
import { formatDate, isToday } from '@/utils/formatters';
import { calculateNetRevenue } from '@/utils/revenue';
import SaleDetailModal from '@/components/sales/SaleDetailModal';
import VoidSaleModal from '@/components/sales/VoidSaleModal';
import ListRow, { SwipeAction } from '@/components/common/ListRow';
import FilterSheet from '@/components/common/FilterSheet';
import ListSkeleton from '@/components/common/ListSkeleton';
import {
  History,
  Receipt,
  CheckCircle,
  Ban,
  Search,
  DollarSign,
  CreditCard,
  Smartphone,
  Layers,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

const BATCH_SIZE = 25;

function getPaymentIcon(method?: string) {
  switch (method) {
    case 'CARD':
      return <CreditCard className="w-5 h-5 text-agora-brass" />;
    case 'MOBILE_MONEY':
      return <Smartphone className="w-5 h-5 text-agora-sage" />;
    case 'SPLIT':
      return <Layers className="w-5 h-5 text-agora-terracotta" />;
    default:
      return <DollarSign className="w-5 h-5 text-agora-terracotta" />;
  }
}

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

export default function SalesView() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Agora Kiosk',
    currency_symbol: '$',
    currency_code: 'USD',
    low_stock_alerts_enabled: true,
    business_type: 'GENERAL_RETAIL',
    expiry_alert_days: 30,
    custom_attributes: [],
  });
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'ALL'>(
    'TODAY'
  );
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'COMPLETED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'VOIDED'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState<number>(BATCH_SIZE);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
  const [isVoidOpen, setIsVoidOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesData, stgs] = await Promise.all([api.getSales(), api.getSettings()]);
      setSales(salesData);
      setSettings(stgs);
    } catch (err) {
      console.error('Error loading sales history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;

    return sales.filter((s) => {
      const time = new Date(s.timestamp).getTime();

      if (dateFilter === 'TODAY' && !isToday(s.timestamp)) return false;
      if (dateFilter === 'YESTERDAY' && (time < yesterdayStart || time >= todayStart)) return false;
      if (dateFilter === 'THIS_WEEK' && time < weekStart) return false;

      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesReceipt = s.sale_number.toLowerCase().includes(query);
        const matchesMethod = (s.payment_method || '').toLowerCase().includes(query);
        const matchesItems = s.items?.some((i) => i.product_name.toLowerCase().includes(query));
        if (!matchesReceipt && !matchesMethod && !matchesItems) return false;
      }

      return true;
    });
  }, [sales, dateFilter, statusFilter, searchQuery]);

  // Infinite Scroll Sentinel Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => Math.min(filteredSales.length, prev + BATCH_SIZE));
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [filteredSales]);

  // Reset display batch count when filters change
  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [dateFilter, statusFilter, searchQuery]);

  const displayedSales = useMemo(() => {
    return filteredSales.slice(0, displayCount);
  }, [filteredSales, displayCount]);

  // Group sales by date for sticky headers
  const groupedSales = useMemo(() => {
    const groups: { label: string; items: Sale[] }[] = [];
    const map = new Map<string, Sale[]>();

    displayedSales.forEach((s) => {
      const label = getDateGroupLabel(s.timestamp);
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(s);
    });

    map.forEach((items, label) => {
      groups.push({ label, items });
    });

    return groups;
  }, [displayedSales]);

  const totalNetRevenueCents = useMemo(() => {
    return calculateNetRevenue(filteredSales);
  }, [filteredSales]);

  const completedSalesCount = useMemo(() => {
    return filteredSales.filter(
      (s) => s.status === 'COMPLETED' || s.status === 'PARTIALLY_REFUNDED'
    ).length;
  }, [filteredSales]);

  const voidedSalesCount = useMemo(() => {
    return filteredSales.filter((s) => s.status === 'VOIDED').length;
  }, [filteredSales]);

  const activeFilterCount = (dateFilter !== 'TODAY' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0);

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handleRequestVoidFromDetail = (sale: Sale) => {
    setIsDetailOpen(false);
    setSaleToVoid(sale);
    setIsVoidOpen(true);
  };

  const handleProcessRefund = async (
    saleId: string,
    refundItems: { sale_item_id: string; quantity: number }[],
    reason?: string
  ) => {
    const updatedSale = await api.processRefund(saleId, refundItems, reason);
    setSelectedSale(updatedSale);
    await loadData();
  };

  const handleConfirmVoid = async (saleId: string, reason: string) => {
    await api.voidSale(saleId, reason);
    await loadData();
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-agora-ink pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-agora-ink tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 sm:w-7 sm:h-7 text-agora-terracotta" />
            Sales
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="ledger-card p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-agora-ink-muted text-xs font-bold">
            <span>Net Revenue</span>
            <DollarSign className="w-4 h-4 text-agora-terracotta" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-black text-agora-terracotta mt-1.5">
            {formatCurrency(totalNetRevenueCents, settings.currency_symbol)}
          </div>
          <span className="text-[10px] text-agora-ink-muted font-medium">Gross minus refunds</span>
        </div>

        <div className="ledger-card p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-agora-ink-muted text-xs font-bold">
            <span>Active Sales</span>
            <CheckCircle className="w-4 h-4 text-agora-sage" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-black text-agora-ink mt-1.5">
            {completedSalesCount}
          </div>
          <span className="text-[10px] text-agora-ink-muted font-medium">Completed & Partial</span>
        </div>

        <div className="ledger-card p-3.5 sm:p-4 border-agora-brick-border bg-agora-brick-light/30">
          <div className="flex items-center justify-between text-agora-brick text-xs font-bold">
            <span>Voided Sales</span>
            <Ban className="w-4 h-4 text-agora-brick" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-black text-agora-brick mt-1.5">
            {voidedSalesCount}
          </div>
          <span className="text-[10px] text-agora-brick font-semibold">Stock restored</span>
        </div>
      </div>

      {/* Toolbar: Search + FilterSheet Trigger */}
      <div className="ledger-card p-3 sm:p-4 shadow-sm flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-agora-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt # or payment..."
            className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 pl-9 pr-4 text-xs text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
          />
        </div>

        <FilterSheet
          activeCount={activeFilterCount}
          title="Filter Sales Ledger"
          onReset={() => {
            setDateFilter('TODAY');
            setStatusFilter('ALL');
          }}
        >
          {/* Date Range Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
              Date Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'TODAY', label: 'Today' },
                  { id: 'YESTERDAY', label: 'Yesterday' },
                  { id: 'THIS_WEEK', label: 'This Week' },
                  { id: 'ALL', label: 'All Time' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDateFilter(f.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    dateFilter === f.id
                      ? 'bg-agora-terracotta/15 border-agora-terracotta text-agora-terracotta shadow-sm'
                      : 'bg-agora-bg border-agora-border text-agora-ink-muted hover:text-agora-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
              Transaction Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'ALL', label: 'All Statuses' },
                  { id: 'COMPLETED', label: 'Completed' },
                  { id: 'PARTIALLY_REFUNDED', label: 'Partial Refund' },
                  { id: 'REFUNDED', label: 'Fully Refunded' },
                  { id: 'VOIDED', label: 'Voided' },
                ] as const
              ).map((sf) => (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => setStatusFilter(sf.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    statusFilter === sf.id
                      ? 'bg-agora-brass/15 border-agora-brass text-agora-brass shadow-sm'
                      : 'bg-agora-bg border-agora-border text-agora-ink-muted hover:text-agora-ink'
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>
          </div>
        </FilterSheet>
      </div>

      {/* Wallet-App Row-List View with Sticky Headers & Infinite Scroll */}
      <div className="space-y-4">
        {isLoading ? (
          <ListSkeleton count={6} />
        ) : filteredSales.length === 0 ? (
          <div className="ledger-card p-8 text-center text-xs text-agora-ink-muted">
            No sales recorded for this period.
          </div>
        ) : (
          groupedSales.map((group) => (
            <div key={group.label} className="space-y-1.5">
              {/* Sticky Date Group Header */}
              <div className="sticky top-[56px] sm:top-[65px] z-10 bg-agora-bg/95 backdrop-blur-sm py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-agora-brass border-b border-agora-border/60">
                {group.label}
              </div>

              {/* Group Rows */}
              {group.items.map((sale) => {
                const isVoided = sale.status === 'VOIDED';
                const isPartiallyRefunded = sale.status === 'PARTIALLY_REFUNDED';
                const isFullyRefunded = sale.status === 'REFUNDED';

                const swipeActions: SwipeAction[] = [];
                if (!isVoided) {
                  if (!isFullyRefunded) {
                    swipeActions.push({
                      id: 'refund',
                      label: 'Refund',
                      icon: RotateCcw,
                      bgColorClass: 'bg-agora-brass text-agora-card',
                      onClick: () => handleOpenDetail(sale),
                    });
                  }
                  swipeActions.push({
                    id: 'void',
                    label: 'Void',
                    icon: Ban,
                    bgColorClass: 'bg-agora-brick text-agora-card',
                    onClick: () => handleRequestVoidFromDetail(sale),
                  });
                }

                return (
                  <ListRow
                    key={sale.id}
                    onClick={() => handleOpenDetail(sale)}
                    swipeActions={swipeActions}
                    icon={
                      <div className="bg-agora-terracotta/10 p-2.5 rounded-xl border border-agora-terracotta/20 shrink-0">
                        {getPaymentIcon(sale.payment_method)}
                      </div>
                    }
                    title={
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-agora-terracotta inline" />
                        {sale.sale_number}
                        <span className="text-[11px] text-agora-ink-muted font-semibold">
                          ({sale.items_count} {sale.items_count === 1 ? 'item' : 'items'})
                        </span>
                      </span>
                    }
                    subtitle={
                      <span className="text-agora-ink-muted">
                        {new Date(sale.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {sale.payment_method || 'CASH'}
                      </span>
                    }
                    value={formatCurrency(sale.total_amount, settings.currency_symbol)}
                    badge={
                      isVoided ? (
                        <span className="px-2 py-0.5 rounded-full bg-agora-brick-light border border-agora-brick-border text-agora-brick text-[10px] font-bold inline-flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Voided
                        </span>
                      ) : isFullyRefunded ? (
                        <span className="px-2 py-0.5 rounded-full bg-agora-brick-light border border-agora-brick-border text-agora-brick text-[10px] font-bold inline-flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Refunded
                        </span>
                      ) : isPartiallyRefunded ? (
                        <span className="px-2 py-0.5 rounded-full bg-agora-brass/10 border border-agora-brass/30 text-agora-brass text-[10px] font-bold inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Partial Refund
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-agora-sage-light border border-agora-sage-border text-agora-sage text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Done
                        </span>
                      )
                    }
                  />
                );
              })}
            </div>
          ))
        )}

        {/* Sentinel element for infinite scroll */}
        <div ref={sentinelRef} className="h-4 w-full" />
      </div>

      <SaleDetailModal
        isOpen={isDetailOpen}
        sale={selectedSale}
        currencySymbol={settings.currency_symbol}
        onClose={() => setIsDetailOpen(false)}
        onRequestVoid={handleRequestVoidFromDetail}
        onProcessRefund={handleProcessRefund}
      />

      <VoidSaleModal
        isOpen={isVoidOpen}
        sale={saleToVoid}
        currencySymbol={settings.currency_symbol}
        onClose={() => setIsVoidOpen(false)}
        onConfirmVoid={handleConfirmVoid}
      />
    </div>
  );
}
