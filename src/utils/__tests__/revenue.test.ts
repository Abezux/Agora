import { describe, expect, it } from 'vitest';
import type { Refund, Sale, SaleItem } from '@/types';
import {
  calculateNetRevenue,
  calculateSaleRefunds,
  getSaleItemNetTotal,
  getSaleNetRevenue,
} from '@/utils/revenue';

function makeItem(overrides: Partial<SaleItem> = {}): SaleItem {
  return {
    id: 'item-1',
    sale_id: 'sale-1',
    product_id: 'product-1',
    product_name: 'Widget',
    quantity: 2,
    unit_price: 500,
    line_total: 1000,
    ...overrides,
  };
}

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    sale_number: 'D1-0001',
    timestamp: '2026-01-01T10:00:00.000Z',
    total_amount: 1000,
    items_count: 2,
    status: 'COMPLETED',
    ...overrides,
  };
}

function makeRefund(overrides: Partial<Refund> = {}): Refund {
  return {
    id: 'refund-1',
    sale_id: 'sale-1',
    sale_item_id: 'item-1',
    quantity: 1,
    amount: 500,
    timestamp: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('calculateSaleRefunds', () => {
  it('returns zero when there is nothing to refund', () => {
    expect(calculateSaleRefunds(makeSale())).toBe(0);
    expect(calculateSaleRefunds(makeSale({ items: [] }))).toBe(0);
  });

  it('sums refunds that belong to the sale', () => {
    const refunds = [
      makeRefund({ id: 'r1', amount: 300 }),
      makeRefund({ id: 'r2', amount: 200 }),
      makeRefund({ id: 'r3', sale_id: 'sale-2', amount: 999 }),
    ];
    expect(calculateSaleRefunds(makeSale(), refunds)).toBe(500);
  });

  it('falls back to refunded_quantity on items when no refund matches', () => {
    const sale = makeSale({
      items: [makeItem({ quantity: 3, refunded_quantity: 1, unit_price: 500 })],
    });
    const refunds = [makeRefund({ sale_id: 'sale-2' })];
    expect(calculateSaleRefunds(sale, refunds)).toBe(500);
  });

  it('ignores items that have no refunded_quantity', () => {
    const sale = makeSale({ items: [makeItem({ quantity: 3 })] });
    expect(calculateSaleRefunds(sale)).toBe(0);
  });

  it('handles fractional refunded quantities', () => {
    const sale = makeSale({
      items: [makeItem({ quantity: 1.5, refunded_quantity: 0.25, unit_price: 400 })],
    });
    expect(calculateSaleRefunds(sale)).toBe(100);
  });
});

describe('getSaleNetRevenue', () => {
  it('subtracts refunds from the sale total', () => {
    expect(getSaleNetRevenue(makeSale({ total_amount: 1000 }), [makeRefund({ amount: 300 })])).toBe(
      700
    );
  });

  it('returns the full total when there are no refunds', () => {
    expect(getSaleNetRevenue(makeSale({ total_amount: 2500 }))).toBe(2500);
  });

  it('returns zero for a voided sale even when refunds exist', () => {
    const sale = makeSale({ status: 'VOIDED', total_amount: 1000 });
    expect(getSaleNetRevenue(sale, [makeRefund({ amount: 300 })])).toBe(0);
  });

  it('never goes below zero when refunds exceed the total', () => {
    expect(
      getSaleNetRevenue(makeSale({ total_amount: 1000 }), [makeRefund({ amount: 1500 })])
    ).toBe(0);
  });

  it('treats a missing total as zero', () => {
    const sale = makeSale({ total_amount: undefined as unknown as number });
    expect(getSaleNetRevenue(sale)).toBe(0);
  });

  it('handles a zero-total sale', () => {
    expect(getSaleNetRevenue(makeSale({ total_amount: 0 }))).toBe(0);
  });
});

describe('calculateNetRevenue', () => {
  it('returns zero for an empty list', () => {
    expect(calculateNetRevenue([])).toBe(0);
  });

  it('sums net revenue across completed sales', () => {
    const sales = [
      makeSale({ id: 'sale-1', total_amount: 1000 }),
      makeSale({ id: 'sale-2', total_amount: 2500 }),
    ];
    expect(calculateNetRevenue(sales)).toBe(3500);
  });

  it('applies each refund only to its own sale', () => {
    const sales = [
      makeSale({ id: 'sale-1', total_amount: 1000 }),
      makeSale({ id: 'sale-2', total_amount: 2500 }),
    ];
    const refunds = [makeRefund({ sale_id: 'sale-1', amount: 400 })];
    expect(calculateNetRevenue(sales, refunds)).toBe(3100);
  });

  it('excludes voided sales', () => {
    const sales = [
      makeSale({ id: 'sale-1', total_amount: 1000 }),
      makeSale({ id: 'sale-2', total_amount: 2500, status: 'VOIDED' }),
    ];
    expect(calculateNetRevenue(sales)).toBe(1000);
  });

  it('handles refunded and partially refunded statuses like completed ones', () => {
    const sales = [
      makeSale({ id: 'sale-1', total_amount: 1000, status: 'PARTIALLY_REFUNDED' }),
      makeSale({ id: 'sale-2', total_amount: 500, status: 'REFUNDED' }),
    ];
    const refunds = [makeRefund({ sale_id: 'sale-2', amount: 500 })];
    expect(calculateNetRevenue(sales, refunds)).toBe(1000);
  });
});

describe('getSaleItemNetTotal', () => {
  it('returns the full line total with no refunds', () => {
    expect(getSaleItemNetTotal(makeItem({ quantity: 3, unit_price: 500 }))).toBe(1500);
  });

  it('subtracts refunded units', () => {
    expect(
      getSaleItemNetTotal(makeItem({ quantity: 3, refunded_quantity: 1, unit_price: 500 }))
    ).toBe(1000);
  });

  it('never goes below zero when refunded more than sold', () => {
    expect(
      getSaleItemNetTotal(makeItem({ quantity: 1, refunded_quantity: 5, unit_price: 500 }))
    ).toBe(0);
  });

  it('supports fractional quantities', () => {
    expect(
      getSaleItemNetTotal(makeItem({ quantity: 1.5, refunded_quantity: 0.5, unit_price: 400 }))
    ).toBe(400);
  });

  it('returns zero when the unit price is zero', () => {
    expect(getSaleItemNetTotal(makeItem({ quantity: 3, unit_price: 0 }))).toBe(0);
  });
});
