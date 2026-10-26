export type ProductCategory =
  | 'Beverages'
  | 'Snacks'
  | 'Groceries'
  | 'Toiletries'
  | 'Pharmacy'
  | 'Stationery'
  | 'General'
  | string;

export type BusinessType = 'MINI_SHOP' | 'PHARMACY' | 'RESTAURANT' | 'SALON' | 'GENERAL_RETAIL';

export type UnitType = 'piece' | 'kg' | 'g' | 'L' | 'ml';

export interface AttributeDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number; // integer in cents (e.g., 1500 = $15.00 or 1500 KSh)
  cost_price?: number; // integer in cents
  stock_quantity: number;
  low_stock_threshold: number;
  unit_type?: UnitType; // default 'piece'
  business_type?: BusinessType;
  attributes?: Record<string, string | number | boolean>; // e.g. { expiry_date: "2026-10-15", batch_no: "B-902", prescription_required: false }
  barcode?: string;
  image_url?: string;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number; // integer or decimal for fractional units (e.g., 0.5 kg)
  refunded_quantity?: number; // refunded quantity for partial refunds
  unit_price: number; // cents snapshot
  line_total: number; // cents snapshot
  unit_type?: UnitType;
}

export interface SalePayment {
  id?: string;
  sale_id?: string;
  method: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'OTHER' | string;
  amount: number; // integer in cents
  created_at?: string;
}

export interface Refund {
  id: string;
  store_id?: string;
  sale_id: string;
  sale_item_id: string;
  quantity: number;
  amount: number; // integer in cents
  reason?: string;
  timestamp: string;
}

export interface RegisterClosure {
  id: string;
  store_id?: string;
  period_start: string;
  period_end: string;
  expected_cash: number; // in cents
  counted_cash: number; // in cents
  variance: number; // in cents (counted - expected)
  notes?: string;
  closed_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  timestamp: string;
  subtotal_amount?: number; // gross line items sum in cents
  discount_amount?: number; // discount in cents
  discount_reason?: string;
  total_amount: number; // net charged total in cents
  items_count: number;
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  payment_method?: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'OTHER' | 'SPLIT' | string;
  payments?: SalePayment[];
  refunds?: Refund[];
  notes?: string;
  void_reason?: string;
  voided_at?: string;
  items?: SaleItem[];
}

export type MovementReason = 'SALE' | 'RESTOCK' | 'MANUAL_ADJUSTMENT' | 'VOID_SALE' | 'REFUND';

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  change_amount: number; // + for restock/void/refund, - for sale
  quantity_after: number;
  reason: MovementReason;
  reference_id?: string; // e.g. sale_id
  note?: string;
  timestamp: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreSettings {
  store_name: string;
  currency_symbol: string;
  currency_code: string;
  low_stock_alerts_enabled: boolean;
  business_type: BusinessType;
  expiry_alert_days: number; // default: 30 days
  custom_attributes?: AttributeDefinition[];
}

export interface MetricTrend {
  currentValue: number;
  previousValue: number;
  percentageChange: number; // e.g. +14.2 or -5.0
  isIncrease: boolean;
}

export interface HourlySalesPoint {
  hour: string; // e.g. "8 AM", "9 AM"
  hourNum: number;
  salesCount: number;
  revenue: number; // in cents
}

export interface RevenueTrendPoint {
  dateLabel: string;
  timestamp: string;
  currentPeriodRevenue: number; // in cents
  previousPeriodRevenue: number; // in cents
}

export interface StockHealthItem {
  product: Product;
  currentStock: number;
  threshold: number;
  ratio: number; // 0 to 1
  isLowStock: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
}
