import React, { useState } from 'react';
import { Sale, StoreSettings } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/formatters';
import {
  X,
  Maximize2,
  Calendar,
  Receipt,
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
} from 'lucide-react';

interface DrilldownModalProps {
  isOpen: boolean;
  title: string;
  metricType: 'REVENUE' | 'SALES' | 'UNITS' | 'STOCK_HEALTH' | 'HOURLY';
  sales: Sale[];
  currencySymbol: string;
  onClose: () => void;
}

export default function DrilldownModal({
  isOpen,
  title,
  metricType,
  sales,
  currencySymbol,
  onClose,
}: DrilldownModalProps) {
  const [filterRange, setFilterRange] = useState<'TODAY' | '7D' | '30D' | 'ALL'>('TODAY');

  if (!isOpen) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d7Start = todayStart - 6 * 86400000;
  const d30Start = todayStart - 29 * 86400000;

  const filteredSales = sales.filter((s) => {
    if (s.status !== 'COMPLETED') return false;
    const time = new Date(s.timestamp).getTime();
    if (filterRange === 'TODAY' && time < todayStart) return false;
    if (filterRange === '7D' && time < d7Start) return false;
    if (filterRange === '30D' && time < d30Start) return false;
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalUnits = filteredSales.reduce((sum, s) => sum + s.items_count, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-agora-card border border-agora-border rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-agora-border flex items-center justify-between bg-agora-bg/60">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-agora-ink-muted" />
            <div>
              <h3 className="font-serif font-bold text-agora-ink text-lg leading-tight">{title}</h3>
              <span className="text-xs text-agora-ink/60">
                Detailed metric drill-down inspection
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-agora-card border border-agora-border p-1 rounded-xl">
              {(
                [
                  { id: 'TODAY', label: 'Today' },
                  { id: '7D', label: '7 Days' },
                  { id: '30D', label: '30 Days' },
                  { id: 'ALL', label: 'All' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setFilterRange(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterRange === r.id
                      ? 'bg-agora-terracotta text-agora-card shadow'
                      : 'text-agora-ink/60 hover:text-agora-ink'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="text-agora-ink/60 hover:text-agora-ink p-1.5 rounded-xl hover:bg-agora-bg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-agora-bg p-3.5 rounded-2xl border border-agora-border">
              <span className="text-[10px] text-agora-ink/60 uppercase font-semibold">
                Period Revenue
              </span>
              <div className="text-xl font-serif font-bold text-agora-ink mt-1">
                {formatCurrency(totalRevenue, currencySymbol)}
              </div>
            </div>
            <div className="bg-agora-bg p-3.5 rounded-2xl border border-agora-border">
              <span className="text-[10px] text-agora-ink/60 uppercase font-semibold">
                Sales Count
              </span>
              <div className="text-xl font-serif font-bold text-agora-ink mt-1">
                {filteredSales.length} checkouts
              </div>
            </div>
            <div className="bg-agora-bg p-3.5 rounded-2xl border border-agora-border">
              <span className="text-[10px] text-agora-ink/60 uppercase font-semibold">
                Units Sold
              </span>
              <div className="text-xl font-serif font-bold text-agora-ink mt-1">
                {totalUnits} items
              </div>
            </div>
          </div>

          {/* Detailed Itemization Table */}
          <div className="bg-agora-bg rounded-2xl border border-agora-border overflow-hidden">
            <div className="px-4 py-3 bg-agora-bg/80 border-b border-agora-border text-xs font-bold text-agora-ink/60 flex justify-between">
              <span>Receipt # & Date</span>
              <span>Items Sold Breakdown</span>
              <span>Total Amount</span>
            </div>

            <div className="divide-y divide-agora-border/60">
              {filteredSales.length === 0 ? (
                <div className="p-8 text-center text-xs text-agora-ink/50">
                  No transaction records found for this drilldown range.
                </div>
              ) : (
                filteredSales.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 flex justify-between items-center text-xs hover:bg-agora-card/60 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-agora-ink block text-sm flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-agora-ink-muted" /> {s.sale_number}
                      </span>
                      <span className="text-agora-ink/60">{formatDate(s.timestamp)}</span>
                    </div>

                    <div className="text-agora-ink/80 max-w-xs text-center">
                      <span className="font-semibold">{s.items_count} item(s): </span>
                      <span className="text-agora-ink/60 text-[11px]">
                        {s.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-bold text-agora-ink text-sm block">
                        {formatCurrency(s.total_amount, currencySymbol)}
                      </span>
                      <span className="text-[10px] text-agora-ink/70 uppercase font-semibold bg-agora-card px-2 py-0.5 rounded border border-agora-border">
                        {s.payment_method || 'CASH'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
