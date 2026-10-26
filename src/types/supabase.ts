import { BusinessType } from './index';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          business_type: BusinessType;
          currency_symbol: string;
          currency_code: string;
          expiry_alert_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          business_type?: BusinessType;
          currency_symbol?: string;
          currency_code?: string;
          expiry_alert_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          business_type?: BusinessType;
          currency_symbol?: string;
          currency_code?: string;
          expiry_alert_days?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          category: string;
          price: number;
          cost_price: number | null;
          stock_quantity: number;
          low_stock_threshold: number;
          unit_type: string;
          business_type: BusinessType | null;
          attributes: Json;
          barcode: string | null;
          image_url: string | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          category: string;
          price: number;
          cost_price?: number | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          unit_type?: string;
          business_type?: BusinessType | null;
          attributes?: Json;
          barcode?: string | null;
          image_url?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          store_id: string;
          sale_number: string;
          timestamp: string;
          total_amount: number;
          items_count: number;
          status: 'COMPLETED' | 'VOIDED';
          payment_method: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'OTHER';
          notes: string | null;
          void_reason: string | null;
          voided_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      sale_items: {
        Row: {
          id: string;
          store_id: string;
          sale_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          unit_type: string;
        };
        Insert: Omit<Database['public']['Tables']['sale_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>;
      };
      stock_movements: {
        Row: {
          id: string;
          store_id: string;
          product_id: string | null;
          product_name: string;
          change_amount: number;
          quantity_after: number;
          reason: 'SALE' | 'RESTOCK' | 'MANUAL_ADJUSTMENT' | 'VOID_SALE' | 'EXPIRED_DISCARD';
          reference_id: string | null;
          note: string | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>;
      };
    };
    Functions: {
      create_sale_transaction: {
        Args: {
          p_store_id: string;
          p_items: Json;
          p_payment_method?: string;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      void_sale_transaction: {
        Args: {
          p_store_id: string;
          p_sale_id: string;
          p_void_reason: string;
        };
        Returns: Json;
      };
    };
  };
}
