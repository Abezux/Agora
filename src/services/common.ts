import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const PRODUCTS_KEY = 'agora_products_v1';
export const SALES_KEY = 'agora_sales_v1';
export const MOVEMENTS_KEY = 'agora_movements_v1';
export const SETTINGS_KEY = 'agora_settings_v1';
export const REFUNDS_KEY = 'agora_refunds_v1';
export const CLOSURES_KEY = 'agora_closures_v1';

export function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  let str = localStorage.getItem(key);
  if (!str && key.startsWith('agora_')) {
    const legacyKey = key.replace(/^agora_/, 'shemsu_');
    str = localStorage.getItem(legacyKey);
    if (str) {
      localStorage.setItem(key, str);
    }
  }
  if (!str) return defaultVal;
  try {
    return JSON.parse(str);
  } catch {
    return defaultVal;
  }
}

export function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(val));
}

// Helper to get active store ID
export const getActiveStoreId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  return data?.id || null;
};
