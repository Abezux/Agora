'use client';

import React, { useState } from 'react';
import { Sale } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';

interface VoidSaleModalProps {
  isOpen: boolean;
  sale: Sale | null;
  currencySymbol: string;
  onClose: () => void;
  onConfirmVoid: (saleId: string, reason: string) => Promise<void>;
}

export default function VoidSaleModal({
  isOpen,
  sale,
  currencySymbol,
  onClose,
  onConfirmVoid,
}: VoidSaleModalProps) {
  const [reason, setReason] = useState<string>('Customer returned items / mistake at register');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError('Please specify a reason for voiding this sale.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmVoid(sale.id, reason.trim());
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Failed to void sale: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-agora-card border border-agora-brick/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-agora-border flex items-center justify-between bg-agora-brick/10">
          <div className="flex items-center gap-2 text-agora-brick">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg">Void Sale {sale.sale_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-agora-ink/60 hover:text-agora-ink p-1.5 rounded-xl hover:bg-agora-bg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-agora-brick/10 border border-agora-brick/20 rounded-2xl p-4 text-xs text-agora-ink/80 space-y-1">
            <p className="font-bold text-sm text-agora-brick">
              Are you sure you want to void this sale?
            </p>
            <p className="text-agora-ink/70">
              This action will mark the receipt as voided (
              <span className="font-serif font-bold text-agora-ink">
                {formatCurrency(sale.total_amount, currencySymbol)}
              </span>
              ) and{' '}
              <strong className="text-agora-sage">automatically restore inventory stock</strong> for
              all {sale.items_count} item(s).
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-agora-ink/70">Reason for Voiding</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this sale is being voided..."
              className="w-full bg-agora-bg border border-agora-border rounded-xl p-3 text-xs text-agora-ink focus:outline-none focus:border-agora-brick"
            />
          </div>

          {error && (
            <div className="p-3 bg-agora-brick/10 border border-agora-brick/30 rounded-xl text-agora-brick text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-agora-bg hover:bg-agora-border/40 text-agora-ink font-bold rounded-xl text-sm border border-agora-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-agora-brick hover:bg-agora-brick/90 text-agora-card font-extrabold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              {isSubmitting ? 'Voiding...' : 'Confirm Void'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
