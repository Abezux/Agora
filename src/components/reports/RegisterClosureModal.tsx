'use client';

import React, { useState, useEffect } from 'react';
import { RegisterClosure } from '@/types';
import { api } from '@/services/api';
import { formatCurrency, parseInputToCents } from '@/utils/currency';
import { formatDate } from '@/utils/formatters';
import { X, Lock, DollarSign, AlertCircle, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface RegisterClosureModalProps {
  isOpen: boolean;
  currencySymbol: string;
  onClose: () => void;
  onConfirmClosure: (countedCash: number, notes?: string) => Promise<RegisterClosure | undefined>;
}

export default function RegisterClosureModal({
  isOpen,
  currencySymbol,
  onClose,
  onConfirmClosure,
}: RegisterClosureModalProps) {
  const [expectedCash, setExpectedCash] = useState<number>(0);
  const [totalCashSales, setTotalCashSales] = useState<number>(0);
  const [totalCashRefunds, setTotalCashRefunds] = useState<number>(0);
  const [periodStart, setPeriodStart] = useState<string>('');
  const [countedCashInput, setCountedCashInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExpectedCash();
      setExpectedCash(data.expectedCash);
      setTotalCashSales(data.totalCashSales);
      setTotalCashRefunds(data.totalCashRefunds);
      setPeriodStart(data.periodStart);
      setCountedCashInput((data.expectedCash / 100).toString());
    } catch (err: unknown) {
      console.error('Error calculating expected cash:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const countedCashInCents = parseInputToCents(countedCashInput);
  const varianceInCents = countedCashInCents - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirmClosure(countedCashInCents, notes || undefined);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Failed to close register: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-agora-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-agora-card border border-agora-border rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-agora-ink">
        {/* Header */}
        <div className="px-5 py-4 border-b border-agora-border flex items-center justify-between bg-agora-bg/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-agora-terracotta/10 p-2 rounded-xl text-agora-terracotta border border-agora-terracotta/20">
              <Lock className="w-5 h-5 text-agora-terracotta" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-agora-ink text-base sm:text-lg leading-tight">
                End-of-Day Cash Register Closure
              </h3>
              <span className="text-[11px] text-agora-ink-muted block mt-0.5 font-medium">
                Reconcile physical cash drawer with sales ledger
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-agora-ink-muted hover:text-agora-ink p-1 rounded-lg hover:bg-agora-bg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1"
        >
          {/* Period Banner */}
          <div className="bg-agora-bg p-3.5 rounded-2xl border border-agora-border text-xs space-y-1">
            <span className="text-agora-ink-muted font-bold uppercase tracking-wider block">
              Open Session Window
            </span>
            <div className="font-semibold text-agora-ink">
              Since {periodStart ? formatDate(periodStart) : 'Beginning of session'}
            </div>
          </div>

          {/* Expected Cash Breakdown */}
          <div className="bg-agora-bg p-4 rounded-2xl border border-agora-border space-y-2 text-xs">
            <div className="flex justify-between items-center text-agora-ink-muted">
              <span>Cash Sales Collected:</span>
              <span className="font-serif font-bold text-agora-ink">
                {formatCurrency(totalCashSales, currencySymbol)}
              </span>
            </div>
            {totalCashRefunds > 0 && (
              <div className="flex justify-between items-center text-agora-brick font-semibold">
                <span>Cash Refunds Paid Out:</span>
                <span>- {formatCurrency(totalCashRefunds, currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-agora-border">
              <span className="font-extrabold uppercase tracking-wider text-agora-ink">
                Calculated Expected Cash
              </span>
              <span className="text-2xl font-serif font-black text-agora-terracotta">
                {isLoading ? '...' : formatCurrency(expectedCash, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Counted Cash Input */}
          <div className="space-y-2 bg-agora-card p-4 rounded-2xl border border-agora-border/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
                Physically Counted Cash
              </label>
              <button
                type="button"
                onClick={() => setCountedCashInput((expectedCash / 100).toString())}
                className="text-xs font-bold text-agora-terracotta hover:underline"
              >
                Match Expected
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-agora-ink-muted font-serif font-bold text-lg">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                value={countedCashInput}
                onChange={(e) => setCountedCashInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-agora-bg border border-agora-border rounded-xl py-3 pl-9 pr-4 text-agora-ink font-serif font-black text-xl focus:outline-none focus:border-agora-terracotta"
              />
            </div>
          </div>

          {/* Live Variance Calculation Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              varianceInCents === 0
                ? 'bg-agora-sage-light border-agora-sage-border text-agora-sage'
                : varianceInCents > 0
                  ? 'bg-agora-brass/10 border-agora-brass/30 text-agora-brass'
                  : 'bg-agora-brick-light border-agora-brick-border text-agora-brick'
            }`}
          >
            <div className="flex items-center gap-2">
              {varianceInCents === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-agora-sage shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <div>
                <span className="uppercase tracking-wider block text-[11px]">
                  Reconciliation Variance
                </span>
                <span className="text-sm font-serif font-black">
                  {varianceInCents === 0
                    ? 'Balanced (No Variance)'
                    : varianceInCents > 0
                      ? `+${formatCurrency(varianceInCents, currencySymbol)} (Overage)`
                      : `${formatCurrency(varianceInCents, currencySymbol)} (Shortage)`}
                </span>
              </div>
            </div>
          </div>

          {/* Closure Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-agora-ink-muted mb-1">
              Closure Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. End of shift drawer count"
              className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 px-3 text-xs text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
            />
          </div>

          {error && (
            <div className="p-3 bg-agora-brick/10 border border-agora-brick/30 rounded-xl text-agora-brick text-xs font-medium">
              {error}
            </div>
          )}

          {/* Thumb-Zone Ergonomic Buttons */}
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
              disabled={isSubmitting || isLoading}
              className="flex-1 py-3.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-black text-base rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Closing...' : 'Close Register'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
