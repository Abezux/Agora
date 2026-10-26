import React, { useState, useRef } from 'react';
import { CartItem } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import ProductAvatar from '@/components/common/ProductAvatar';

interface CartDrawerProps {
  cart: CartItem[];
  currencySymbol: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

interface CartItemRowProps {
  item: CartItem;
  currencySymbol: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

function CartItemRow({ item, currencySymbol, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    if (diffX < 0) {
      setSwipeOffset(Math.max(diffX, -100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -60) {
      onRemoveItem(item.product.id);
    }
    setSwipeOffset(0);
    touchStartX.current = 0;
  };

  const lineTotal = item.product.price * item.quantity;

  return (
    <div className="relative overflow-hidden py-1">
      {/* Background Delete Trigger reveal */}
      <div
        onClick={() => onRemoveItem(item.product.id)}
        className="absolute inset-y-0 right-0 w-20 bg-agora-brick flex items-center justify-center text-agora-card font-bold rounded-lg cursor-pointer"
      >
        <Trash2 className="w-5 h-5 text-agora-card animate-pulse" />
      </div>

      {/* Swipeable Item Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className="relative bg-agora-card py-2 flex items-center justify-between gap-2.5 group hover:bg-agora-bg/50 px-1 rounded-lg transition-transform duration-75"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <ProductAvatar name={item.product.name} imageUrl={item.product.image_url} size="sm" />
            <h4 className="font-bold text-agora-ink text-xs truncate">{item.product.name}</h4>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-agora-ink-muted">
              {formatCurrency(item.product.price, currencySymbol)} ea
            </span>
            <span className="text-xs font-serif font-bold text-agora-terracotta">
              = {formatCurrency(lineTotal, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onRemoveItem(item.product.id)}
            className="p-1 text-agora-brick/60 hover:text-agora-brick hover:bg-agora-brick-light rounded-md transition-all hidden sm:block opacity-0 group-hover:opacity-100"
            title="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1 bg-agora-card border border-agora-border p-0.5 sm:p-1 rounded-xl shadow-inner shrink-0">
            <button
              onClick={() => onUpdateQuantity(item.product.id, -1)}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-agora-bg hover:bg-agora-border active:scale-95 flex items-center justify-center text-agora-ink font-bold transition-all text-xs"
            >
              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="w-5 sm:w-6 text-center font-bold text-xs text-agora-ink">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.product.id, 1)}
              disabled={item.quantity >= item.product.stock_quantity}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-agora-terracotta hover:bg-agora-terracotta-hover active:scale-95 disabled:opacity-40 flex items-center justify-center text-agora-card font-bold transition-all text-xs"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({
  cart,
  currencySymbol,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}: CartDrawerProps) {
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountInCents = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="ledger-card p-3 sm:p-4 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-agora-border mb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-agora-terracotta/10 p-2 rounded-xl text-agora-terracotta border border-agora-terracotta/20">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-agora-ink text-sm sm:text-base leading-tight">
              Current Cart
            </h2>
            <span className="text-[11px] sm:text-xs text-agora-ink-muted">
              {totalItemsCount} item(s)
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-semibold text-agora-brick hover:text-agora-brick/80 flex items-center gap-1 hover:bg-agora-brick-light px-2.5 py-1 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto pr-1 divide-y divide-agora-border/60 min-h-0">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-agora-ink-muted my-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-agora-bg border border-agora-border flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-agora-brass" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-agora-ink">Cart is empty</p>
            <p className="text-[11px] sm:text-xs text-agora-ink-muted mt-1 max-w-[180px]">
              Tap products in the catalog to add them to this sale
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              currencySymbol={currencySymbol}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Button */}
      <div className="pt-2.5 border-t border-agora-border shrink-0 mt-auto">
        <div className="space-y-1 mb-2.5">
          <div className="flex items-center justify-between text-xs text-agora-ink-muted">
            <span>Items Count:</span>
            <span className="font-bold text-agora-ink">{totalItemsCount} units</span>
          </div>
          <div className="flex items-center justify-between text-sm sm:text-base font-bold text-agora-ink pt-1 border-t border-agora-border/70">
            <span>Total:</span>
            <span className="text-xl sm:text-2xl font-serif font-black text-agora-terracotta">
              {formatCurrency(totalAmountInCents, currencySymbol)}
            </span>
          </div>
        </div>

        <button
          onClick={onProceedToCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 px-4 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Checkout</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
