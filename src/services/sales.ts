import { Sale, SaleItem, Product, StockMovement, Refund } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  SALES_KEY,
  PRODUCTS_KEY,
  MOVEMENTS_KEY,
  REFUNDS_KEY,
  getLocal,
  setLocal,
  getActiveStoreId,
} from './common';

export async function getSales(): Promise<Sale[]> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (!storeId) return [];

    const { data: salesData, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('store_id', storeId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }

    return (salesData || []).map((s) => ({
      ...s,
      items: (s.sale_items as SaleItem[]) || [],
    })) as Sale[];
  }

  return getLocal<Sale[]>(SALES_KEY, []);
}

export async function createSale(
  items: { product_id: string; quantity: number }[],
  payments?: { method: string; amount: number }[],
  discountAmount: number = 0,
  discountReason?: string,
  notes?: string
): Promise<Sale> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { data, error } = await supabase.rpc('create_sale_transaction', {
        p_store_id: storeId,
        p_items: items,
        p_payments: payments || null,
        p_discount_amount: discountAmount,
        p_discount_reason: discountReason || null,
        p_notes: notes || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as Sale;
    }
  }

  // Local Storage Fallback (Offline/Demo)
  const products = getLocal<Product[]>(PRODUCTS_KEY, []);
  const sales = getLocal<Sale[]>(SALES_KEY, []);
  const movements = getLocal<StockMovement[]>(MOVEMENTS_KEY, []);
  const now = new Date().toISOString();

  const saleId = `sale-${Date.now()}`;
  const saleNumber = `#INV-${Date.now().toString().slice(-6)}`;

  // Validate stock for local mock fallback
  for (const itemReq of items) {
    const product = products.find((p) => p.id === itemReq.product_id);
    if (!product) throw new Error(`Product not found`);
    if (product.stock_quantity < itemReq.quantity) {
      throw new Error(
        `Insufficient stock for product "${product.name}" (Available: ${product.stock_quantity}, Requested: ${itemReq.quantity})`
      );
    }
  }

  let subtotalAmount = 0;
  let totalItemsCount = 0;
  const saleItems: SaleItem[] = [];

  for (const itemReq of items) {
    const product = products.find((p) => p.id === itemReq.product_id)!;

    const lineTotal = Math.round(product.price * itemReq.quantity);
    subtotalAmount += lineTotal;
    totalItemsCount += itemReq.quantity;

    product.stock_quantity = product.stock_quantity - itemReq.quantity;
    product.updated_at = now;

    const saleItem: SaleItem = {
      id: `si-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sale_id: saleId,
      product_id: product.id,
      product_name: product.name,
      quantity: itemReq.quantity,
      refunded_quantity: 0,
      unit_price: product.price,
      line_total: lineTotal,
      unit_type: product.unit_type || 'piece',
    };
    saleItems.push(saleItem);

    movements.unshift({
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: product.id,
      product_name: product.name,
      change_amount: -itemReq.quantity,
      quantity_after: product.stock_quantity,
      reason: 'SALE',
      reference_id: saleId,
      note: `Sold via sale ${saleNumber}`,
      timestamp: now,
    });
  }

  if (discountAmount > subtotalAmount) {
    throw new Error(`Discount amount cannot exceed subtotal amount`);
  }

  const totalAmount = subtotalAmount - discountAmount;
  const finalPayments =
    payments && payments.length > 0 ? payments : [{ method: 'CASH', amount: totalAmount }];

  const paymentMethod = finalPayments.length > 1 ? 'SPLIT' : finalPayments[0].method;

  const newSale: Sale = {
    id: saleId,
    sale_number: saleNumber,
    timestamp: now,
    subtotal_amount: subtotalAmount,
    discount_amount: discountAmount,
    discount_reason: discountReason,
    total_amount: totalAmount,
    items_count: totalItemsCount,
    status: 'COMPLETED',
    payment_method: paymentMethod,
    payments: finalPayments.map((p) => ({ method: p.method, amount: p.amount })),
    notes,
    items: saleItems,
  };

  sales.unshift(newSale);
  setLocal(PRODUCTS_KEY, products);
  setLocal(SALES_KEY, sales);
  setLocal(MOVEMENTS_KEY, movements);

  return newSale;
}

export async function processRefund(
  saleId: string,
  refundItems: { sale_item_id: string; quantity: number }[],
  reason?: string
): Promise<Sale> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { data, error } = await supabase.rpc('process_refund_transaction', {
        p_store_id: storeId,
        p_sale_id: saleId,
        p_refund_items: refundItems,
        p_reason: reason || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as Sale;
    }
  }

  // Local Storage Fallback
  const products = getLocal<Product[]>(PRODUCTS_KEY, []);
  const sales = getLocal<Sale[]>(SALES_KEY, []);
  const movements = getLocal<StockMovement[]>(MOVEMENTS_KEY, []);
  const refunds = getLocal<Refund[]>(REFUNDS_KEY, []);
  const now = new Date().toISOString();

  const sale = sales.find((s) => s.id === saleId);
  if (!sale || sale.status === 'VOIDED') throw new Error('Sale not found or voided');

  for (const refItem of refundItems) {
    const item = sale.items?.find((i) => i.id === refItem.sale_item_id);
    if (!item) continue;

    const availableToRefund = item.quantity - (item.refunded_quantity || 0);
    if (refItem.quantity > availableToRefund) {
      throw new Error(
        `Refund quantity exceeds available unrefunded quantity for ${item.product_name}`
      );
    }

    item.refunded_quantity = (item.refunded_quantity || 0) + refItem.quantity;
    const refundAmount = Math.round(item.unit_price * refItem.quantity);

    refunds.unshift({
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sale_id: saleId,
      sale_item_id: item.id,
      quantity: refItem.quantity,
      amount: refundAmount,
      reason,
      timestamp: now,
    });

    const product = products.find((p) => p.id === item.product_id);
    if (product) {
      product.stock_quantity += refItem.quantity;
      product.updated_at = now;

      movements.unshift({
        id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: product.id,
        product_name: product.name,
        change_amount: refItem.quantity,
        quantity_after: product.stock_quantity,
        reason: 'REFUND',
        reference_id: saleId,
        note: `Refunded ${refItem.quantity} units: ${reason || 'No reason'}`,
        timestamp: now,
      });
    }
  }

  const totalQty = sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const totalRefundedQty = sale.items?.reduce((sum, i) => sum + (i.refunded_quantity || 0), 0) || 0;

  if (totalRefundedQty >= totalQty && totalQty > 0) {
    sale.status = 'REFUNDED';
  } else if (totalRefundedQty > 0) {
    sale.status = 'PARTIALLY_REFUNDED';
  }

  setLocal(PRODUCTS_KEY, products);
  setLocal(SALES_KEY, sales);
  setLocal(MOVEMENTS_KEY, movements);
  setLocal(REFUNDS_KEY, refunds);

  return sale;
}

export async function voidSale(saleId: string, reason: string): Promise<Sale> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { data, error } = await supabase.rpc('void_sale_transaction', {
        p_store_id: storeId,
        p_sale_id: saleId,
        p_void_reason: reason,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as Sale;
    }
  }

  const products = getLocal<Product[]>(PRODUCTS_KEY, []);
  const sales = getLocal<Sale[]>(SALES_KEY, []);
  const movements = getLocal<StockMovement[]>(MOVEMENTS_KEY, []);
  const now = new Date().toISOString();

  const sale = sales.find((s) => s.id === saleId);
  if (!sale || sale.status === 'VOIDED') throw new Error('Sale not found or already voided');

  sale.status = 'VOIDED';
  sale.void_reason = reason;
  sale.voided_at = now;

  if (sale.items) {
    for (const item of sale.items) {
      const product = products.find((p) => p.id === item.product_id);
      const unrefundedQty = item.quantity - (item.refunded_quantity || 0);

      if (product && unrefundedQty > 0) {
        product.stock_quantity += unrefundedQty;
        product.updated_at = now;

        movements.unshift({
          id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product_id: product.id,
          product_name: product.name,
          change_amount: unrefundedQty,
          quantity_after: product.stock_quantity,
          reason: 'VOID_SALE',
          reference_id: sale.id,
          note: `Voided sale ${sale.sale_number}: ${reason}`,
          timestamp: now,
        });
      }
    }
  }

  setLocal(PRODUCTS_KEY, products);
  setLocal(SALES_KEY, sales);
  setLocal(MOVEMENTS_KEY, movements);

  return sale;
}
