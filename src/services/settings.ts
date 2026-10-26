import { StoreSettings } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SETTINGS_KEY, getLocal, setLocal, getActiveStoreId } from './common';

export async function getSettings(): Promise<StoreSettings> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { data, error } = await supabase.from('stores').select('*').eq('id', storeId).single();

      if (error) {
        throw new Error(`Failed to fetch store settings: ${error.message}`);
      }
      if (data) {
        return {
          store_name: data.name,
          currency_symbol: data.currency_symbol,
          currency_code: data.currency_code,
          business_type: data.business_type,
          expiry_alert_days: data.expiry_alert_days,
          low_stock_alerts_enabled: true,
        };
      }
    }
  }

  return getLocal<StoreSettings>(SETTINGS_KEY, {
    store_name: 'Corner Mini-Market & Kiosk',
    currency_symbol: '$',
    currency_code: 'USD',
    low_stock_alerts_enabled: true,
    business_type: 'GENERAL_RETAIL',
    expiry_alert_days: 30,
    custom_attributes: [],
  });
}

export async function updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { data, error } = await supabase
        .from('stores')
        .update({
          name: settings.store_name,
          business_type: settings.business_type,
          currency_symbol: settings.currency_symbol,
          currency_code: settings.currency_code,
          expiry_alert_days: settings.expiry_alert_days,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update store settings: ${error.message}`);
      }
      if (data) {
        return {
          store_name: data.name,
          currency_symbol: data.currency_symbol,
          currency_code: data.currency_code,
          business_type: data.business_type,
          expiry_alert_days: data.expiry_alert_days,
          low_stock_alerts_enabled: true,
        };
      }
    }
  }

  const current = await getSettings();
  const updated = { ...current, ...settings };
  setLocal(SETTINGS_KEY, updated);
  return updated;
}
