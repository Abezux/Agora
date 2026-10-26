'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import BottomSheet from '@/components/common/BottomSheet';
import { X, PlusCircle, ArrowUpRight } from 'lucide-react';
import ProductAvatar from '@/components/common/ProductAvatar';

interface RestockModalProps {
  isOpen: boolean;
  product: Product | null;
  suggestedQuantity?: number;
  onClose: () => void;
  onRestock: (productId: string, addQuantity: number, note?: string) => Promise<void>;
}

export default function RestockModal({
  isOpen,
  product,
  suggestedQuantity,
  onClose,
  onRestock,
}: RestockModalProps) {
  const [addQuantity, setAddQuantity] = useState<number>(10);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAddQuantity(suggestedQuantity && suggestedQuantity > 0 ? suggestedQuantity : 10);
      setNote('');
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen, suggestedQuantity]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (addQuantity <= 0) {
      setError('Please enter a quantity greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRestock(product.id, addQuantity, note);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Failed to restock product: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const newTotalStock = product.stock_quantity + (addQuantity || 0);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-agora-ink-muted shrink-0" />
          <span className="font-serif font-bold text-agora-ink text-lg">Restock Inventory</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Target Product Summary */}
        <div className="bg-agora-bg p-4 rounded-2xl border border-agora-border flex items-center gap-3">
          <ProductAvatar name={product.name} imageUrl={product.image_url} size="lg" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-agora-brass">
              {product.category}
            </span>
            <h4 className="font-bold text-agora-ink text-base leading-tight">{product.name}</h4>
            <p className="text-xs text-agora-ink-muted mt-0.5">
              Current stock:{' '}
              <strong className="font-serif text-agora-ink">{product.stock_quantity} units</strong>
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-agora-ink">Quick Add Quantity</label>
            {suggestedQuantity && suggestedQuantity > 0 && (
              <button
                type="button"
                onClick={() => setAddQuantity(suggestedQuantity)}
                className="text-[11px] font-bold text-agora-gold bg-agora-gold-light px-2 py-0.5 rounded-full border border-agora-gold-border hover:underline"
              >
                Suggested: +{suggestedQuantity}
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 24, 50].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setAddQuantity(qty)}
                className={`py-2 px-3 rounded-xl border text-xs font-serif font-bold transition-all ${
                  addQuantity === qty
                    ? 'bg-agora-brass/15 border-agora-brass text-agora-brass shadow-sm'
                    : 'bg-agora-card border-agora-border text-agora-ink-muted hover:text-agora-ink'
                }`}
              >
                +{qty}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-agora-ink">Quantity to Add</label>
          <input
            type="number"
            min="1"
            required
            value={addQuantity}
            onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
            className="w-full bg-agora-bg border border-agora-border rounded-xl px-4 py-3 text-lg text-agora-ink font-serif font-bold focus:outline-none focus:border-agora-terracotta"
          />
        </div>

        {/* Projected Stock Balance */}
        <div className="bg-agora-sage-light border border-agora-sage-border rounded-2xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-agora-sage font-bold">New Total Stock Balance:</span>
          <span className="text-lg font-serif font-black text-agora-sage flex items-center gap-1">
            {newTotalStock} units <ArrowUpRight className="w-4 h-4 text-agora-sage" />
          </span>
        </div>

        {/* Note */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-agora-ink-muted">
            Restock Reason / Note{' '}
            <span className="text-[10px] text-agora-ink-muted/70">(Optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Received new shipment from supplier"
            className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 px-3 text-xs text-agora-ink placeholder-agora-ink-muted/60 focus:outline-none focus:border-agora-terracotta"
          />
        </div>

        {error && (
          <div className="p-3 bg-agora-brick/10 border border-agora-brick/30 rounded-xl text-agora-brick text-xs font-medium">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
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
            className="flex-1 py-3 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : `Confirm +${addQuantity} Units`}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
