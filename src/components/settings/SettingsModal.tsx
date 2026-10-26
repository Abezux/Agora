import React, { useState, useEffect } from 'react';
import { StoreSettings, BusinessType, AttributeDefinition } from '@/types';
import { CURRENCY_PRESETS } from '@/utils/currency';
import {
  X,
  Settings,
  ShieldAlert,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Store,
  ShoppingBag,
  Pill,
  UtensilsCrossed,
  Scissors,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: StoreSettings;
  onClose: () => void;
  onSave: (settings: StoreSettings) => Promise<void>;
}

const BUSINESS_TYPES: { id: BusinessType; name: string; icon: React.ElementType; desc: string }[] =
  [
    { id: 'GENERAL_RETAIL', name: 'General Retail', icon: Store, desc: 'Standard shop catalog' },
    {
      id: 'MINI_SHOP',
      name: 'Mini-Shop / Kiosk',
      icon: ShoppingBag,
      desc: 'Snacks, drinks & counter items',
    },
    {
      id: 'PHARMACY',
      name: 'Pharmacy / Drugstore',
      icon: Pill,
      desc: 'Expiry dates, batch numbers & Rx',
    },
    {
      id: 'RESTAURANT',
      name: 'Restaurant / Food Stall',
      icon: UtensilsCrossed,
      desc: 'Prep times & ingredients',
    },
    { id: 'SALON', name: 'Salon & Services', icon: Scissors, desc: 'Services & beauty products' },
  ];

export default function SettingsModal({ isOpen, settings, onClose, onSave }: SettingsModalProps) {
  const [storeName, setStoreName] = useState(settings.store_name);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol);
  const [currencyCode, setCurrencyCode] = useState(settings.currency_code);
  const [businessType, setBusinessType] = useState<BusinessType>(
    settings.business_type || 'GENERAL_RETAIL'
  );
  const [expiryAlertDays, setExpiryAlertDays] = useState<number>(settings.expiry_alert_days || 30);
  const [customAttributes, setCustomAttributes] = useState<AttributeDefinition[]>(
    settings.custom_attributes || []
  );

  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'text' | 'number' | 'date' | 'boolean'>('text');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStoreName(settings.store_name);
      setCurrencySymbol(settings.currency_symbol);
      setCurrencyCode(settings.currency_code);
      setBusinessType(settings.business_type || 'GENERAL_RETAIL');
      setExpiryAlertDays(settings.expiry_alert_days || 30);
      setCustomAttributes(settings.custom_attributes || []);
      setError(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleCurrencySelect = (preset: (typeof CURRENCY_PRESETS)[0]) => {
    setCurrencySymbol(preset.symbol);
    setCurrencyCode(preset.code);
  };

  const handleAddCustomAttribute = () => {
    setError(null);
    if (!newLabel.trim()) return;
    const key = newKey.trim() || newLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (customAttributes.some((a) => a.key === key)) {
      setError('An attribute with this key already exists.');
      return;
    }
    setCustomAttributes([...customAttributes, { key, label: newLabel.trim(), type: newType }]);
    setNewKey('');
    setNewLabel('');
    setNewType('text');
  };

  const handleRemoveCustomAttribute = (key: string) => {
    setCustomAttributes(customAttributes.filter((a) => a.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({
        ...settings,
        store_name: storeName.trim(),
        currency_symbol: currencySymbol,
        currency_code: currencyCode,
        business_type: businessType,
        expiry_alert_days: expiryAlertDays,
        custom_attributes: customAttributes,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Failed to save settings: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-agora-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-agora-card border border-agora-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-agora-ink">
        <div className="px-6 py-4 border-b border-agora-border flex items-center justify-between bg-agora-bg/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-agora-terracotta" />
            <h3 className="font-serif font-bold text-agora-ink text-lg">Store Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-agora-ink-muted hover:text-agora-ink p-1 rounded-lg hover:bg-agora-bg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Store Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-ink">Store Name</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-agora-bg border border-agora-border rounded-xl px-3 py-2 text-sm text-agora-ink font-semibold focus:outline-none focus:border-agora-terracotta"
            />
          </div>

          {/* Business Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-agora-ink-muted mb-2">
              Business Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((bt) => {
                const Icon = bt.icon;
                const isSelected = businessType === bt.id;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => setBusinessType(bt.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-agora-terracotta/15 border-agora-terracotta text-agora-terracotta shadow-sm'
                        : 'bg-agora-bg/60 border-agora-border text-agora-ink-muted hover:text-agora-ink'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-agora-terracotta mt-0.5" />
                    <div>
                      <span className="font-bold text-xs block text-agora-ink">{bt.name}</span>
                      <span className="text-[10px] text-agora-ink-muted leading-tight block mt-0.5">
                        {bt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
              Currency
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CURRENCY_PRESETS.map((curr) => (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleCurrencySelect(curr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold border shrink-0 transition-all ${
                    currencySymbol === curr.symbol && currencyCode === curr.code
                      ? 'bg-agora-terracotta text-agora-card border-agora-terracotta'
                      : 'bg-agora-card border-agora-border text-agora-ink-muted hover:text-agora-ink'
                  }`}
                >
                  {curr.name}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry Alerts Threshold */}
          <div className="bg-agora-terracotta-light/40 p-4 rounded-2xl border border-agora-terracotta-border space-y-2">
            <label className="text-xs font-bold text-agora-terracotta flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Expiry Warning (Days)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="365"
                value={expiryAlertDays}
                onChange={(e) => setExpiryAlertDays(parseInt(e.target.value) || 30)}
                className="w-32 bg-agora-card border border-agora-border rounded-xl px-3 py-2 text-sm text-agora-ink font-serif font-bold focus:outline-none focus:border-agora-terracotta"
              />
              <span className="text-xs text-agora-ink-muted font-medium">
                Warn when products expire in{' '}
                <strong className="text-agora-terracotta">{expiryAlertDays} days</strong>
              </span>
            </div>
          </div>

          {/* Custom Attributes */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-agora-ink flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-agora-terracotta" /> Custom Fields
              </label>
            </div>

            {/* List */}
            <div className="space-y-2">
              {customAttributes.map((attr) => (
                <div
                  key={attr.key}
                  className="bg-agora-bg p-2.5 rounded-xl border border-agora-border flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-agora-ink">{attr.label}</span>
                    <span className="text-[10px] text-agora-ink-muted ml-2 uppercase font-semibold bg-agora-card px-1.5 py-0.5 rounded border border-agora-border">
                      {attr.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomAttribute(attr.key)}
                    className="text-agora-brick hover:text-agora-brick/80 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Attribute Row */}
            <div className="bg-agora-bg/60 p-3 rounded-2xl border border-agora-border space-y-2">
              <span className="text-[11px] text-agora-ink-muted font-bold block">
                Add Custom Field
              </span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Field Name (e.g. Supplier)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="col-span-2 bg-agora-card border border-agora-border rounded-xl px-2.5 py-1.5 text-xs text-agora-ink focus:outline-none"
                />
                <select
                  value={newType}
                  onChange={(e) =>
                    setNewType(e.target.value as 'text' | 'number' | 'date' | 'boolean')
                  }
                  className="bg-agora-card border border-agora-border rounded-xl px-2 py-1.5 text-xs text-agora-ink focus:outline-none"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Yes/No</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddCustomAttribute}
                className="w-full py-1.5 bg-agora-card hover:bg-agora-border text-agora-terracotta font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all border border-agora-border"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-agora-brick/10 border border-agora-brick/30 rounded-xl text-agora-brick text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-agora-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-agora-bg hover:bg-agora-border text-agora-ink font-bold rounded-xl text-sm transition-all border border-agora-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
