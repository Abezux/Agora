'use client';

import React, { useState } from 'react';
import { Sale, SaleItem } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/formatters';
import BottomSheet from '@/components/common/BottomSheet';
import {
  X,
  Receipt,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Ban,
  RefreshCw,
  Tag,
} from 'lucide-react';

interface SaleDetailModalProps {
  isOpen: boolean;
  sale: Sale | null;
  currencySymbol: string;
  onClose: () => void;
  onRequestVoid: (sale: Sale) => void;
  onProcessRefund?: (
    saleId: string,
    refundItems: { sale_item_id: string; quantity: number }[],
    reason?: string
  ) => Promise<void>;
}

export default function SaleDetailModal({
  isOpen,
  sale,
  currencySymbol,
  onClose,
  onRequestVoid,
  onProcessRefund,
}: SaleDetailModalProps) {
  const [refundingItemId, setRefundingItemId] = useState<string | null>(null);
  const [refundQtyInput, setRefundQtyInput] = useState<string>('1');
  const [refundReasonInput, setRefundReasonInput] = useState<string>('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const isVoided = sale.status === 'VOIDED';

  const handleStartRefund = (item: SaleItem) => {
    const unrefunded = item.quantity - (item.refunded_quantity || 0);
    setRefundingItemId(item.id);
    setRefundQtyInput(unrefunded.toString());
    setRefundReasonInput('');
    setRefundError(null);
  };

  const handleConfirmRefund = async (item: SaleItem) => {
    if (!onProcessRefund) return;
    setRefundError(null);
    const qtyToRefund = parseFloat(refundQtyInput);
    const unrefunded = item.quantity - (item.refunded_quantity || 0);

    if (isNaN(qtyToRefund) || qtyToRefund <= 0 || qtyToRefund > unrefunded) {
      setRefundError(`Invalid refund quantity. Must be between 0 and ${unrefunded}`);
      return;
    }

    setIsSubmittingRefund(true);
    try {
      await onProcessRefund(
        sale.id,
        [{ sale_item_id: item.id, quantity: qtyToRefund }],
        refundReasonInput || 'Customer return'
      );
      setRefundingItemId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setRefundError('Failed to process refund: ' + message);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-agora-terracotta shrink-0" />
          <span className="font-serif font-bold text-agora-ink text-base sm:text-lg">
            Sale {sale.sale_number}
          </span>
        </div>
      }
      subtitle={formatDate(sale.timestamp)}
    >
      {/* Status Badge Banner */}
      {(() => {
        const isPartiallyRefunded = sale.status === 'PARTIALLY_REFUNDED';
        const isFullyRefunded = sale.status === 'REFUNDED';

        return (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isVoided || isFullyRefunded
                ? 'bg-agora-brick/10 border-agora-brick/30 text-agora-brick'
                : isPartiallyRefunded
                  ? 'bg-agora-brass/10 border-agora-brass/30 text-agora-brass'
                  : 'bg-agora-sage/10 border-agora-sage/30 text-agora-sage'
            }`}
          >
            <div className="flex items-center gap-2">
              {isVoided ? (
                <Ban className="w-5 h-5 text-agora-brick" />
              ) : isFullyRefunded ? (
                <RotateCcw className="w-5 h-5 text-agora-brick" />
              ) : isPartiallyRefunded ? (
                <RefreshCw className="w-5 h-5 text-agora-brass" />
              ) : (
                <CheckCircle className="w-5 h-5 text-agora-sage" />
              )}
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block">
                  Status: {sale.status.replace('_', ' ')}
                </span>
                {isVoided && (
                  <span className="text-xs text-agora-brick">
                    Reason: {sale.void_reason || 'No reason specified'}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-agora-card border border-agora-border text-agora-ink">
              {sale.payment_method || 'CASH'}
            </span>
          </div>
        );
      })()}

      {/* Line Items Table with Partial Refunds */}
      <div className="bg-agora-bg rounded-2xl border border-agora-border overflow-hidden">
        <div className="px-4 py-2.5 bg-agora-bg/80 border-b border-agora-border text-xs font-bold text-agora-ink/60 flex justify-between">
          <span>Item</span>
          <span>Price & Qty</span>
        </div>
        <div className="divide-y divide-agora-border/60">
          {sale.items?.map((item) => {
            const refunded = item.refunded_quantity || 0;
            const unrefunded = item.quantity - refunded;
            const isRefunding = refundingItemId === item.id;

            return (
              <div key={item.id} className="p-3.5 space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <div className="flex-1 pr-2">
                    <span className="font-bold text-agora-ink block text-sm">
                      {item.product_name}
                    </span>
                    <span className="text-agora-ink-muted">
                      {formatCurrency(item.unit_price, currencySymbol)} each
                    </span>
                    {refunded > 0 && (
                      <span className="text-[11px] font-bold text-agora-brick block mt-0.5">
                        • {refunded} unit(s) refunded
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-serif font-bold text-agora-ink text-sm block">
                      {formatCurrency(item.line_total, currencySymbol)}
                    </span>
                    <span className="text-agora-ink-muted">{item.quantity} unit(s) total</span>

                    {!isVoided && unrefunded > 0 && onProcessRefund && !isRefunding && (
                      <button
                        type="button"
                        onClick={() => handleStartRefund(item)}
                        className="mt-1 px-2 py-0.5 bg-agora-brick/10 hover:bg-agora-brick/20 text-agora-brick border border-agora-brick/30 font-bold rounded-lg text-[11px] transition-all"
                      >
                        Refund Item
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Refund Form */}
                {isRefunding && (
                  <div className="bg-agora-card p-3 rounded-xl border border-agora-brick/40 space-y-2 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between font-bold text-agora-brick">
                      <span>Refund {item.product_name}</span>
                      <span className="text-[10px] text-agora-ink-muted">Max: {unrefunded}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        value={refundQtyInput}
                        onChange={(e) => setRefundQtyInput(e.target.value)}
                        placeholder="Qty to refund"
                        className="bg-agora-bg border border-agora-border rounded-lg py-1.5 px-2.5 text-xs font-bold text-agora-ink focus:outline-none focus:border-agora-brick"
                      />
                      <input
                        type="text"
                        value={refundReasonInput}
                        onChange={(e) => setRefundReasonInput(e.target.value)}
                        placeholder="Reason (optional)"
                        className="bg-agora-bg border border-agora-border rounded-lg py-1.5 px-2.5 text-xs text-agora-ink focus:outline-none focus:border-agora-brick"
                      />
                    </div>
                    {refundError && (
                      <div className="p-2 bg-agora-brick/10 border border-agora-brick/30 rounded-lg text-agora-brick text-[11px] font-medium">
                        {refundError}
                      </div>
                    )}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setRefundingItemId(null)}
                        className="px-2.5 py-1 bg-agora-bg border border-agora-border text-agora-ink font-bold rounded-lg text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingRefund}
                        onClick={() => handleConfirmRefund(item)}
                        className="px-3 py-1 bg-agora-brick text-agora-card font-bold rounded-lg text-[11px] shadow-sm disabled:opacity-50"
                      >
                        {isSubmittingRefund ? 'Processing...' : 'Confirm Refund'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtotal & Discount Breakdown */}
      <div className="bg-agora-bg p-3.5 rounded-2xl border border-agora-border space-y-1.5 text-xs">
        {sale.subtotal_amount ? (
          <div className="flex justify-between text-agora-ink-muted">
            <span>Gross Subtotal:</span>
            <span className="font-serif font-bold text-agora-ink">
              {formatCurrency(sale.subtotal_amount, currencySymbol)}
            </span>
          </div>
        ) : null}

        {sale.discount_amount && sale.discount_amount > 0 ? (
          <div className="flex justify-between text-agora-sage font-bold">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-agora-sage" /> Discount (
              {sale.discount_reason || 'Applied'}):
            </span>
            <span>- {formatCurrency(sale.discount_amount, currencySymbol)}</span>
          </div>
        ) : null}

        <div className="flex justify-between items-baseline pt-1.5 border-t border-agora-border">
          <span className="font-bold text-agora-ink">Charged Total:</span>
          <span className="text-xl font-serif font-black text-agora-terracotta">
            {formatCurrency(sale.total_amount, currencySymbol)}
          </span>
        </div>
      </div>

      {sale.notes && (
        <div className="bg-agora-bg/60 p-3 rounded-xl border border-agora-border text-xs text-agora-ink/80">
          <span className="font-bold text-agora-ink/60 block">Note:</span>
          {sale.notes}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex gap-3">
        {!isVoided && (
          <button
            onClick={() => onRequestVoid(sale)}
            className="w-full py-3 bg-agora-brick/15 hover:bg-agora-brick/25 text-agora-brick font-bold rounded-xl text-sm border border-agora-brick/30 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-agora-brick" />
            Void Full Sale & Restore Stock
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
