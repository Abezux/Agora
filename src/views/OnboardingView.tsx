import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BusinessType } from '@/types';
import { CURRENCY_PRESETS } from '@/utils/currency';
import { api } from '@/services/api';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Package,
  Store,
  ShoppingBag,
  Pill,
  UtensilsCrossed,
  Scissors,
} from 'lucide-react';

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

export default function OnboardingView() {
  const { createStore } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State
  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('MINI_SHOP');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');

  // Step 2 State
  const [seedOption, setSeedOption] = useState<'DEMO' | 'EMPTY'>('DEMO');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setErrorMsg('Please enter a name for your store.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Submit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Create Store
      const res = await createStore(storeName, businessType, currencySymbol, currencyCode);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      // 2. Seed catalog if selected
      if (seedOption === 'DEMO') {
        await api.seedDemo();
      }

      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete setup';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-agora-bg text-agora-ink flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl ledger-card p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-agora-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-agora-terracotta/10 text-agora-terracotta border border-agora-terracotta/30 rounded-xl flex items-center justify-center font-serif font-black">
              {step}
            </div>
            <div>
              <h2 className="font-serif font-bold text-agora-ink text-lg">
                {step === 1 ? 'Step 1: Store Setup' : 'Step 2: Product Catalog'}
              </h2>
              <span className="text-xs text-agora-ink-muted font-medium">
                {step === 1
                  ? 'Configure store name, business type & currency'
                  : 'Choose how to start your product catalog'}
              </span>
            </div>
          </div>
          <span className="text-xs font-serif font-bold text-agora-terracotta bg-agora-terracotta-light px-3 py-1 rounded-full border border-agora-terracotta-border">
            {step} of 2
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-agora-brick-light border border-agora-brick-border rounded-2xl text-xs text-agora-brick font-medium">
            {errorMsg}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-agora-ink">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Corner Shop"
                className="w-full bg-agora-bg border border-agora-border rounded-xl py-2.5 px-3 text-sm text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
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

            {/* Currency Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
                Currency
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CURRENCY_PRESETS.map((curr) => (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      setCurrencySymbol(curr.symbol);
                      setCurrencyCode(curr.code);
                    }}
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

            <button
              type="submit"
              className="w-full py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 2 */
          <div className="space-y-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
              Select catalog setup
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSeedOption('DEMO')}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                  seedOption === 'DEMO'
                    ? 'bg-agora-terracotta/15 border-agora-terracotta text-agora-terracotta shadow-sm'
                    : 'bg-agora-bg/60 border-agora-border text-agora-ink-muted hover:text-agora-ink'
                }`}
              >
                <Sparkles className="w-6 h-6 text-agora-terracotta" />
                <div>
                  <h4 className="font-serif font-bold text-agora-ink text-sm">
                    Load Sample Products
                  </h4>
                  <p className="text-xs text-agora-ink-muted mt-1">
                    Pre-loads sample items tailored to your business type.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSeedOption('EMPTY')}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                  seedOption === 'EMPTY'
                    ? 'bg-agora-terracotta/15 border-agora-terracotta text-agora-terracotta shadow-sm'
                    : 'bg-agora-bg/60 border-agora-border text-agora-ink-muted hover:text-agora-ink'
                }`}
              >
                <Package className="w-6 h-6 text-agora-brass" />
                <div>
                  <h4 className="font-serif font-bold text-agora-ink text-sm">Start Fresh</h4>
                  <p className="text-xs text-agora-ink-muted mt-1">
                    Start with an empty catalog and add products manually.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-agora-bg hover:bg-agora-border text-agora-ink font-bold rounded-xl text-sm transition-all border border-agora-border"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStep2Submit}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Initializing...' : 'Complete Setup'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
