'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sale, Product, StoreSettings, RegisterClosure } from '@/types';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/formatters';
import { getSaleItemNetTotal } from '@/utils/revenue';
import DrilldownModal from '@/components/analytics/DrilldownModal';
import RegisterClosureModal from '@/components/reports/RegisterClosureModal';
import ListRow from '@/components/common/ListRow';
import ProductAvatar from '@/components/common/ProductAvatar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Clock,
  Lock,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const CATEGORY_COLORS = ['#C1502E', '#8B7355', '#5C7A52', '#9B4038', '#A0958C', '#D9CFBF'];

export default function AnalyticsView() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [registerClosures, setRegisterClosures] = useState<RegisterClosure[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Agora Kiosk',
    currency_symbol: '$',
    currency_code: 'USD',
    low_stock_alerts_enabled: true,
    business_type: 'GENERAL_RETAIL',
    expiry_alert_days: 30,
    custom_attributes: [],
  });

  const [trendDays, setTrendDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);

  // Drilldown Modal State
  const [drilldownState, setDrilldownState] = useState<{
    isOpen: boolean;
    title: string;
    metricType: 'REVENUE' | 'SALES' | 'UNITS' | 'STOCK_HEALTH' | 'HOURLY';
  }>({
    isOpen: false,
    title: '',
    metricType: 'REVENUE',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesData, prods, stgs, closures] = await Promise.all([
        api.getSales(),
        api.getProducts(),
        api.getSettings(),
        api.getRegisterClosures(),
      ]);
      setSales(salesData);
      setProducts(prods);
      setSettings(stgs);
      setRegisterClosures(closures);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmClosure = async (countedCash: number, notes?: string) => {
    const closure = await api.closeRegister(countedCash, notes);
    await loadData();
    return closure;
  };

  const metricTrends = useMemo(() => {
    return api.getMetricTrends(sales, trendDays);
  }, [sales, trendDays]);

  const isRevenueIncrease = metricTrends.revenueTrend.isIncrease;
  const trendColorHex = isRevenueIncrease ? '#5C7A52' : '#9B4038';

  const revenueTrendData = useMemo(() => {
    return api.getRevenueTrendData(sales, trendDays);
  }, [sales, trendDays]);

  const hourlySalesData = useMemo(() => {
    return api.getHourlySalesData(sales, trendDays);
  }, [sales, trendDays]);

  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      if (s.status === 'VOIDED') return;
      s.items?.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        const cat = prod?.category || 'General';
        const itemNet = getSaleItemNetTotal(item);
        map[cat] = (map[cat] || 0) + itemNet;
      });
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        valueCents: value,
      }))
      .sort((a, b) => b.valueCents - a.valueCents);
  }, [sales, products]);

  const stockHealthItems = useMemo(() => {
    return api.getStockHealthData(products, settings.expiry_alert_days || 30);
  }, [products, settings]);

  const handleOpenDrilldown = (
    title: string,
    metricType: 'REVENUE' | 'SALES' | 'UNITS' | 'STOCK_HEALTH' | 'HOURLY'
  ) => {
    setDrilldownState({
      isOpen: true,
      title,
      metricType,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-agora-ink pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-agora-ink tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-agora-ink-muted" />
            Reports
          </h1>
        </div>

        <button
          onClick={() => setIsClosureModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs sm:text-sm w-full sm:w-auto"
        >
          <Lock className="w-4 h-4" /> Close Register
        </button>
      </div>

      {/* Wallet-App Balance Card */}
      <div className="ledger-card p-6 text-center space-y-3 shadow-sm bg-agora-card border border-agora-border">
        <span className="text-xs font-serif font-bold uppercase tracking-wider text-agora-brass">
          Net Revenue ({trendDays === 1 ? 'Today' : `${trendDays} Days`})
        </span>
        <h2 className="text-4xl sm:text-5xl font-serif font-black text-agora-ink tracking-tight">
          {formatCurrency(metricTrends.revenueTrend.currentValue, settings.currency_symbol)}
        </h2>

        {/* Segmented Time-Range Control */}
        <div className="flex items-center justify-center gap-1 bg-agora-bg border border-agora-border p-1 rounded-2xl w-max mx-auto">
          {[
            { days: 1, label: 'Today' },
            { days: 7, label: '7D' },
            { days: 30, label: '30D' },
            { days: 90, label: '90D' },
          ].map((r) => (
            <button
              key={r.days}
              onClick={() => setTrendDays(r.days)}
              className={`px-4 py-1.5 rounded-xl text-xs font-serif font-bold transition-all ${
                trendDays === r.days
                  ? 'bg-agora-terracotta text-agora-card shadow-sm'
                  : 'text-agora-ink-muted hover:text-agora-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact KPI Overview Strip */}
      <div className="space-y-2.5">
        <div className="ledger-card p-3 flex items-center justify-between border border-agora-border shadow-sm">
          {/* Sales Count Column */}
          <div
            onClick={() => handleOpenDrilldown('Transactions', 'SALES')}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity py-0.5"
          >
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-agora-ink-muted" />
              <span className="text-lg sm:text-xl font-serif font-black text-agora-ink">
                {metricTrends.salesCountTrend.currentValue}
              </span>
            </div>
            <span className="text-[11px] font-bold text-agora-ink-muted mt-0.5">Sales Count</span>
          </div>

          <div className="w-px h-8 bg-agora-border/80 shrink-0" />

          {/* Units Sold Column */}
          <div
            onClick={() => handleOpenDrilldown('Units Sold', 'UNITS')}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity py-0.5"
          >
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-agora-ink-muted" />
              <span className="text-lg sm:text-xl font-serif font-black text-agora-ink">
                {metricTrends.unitsSoldTrend.currentValue}
              </span>
            </div>
            <span className="text-[11px] font-bold text-agora-ink-muted mt-0.5">Units Sold</span>
          </div>
        </div>

        {/* Conditional Stock Alerts Pill (Renders ONLY when stockHealthItems.length > 0) */}
        {stockHealthItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              window.location.hash = 'inventory?filter=low_stock';
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-agora-gold-light border border-agora-gold-border text-agora-gold rounded-xl text-xs font-bold hover:bg-agora-gold-light/80 transition-all shadow-sm active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-agora-gold shrink-0 animate-pulse" />
              <span>
                {stockHealthItems.length} Stock Alert{stockHealthItems.length > 1 ? 's' : ''} Need
                Attention
              </span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider underline flex items-center gap-1">
              View Items &rarr;
            </span>
          </button>
        )}
      </div>

      {/* Wallet-App Area Chart with Dynamic Trend Color & Real-time Touch Scrubber */}
      <div className="ledger-card p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-agora-ink-muted" />
            <h3 className="font-serif font-bold text-agora-ink text-sm sm:text-base">
              Revenue Trajectory
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1 text-agora-ink font-bold">
              <span
                className={`w-2.5 h-2.5 rounded-full inline-block ${isRevenueIncrease ? 'bg-agora-sage' : 'bg-agora-brick'}`}
              />{' '}
              Current
            </span>
            <span className="flex items-center gap-1 text-agora-ink-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-agora-brass inline-block" /> Previous
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-1 touch-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrendData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendColorHex} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={trendColorHex} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B7355" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8B7355" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dateLabel" stroke="#6E655F" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#6E655F"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${settings.currency_symbol}${v / 100}`}
              />
              <Tooltip
                trigger="hover"
                contentStyle={{
                  backgroundColor: '#FFFDF8',
                  borderColor: '#E5DCC8',
                  borderRadius: '12px',
                  color: '#211D1A',
                }}
                formatter={(value: unknown) => [
                  formatCurrency(Number(value), settings.currency_symbol),
                  'Revenue',
                ]}
              />
              <Area
                type="monotone"
                dataKey="previousPeriodRevenue"
                name="Previous Period"
                stroke="#8B7355"
                fill="url(#colorPrev)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="currentPeriodRevenue"
                name="Current Period"
                stroke={trendColorHex}
                fill="url(#colorRev)"
                strokeWidth={3}
                dot={{ fill: trendColorHex, r: 4 }}
                activeDot={{ fill: trendColorHex, r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Analytics: Peak Hours & Category Wallet Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Peak Hours Chart */}
        <div className="ledger-card p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-agora-border">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-agora-ink-muted" />
              <h3 className="font-serif font-bold text-agora-ink text-sm sm:text-base">
                Peak Sales Hours
              </h3>
            </div>
            <span className="text-[11px] text-agora-ink-muted">({trendDays}d window)</span>
          </div>

          <div className="h-56 sm:h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlySalesData}>
                <XAxis dataKey="hour" stroke="#6E655F" fontSize={10} tickLine={false} />
                <YAxis stroke="#6E655F" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF8',
                    borderColor: '#E5DCC8',
                    borderRadius: '12px',
                    color: '#211D1A',
                  }}
                  formatter={(value: unknown, name: unknown) => [
                    name === 'revenue'
                      ? formatCurrency(Number(value), settings.currency_symbol)
                      : (value as React.ReactNode),
                    name === 'revenue' ? 'Revenue' : 'Sales',
                  ]}
                />
                <Bar dataKey="salesCount" fill="#8B7355" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown formatted as Wallet ListRow */}
        <div className="ledger-card p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-agora-border">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-agora-ink-muted" />
              <h3 className="font-serif font-bold text-agora-ink text-sm sm:text-base">
                Category Performance
              </h3>
            </div>
            <span className="text-[11px] text-agora-ink-muted">Net sales breakdown</span>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="p-6 text-center text-xs text-agora-ink-muted">
              No sales recorded yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {categoryChartData.map((cat, idx) => (
                <ListRow
                  key={cat.name}
                  icon={
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-agora-card text-xs"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    >
                      {cat.name.substring(0, 2).toUpperCase()}
                    </div>
                  }
                  title={cat.name}
                  subtitle="Product Category"
                  value={formatCurrency(cat.valueCents, settings.currency_symbol)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock Health & Alerts formatted as ListRow */}
      <div className="ledger-card p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-agora-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-agora-gold" />
            <h3 className="font-serif font-bold text-agora-ink text-sm sm:text-base">
              Stock Health & Alerts
            </h3>
          </div>
          <span className="text-xs text-agora-ink-muted">Reorder list</span>
        </div>

        {stockHealthItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-agora-ink-muted">
            All products have healthy stock levels!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {stockHealthItems.map((item) => {
              const p = item.product;
              return (
                <ListRow
                  key={p.id}
                  icon={<ProductAvatar name={p.name} imageUrl={p.image_url} size="md" />}
                  title={p.name}
                  subtitle={
                    <span>
                      Stock:{' '}
                      <strong>
                        {p.stock_quantity} {p.unit_type || 'pcs'}
                      </strong>{' '}
                      • Alert: {p.low_stock_threshold}
                    </span>
                  }
                  badge={
                    item.isExpiringSoon ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-agora-brick-light border border-agora-brick-border text-agora-brick">
                        Expiring ({item.daysUntilExpiry}d)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-agora-gold-light text-agora-gold border border-agora-gold-border">
                        Low Stock
                      </span>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Register Closures History */}
      <div className="ledger-card p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-agora-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-agora-ink-muted" />
            <h3 className="font-serif font-bold text-agora-ink text-sm sm:text-base">
              Register Closures Log
            </h3>
          </div>
          <span className="text-xs text-agora-ink-muted">End-of-day reconciliation</span>
        </div>

        {registerClosures.length === 0 ? (
          <div className="p-6 text-center text-xs text-agora-ink-muted">
            No register closures recorded yet.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {registerClosures.map((c) => {
              const variance = c.variance;
              return (
                <ListRow
                  key={c.id}
                  icon={
                    <div className="bg-agora-terracotta/10 p-2.5 rounded-xl border border-agora-terracotta/20 shrink-0">
                      <Lock className="w-4 h-4 text-agora-terracotta" />
                    </div>
                  }
                  title={formatDate(c.closed_at)}
                  subtitle={c.notes || 'End of day closure'}
                  value={formatCurrency(c.counted_cash, settings.currency_symbol)}
                  badge={
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        variance === 0
                          ? 'bg-agora-sage-light text-agora-sage border border-agora-sage-border'
                          : variance > 0
                            ? 'bg-agora-brass/10 text-agora-brass border border-agora-brass/30'
                            : 'bg-agora-brick-light text-agora-brick border border-agora-brick-border'
                      }`}
                    >
                      {variance === 0 ? (
                        <CheckCircle2 className="w-3 h-3 text-agora-sage" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {variance === 0
                        ? 'Balanced'
                        : variance > 0
                          ? `+${formatCurrency(variance, settings.currency_symbol)}`
                          : formatCurrency(variance, settings.currency_symbol)}
                    </span>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <DrilldownModal
        isOpen={drilldownState.isOpen}
        title={drilldownState.title}
        metricType={drilldownState.metricType}
        sales={sales}
        currencySymbol={settings.currency_symbol}
        onClose={() => setDrilldownState({ ...drilldownState, isOpen: false })}
      />

      <RegisterClosureModal
        isOpen={isClosureModalOpen}
        currencySymbol={settings.currency_symbol}
        onClose={() => setIsClosureModalOpen(false)}
        onConfirmClosure={handleConfirmClosure}
      />
    </div>
  );
}
