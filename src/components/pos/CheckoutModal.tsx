'use client';

import React, { useState, useEffect } from 'react';
import { CartItem, Sale } from '@/types';
import { formatCurrency, parseInputToCents } from '@/utils/currency';
import BottomSheet from '@/components/common/BottomSheet';
import {
  X,
  DollarSign,
  Smartphone,
  CreditCard,
  HelpCircle,
  Receipt,
  Award,
  Tag,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  currencySymbol: string;
  onClose: () => void;
  onConfirmSale: (
    payments?: { method: string; amount: number }[],
    discountAmount?: number,
    discountReason?: string,
    notes?: string
  ) => Promise<Sale | undefined>;
}

export default function CheckoutModal({
  isOpen,
  cart,
  currencySymbol,
  onClose,
  onConfirmSale,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [splitAllocations, setSplitAllocations] = useState<Record<string, string>>({
    CASH: '',
    MOBILE_MONEY: '',
    CARD: '',
    OTHER: '',
  });

  // Discount states
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');

  const [cashTenderedInput, setCashTenderedInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculations
  const subtotalInCents = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let computedDiscountCents = 0;
  if (discountType === 'AMOUNT') {
    computedDiscountCents = parseInputToCents(discountInput);
  } else {
    const pct = parseFloat(discountInput || '0');
    if (!isNaN(pct) && pct > 0) {
      computedDiscountCents = Math.round(subtotalInCents * (pct / 100));
    }
  }
  const discountAmountInCents = Math.min(subtotalInCents, Math.max(0, computedDiscountCents));
  const finalTotalDueInCents = Math.max(0, subtotalInCents - discountAmountInCents);

  // Split payment totals
  const allocatedSumInCents = Object.values(splitAllocations).reduce(
    (sum, val) => sum + parseInputToCents(val),
    0
  );
  const remainingToAllocateInCents = finalTotalDueInCents - allocatedSumInCents;

  const cashTenderedInCents = parseInputToCents(cashTenderedInput);
  const changeInCents = Math.max(0, cashTenderedInCents - finalTotalDueInCents);

  useEffect(() => {
    if (isOpen) {
      setCashTenderedInput((finalTotalDueInCents / 100).toString());
      setCompletedSale(null);
      setIsSubmitting(false);
      setIsSplitPayment(false);
      setDiscountInput('');
      setDiscountReason('');
      setSplitAllocations({ CASH: '', MOBILE_MONEY: '', CARD: '', OTHER: '' });
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isSplitPayment) {
      setCashTenderedInput((finalTotalDueInCents / 100).toString());
    }
  }, [finalTotalDueInCents, isSplitPayment]);

  if (!isOpen) return null;

  const handlePresetCash = (multiplier: number) => {
    setCashTenderedInput(multiplier.toString());
  };

  const handleExactCash = () => {
    setCashTenderedInput((finalTotalDueInCents / 100).toString());
  };

  const handleFillRemainingSplit = (methodKey: string) => {
    const currentForMethod = parseInputToCents(splitAllocations[methodKey] || '');
    const maxFill = Math.max(0, remainingToAllocateInCents + currentForMethod);
    setSplitAllocations((prev) => ({
      ...prev,
      [methodKey]: (maxFill / 100).toString(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      let paymentsToSend: { method: string; amount: number }[] = [];

      if (isSplitPayment) {
        if (remainingToAllocateInCents !== 0) {
          setError('Allocated split payment must equal the exact final total due!');
          setIsSubmitting(false);
          return;
        }

        paymentsToSend = Object.entries(splitAllocations)
          .map(([method, amtStr]) => ({
            method,
            amount: parseInputToCents(amtStr),
          }))
          .filter((p) => p.amount > 0);

        if (paymentsToSend.length === 0) {
          setError('Please allocate payment amounts to at least one method.');
          setIsSubmitting(false);
          return;
        }
      } else {
        paymentsToSend = [{ method: paymentMethod, amount: finalTotalDueInCents }];
      }

      const sale = await onConfirmSale(
        paymentsToSend,
        discountAmountInCents,
        discountReason || undefined,
        notes || undefined
      );

      if (sale) {
        setCompletedSale(sale);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Failed to complete sale: ' + message);
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {completedSale ? (
        /* Sale Success View */
        <div className="p-6 text-center space-y-5 overflow-y-auto">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center my-2">
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-agora-terracotta/40 animate-spin-slow" />
            <div className="w-20 h-20 rounded-full border-2 border-agora-terracotta bg-agora-terracotta/10 flex flex-col items-center justify-center p-2 transform -rotate-12 shadow-sm">
              <Award className="w-6 h-6 text-agora-terracotta" />
              <span className="font-serif font-black text-[9px] uppercase tracking-widest text-agora-terracotta leading-none mt-0.5">
                AGORA
              </span>
              <span className="text-[7px] font-bold tracking-tighter text-agora-terracotta uppercase">
                RECORDED
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-agora-sage bg-agora-sage-light px-3 py-1 rounded-full border border-agora-sage-border">
              Sale Complete
            </span>
            <h2 className="text-3xl font-serif font-black text-agora-terracotta mt-3">
              {formatCurrency(completedSale.total_amount, currencySymbol)}
            </h2>
            {completedSale.discount_amount && completedSale.discount_amount > 0 ? (
              <p className="text-xs text-agora-sage font-bold mt-1">
                Saved {formatCurrency(completedSale.discount_amount, currencySymbol)} with discount
              </p>
            ) : null}
            <p className="text-xs text-agora-ink-muted mt-0.5 font-medium">
              Receipt {completedSale.sale_number} • Stock updated
            </p>
          </div>

          {/* Change Display */}
          {!isSplitPayment &&
            paymentMethod === 'CASH' &&
            cashTenderedInCents > finalTotalDueInCents && (
              <div className="bg-agora-sage-light border border-agora-sage-border rounded-2xl p-4 text-center">
                <span className="text-xs text-agora-sage uppercase tracking-wider font-bold block">
                  Change due to customer
                </span>
                <div className="text-3xl font-serif font-black text-agora-sage mt-1">
                  {formatCurrency(changeInCents, currencySymbol)}
                </div>
              </div>
            )}

          {/* Sold Items Summary */}
          <div className="bg-agora-bg border border-agora-border rounded-2xl p-4 text-left max-h-40 overflow-y-auto space-y-2">
            <div className="flex justify-between text-xs font-bold text-agora-ink-muted border-b border-agora-border pb-1">
              <span>Item</span>
              <span>Qty × Price</span>
            </div>
            {completedSale.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-xs text-agora-ink border-b border-agora-border/40 pb-1"
              >
                <span className="truncate max-w-[200px] font-medium">{item.product_name}</span>
                <span className="font-serif font-bold">
                  {item.quantity} × {formatCurrency(item.unit_price, currencySymbol)}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold text-lg rounded-xl shadow-md transition-all active:scale-[0.99]"
          >
            Next Sale
          </button>
        </div>
      ) : (
        /* Checkout Form View */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-agora-border flex items-center justify-between bg-agora-bg/50 shrink-0">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-agora-terracotta" />
              <h3 className="font-serif font-bold text-agora-ink text-base sm:text-lg">
                Checkout & Payment
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-agora-ink-muted hover:text-agora-ink p-1 rounded-lg hover:bg-agora-bg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1"
          >
            {/* Live Total & Subtotal Summary Banner */}
            <div className="bg-agora-bg p-3.5 sm:p-4 rounded-2xl border border-agora-border space-y-2">
              <div className="flex justify-between items-center text-xs text-agora-ink-muted">
                <span>Gross Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-serif font-bold text-agora-ink">
                  {formatCurrency(subtotalInCents, currencySymbol)}
                </span>
              </div>

              {discountAmountInCents > 0 && (
                <div className="flex justify-between items-center text-xs text-agora-sage font-bold pt-1 border-t border-agora-border/60">
                  <span>Discount Applied</span>
                  <span>- {formatCurrency(discountAmountInCents, currencySymbol)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-1.5 border-t border-agora-border">
                <span className="text-xs text-agora-ink uppercase tracking-wider font-extrabold">
                  Final Total Due
                </span>
                <div className="text-2xl sm:text-3xl font-serif font-black text-agora-terracotta">
                  {formatCurrency(finalTotalDueInCents, currencySymbol)}
                </div>
              </div>
            </div>

            {/* Discount Section */}
            <div className="bg-agora-card p-3 rounded-2xl border border-agora-border/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-agora-terracotta" /> Add Discount
                </span>
                <div className="flex items-center gap-1 bg-agora-bg p-0.5 rounded-lg border border-agora-border">
                  <button
                    type="button"
                    onClick={() => setDiscountType('AMOUNT')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      discountType === 'AMOUNT'
                        ? 'bg-agora-terracotta text-agora-card'
                        : 'text-agora-ink-muted hover:text-agora-ink'
                    }`}
                  >
                    {currencySymbol} Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      discountType === 'PERCENT'
                        ? 'bg-agora-terracotta text-agora-card'
                        : 'text-agora-ink-muted hover:text-agora-ink'
                    }`}
                  >
                    % Percent
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder={discountType === 'AMOUNT' ? '0.00' : 'e.g. 10%'}
                    className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 px-3 text-xs text-agora-ink font-bold placeholder:text-agora-ink-muted/70 focus:outline-none focus:border-agora-terracotta"
                  />
                </div>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 px-3 text-xs text-agora-ink placeholder:text-agora-ink-muted/70 focus:outline-none focus:border-agora-terracotta"
                />
              </div>
            </div>

            {/* Payment Mode Selector: Single vs Split */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
                  Payment Method
                </label>

                <button
                  type="button"
                  onClick={() => setIsSplitPayment(!isSplitPayment)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                    isSplitPayment
                      ? 'bg-agora-terracotta text-agora-card border-agora-terracotta'
                      : 'bg-agora-brass/10 border-agora-brass/30 text-agora-brass hover:bg-agora-brass/20'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isSplitPayment ? 'Split Active' : 'Enable Split Payment'}</span>
                </button>
              </div>

              {!isSplitPayment ? (
                /* Single Payment Selector */
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash', icon: DollarSign },
                    { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                    { id: 'OTHER', label: 'Other', icon: HelpCircle },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-agora-terracotta/15 border-agora-terracotta text-agora-terracotta shadow-sm'
                            : 'bg-agora-bg/60 border-agora-border text-agora-ink-muted hover:text-agora-ink'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Split Payment Allocation Inputs */
                <div className="space-y-2 bg-agora-bg/80 p-3.5 rounded-2xl border border-agora-border">
                  <div className="flex items-center justify-between pb-2 border-b border-agora-border text-xs">
                    <span className="font-bold text-agora-ink-muted">Method Allocation</span>
                    {remainingToAllocateInCents === 0 ? (
                      <span className="text-agora-sage font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Allocation
                      </span>
                    ) : (
                      <span
                        className={`font-bold flex items-center gap-1 ${remainingToAllocateInCents > 0 ? 'text-agora-brick' : 'text-agora-brick'}`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Remaining:{' '}
                        {formatCurrency(remainingToAllocateInCents, currencySymbol)}
                      </span>
                    )}
                  </div>

                  {[
                    { id: 'CASH', label: 'Cash', icon: DollarSign },
                    { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                    { id: 'OTHER', label: 'Other', icon: HelpCircle },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <div key={pm.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-agora-ink font-bold w-32 shrink-0">
                          <Icon className="w-3.5 h-3.5 text-agora-terracotta" />
                          <span>{pm.label}</span>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            value={splitAllocations[pm.id] || ''}
                            onChange={(e) =>
                              setSplitAllocations({ ...splitAllocations, [pm.id]: e.target.value })
                            }
                            placeholder="0.00"
                            className="w-full bg-agora-card border border-agora-border rounded-xl py-1.5 px-3 text-right font-serif font-bold text-agora-ink focus:outline-none focus:border-agora-terracotta"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFillRemainingSplit(pm.id)}
                          className="px-2 py-1 bg-agora-terracotta/10 hover:bg-agora-terracotta/20 text-agora-terracotta font-bold rounded-lg border border-agora-terracotta/30 text-[11px] shrink-0"
                        >
                          Fill
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Single Cash Calculator */}
            {!isSplitPayment && paymentMethod === 'CASH' && (
              <div className="space-y-2.5 bg-agora-bg/70 p-3.5 rounded-2xl border border-agora-border">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-agora-ink">Cash Received</label>
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="text-xs font-bold text-agora-terracotta hover:underline"
                  >
                    Exact Amount
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-agora-ink-muted font-serif font-bold">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    className="w-full bg-agora-card border border-agora-border rounded-xl py-2 pl-8 pr-4 text-agora-ink font-serif font-bold text-lg focus:outline-none focus:border-agora-terracotta"
                    placeholder="0.00"
                  />
                </div>

                {/* Quick Cash Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {[5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetCash(amt)}
                      className="px-2.5 py-1 rounded-xl bg-agora-card hover:bg-agora-border text-agora-ink text-xs font-serif font-bold border border-agora-border shrink-0"
                    >
                      {currencySymbol}
                      {amt}
                    </button>
                  ))}
                </div>

                {/* Change Output */}
                {cashTenderedInCents >= finalTotalDueInCents && (
                  <div className="flex justify-between items-center pt-2 border-t border-agora-border text-xs">
                    <span className="text-agora-ink-muted font-medium">Change due:</span>
                    <span className="font-serif font-bold text-agora-sage text-base">
                      {formatCurrency(changeInCents, currencySymbol)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-agora-ink-muted mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Special order notes"
                className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 px-3 text-xs text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
              />
            </div>

            {error && (
              <div className="p-3 bg-agora-brick/10 border border-agora-brick/30 rounded-xl text-agora-brick text-xs font-medium">
                {error}
              </div>
            )}

            {/* Thumb-Zone Ergonomic Action Buttons */}
            <div className="flex items-center gap-3 pt-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-agora-bg hover:bg-agora-border text-agora-ink font-bold rounded-xl text-sm transition-all border border-agora-border"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || (isSplitPayment && remainingToAllocateInCents !== 0)}
                className="flex-1 py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-black text-base rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </form>
        </div>
      )}
    </BottomSheet>
  );
}
