import {
  Product,
  Sale,
  MetricTrend,
  HourlySalesPoint,
  RevenueTrendPoint,
  StockHealthItem,
} from '@/types';
import { getSaleNetRevenue } from '@/utils/revenue';

export function getMetricTrends(
  sales: Sale[],
  daysPeriod: number = 1
): {
  revenueTrend: MetricTrend;
  salesCountTrend: MetricTrend;
  unitsSoldTrend: MetricTrend;
} {
  const now = new Date();
  const currentStart = new Date(now.getTime() - daysPeriod * 86400000).getTime();
  const previousStart = new Date(now.getTime() - 2 * daysPeriod * 86400000).getTime();

  let curRev = 0,
    curSales = 0,
    curUnits = 0;
  let prevRev = 0,
    prevSales = 0,
    prevUnits = 0;

  sales.forEach((s) => {
    if (s.status === 'VOIDED') return;
    const t = new Date(s.timestamp).getTime();
    const netRev = getSaleNetRevenue(s);

    if (t >= currentStart) {
      curRev += netRev;
      curSales += 1;
      curUnits += s.items_count;
    } else if (t >= previousStart && t < currentStart) {
      prevRev += netRev;
      prevSales += 1;
      prevUnits += s.items_count;
    }
  });

  const calcPercent = (cur: number, prev: number): MetricTrend => {
    if (prev === 0) {
      return {
        currentValue: cur,
        previousValue: prev,
        percentageChange: cur > 0 ? 100 : 0,
        isIncrease: cur >= prev,
      };
    }
    const change = ((cur - prev) / prev) * 100;
    return {
      currentValue: cur,
      previousValue: prev,
      percentageChange: Math.round(change * 10) / 10,
      isIncrease: change >= 0,
    };
  };

  return {
    revenueTrend: calcPercent(curRev, prevRev),
    salesCountTrend: calcPercent(curSales, prevSales),
    unitsSoldTrend: calcPercent(curUnits, prevUnits),
  };
}

export function getRevenueTrendData(sales: Sale[], days: number = 7): RevenueTrendPoint[] {
  const points: RevenueTrendPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const prevDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i - days);

    const targetDateStr = targetDate.toDateString();
    const prevDateStr = prevDate.toDateString();

    let currentRev = 0;
    let prevRev = 0;

    sales.forEach((s) => {
      if (s.status === 'VOIDED') return;
      const dStr = new Date(s.timestamp).toDateString();
      const netRev = getSaleNetRevenue(s);
      if (dStr === targetDateStr) currentRev += netRev;
      if (dStr === prevDateStr) prevRev += netRev;
    });

    points.push({
      dateLabel: targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      timestamp: targetDate.toISOString(),
      currentPeriodRevenue: currentRev,
      previousPeriodRevenue: prevRev,
    });
  }

  return points;
}

export function getHourlySalesData(sales: Sale[], daysRange: number = 7): HourlySalesPoint[] {
  const hoursMap: Record<number, { count: number; revenue: number }> = {};
  for (let h = 8; h <= 21; h++) {
    hoursMap[h] = { count: 0, revenue: 0 };
  }

  const cutoff = new Date(Date.now() - daysRange * 86400000).getTime();

  sales.forEach((s) => {
    if (s.status === 'VOIDED') return;
    const d = new Date(s.timestamp);
    if (d.getTime() < cutoff) return;

    const hour = d.getHours();
    if (hoursMap[hour] !== undefined) {
      hoursMap[hour].count += 1;
      hoursMap[hour].revenue += getSaleNetRevenue(s);
    }
  });

  return Object.entries(hoursMap).map(([hStr, data]) => {
    const hourNum = parseInt(hStr, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = `${hourNum % 12 === 0 ? 12 : hourNum % 12} ${ampm}`;

    return {
      hour: formattedHour,
      hourNum,
      salesCount: data.count,
      revenue: data.revenue,
    };
  });
}

export function getStockHealthData(
  products: Product[],
  expiryAlertDays: number = 30
): StockHealthItem[] {
  const now = Date.now();
  const items: StockHealthItem[] = [];

  products.forEach((p) => {
    const isLowStock = p.stock_quantity <= p.low_stock_threshold;
    let isExpiringSoon = false;
    let daysUntilExpiry: number | undefined = undefined;

    if (p.attributes?.expiry_date) {
      const expTime = new Date(p.attributes.expiry_date as string).getTime();
      if (!isNaN(expTime)) {
        const diffDays = Math.ceil((expTime - now) / 86400000);
        daysUntilExpiry = diffDays;
        if (diffDays <= expiryAlertDays) {
          isExpiringSoon = true;
        }
      }
    }

    if (isLowStock || isExpiringSoon) {
      const ratio =
        p.low_stock_threshold > 0
          ? Math.min(1, Math.max(0, p.stock_quantity / (p.low_stock_threshold * 2)))
          : 0;

      items.push({
        product: p,
        currentStock: p.stock_quantity,
        threshold: p.low_stock_threshold,
        ratio,
        isLowStock,
        isExpiringSoon,
        daysUntilExpiry,
      });
    }
  });

  return items.sort((a, b) => {
    if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
    if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
    return a.ratio - b.ratio;
  });
}

export function getSmartRestockSuggestions(
  products: Product[],
  sales: Sale[]
): Record<string, number> {
  const cutoff = Date.now() - 30 * 86400000;
  const productSalesMap: Record<string, number> = {};

  sales.forEach((s) => {
    if (s.status === 'VOIDED' || new Date(s.timestamp).getTime() < cutoff) return;
    s.items?.forEach((item) => {
      if (!item.product_id) return;
      const netQty = item.quantity - (item.refunded_quantity || 0);
      productSalesMap[item.product_id] =
        (productSalesMap[item.product_id] || 0) + Math.max(0, netQty);
    });
  });

  const suggestions: Record<string, number> = {};

  products.forEach((p) => {
    const totalSold30Days = productSalesMap[p.id] || 0;
    const avgDaily = totalSold30Days / 30;
    const weeklyBuffer = Math.ceil(avgDaily * 7);

    const suggested = Math.max(
      p.low_stock_threshold,
      weeklyBuffer > 0 ? weeklyBuffer : p.low_stock_threshold
    );
    suggestions[p.id] = suggested;
  });

  return suggestions;
}

export function getTopFavorites(products: Product[], sales: Sale[]): Product[] {
  const productSalesMap: Record<string, number> = {};

  sales.forEach((s) => {
    if (s.status === 'VOIDED') return;
    s.items?.forEach((item) => {
      if (!item.product_id) return;
      productSalesMap[item.product_id] = (productSalesMap[item.product_id] || 0) + item.quantity;
    });
  });

  const sortedProducts = [...products].sort((a, b) => {
    const countA = productSalesMap[a.id] || 0;
    const countB = productSalesMap[b.id] || 0;
    return countB - countA;
  });

  return sortedProducts.slice(0, 6);
}
