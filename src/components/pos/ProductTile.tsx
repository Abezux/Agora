import React from 'react';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { AlertTriangle, PackageX, Calendar, Star } from 'lucide-react';
import ProductAvatar from '@/components/common/ProductAvatar';

interface ProductTileProps {
  product: Product;
  currencySymbol: string;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
  onToggleFavorite?: (product: Product, e: React.MouseEvent) => void;
}

export default function ProductTile({
  product,
  currencySymbol,
  cartQuantity,
  onAddToCart,
  onToggleFavorite,
}: ProductTileProps) {
  const remainingStock = product.stock_quantity - cartQuantity;
  const isOut = remainingStock <= 0;
  const isLowStock = !isOut && remainingStock <= product.low_stock_threshold;
  const unitLabel = product.unit_type && product.unit_type !== 'piece' ? product.unit_type : '';
  const expDate = product.attributes?.expiry_date
    ? new Date(product.attributes.expiry_date as string)
    : null;

  return (
    <div
      role="button"
      tabIndex={isOut ? -1 : 0}
      onClick={() => !isOut && onAddToCart(product)}
      onKeyDown={(e) => {
        if (!isOut && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAddToCart(product);
        }
      }}
      className={`relative group text-left w-full p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-150 flex flex-col justify-between select-none ${
        isOut
          ? 'bg-agora-bg/60 border-agora-border opacity-50 cursor-not-allowed'
          : isLowStock
            ? 'bg-agora-card border-agora-gold/40 hover:border-agora-gold shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer'
            : 'bg-agora-card border-agora-border hover:border-agora-brass hover:shadow-md active:scale-[0.98] cursor-pointer'
      }`}
    >
      {/* Top row: Avatar & Actions (Favorite Star & Cart Badge) */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2.5 w-full">
        <ProductAvatar
          name={product.name}
          imageUrl={product.image_url}
          size="sm"
          className="sm:hidden"
        />
        <ProductAvatar
          name={product.name}
          imageUrl={product.image_url}
          size="md"
          className="hidden sm:flex"
        />

        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product, e);
              }}
              title={product.is_favorite ? 'Unpin favorite' : 'Pin to favorites'}
              className="p-1 sm:p-1.5 rounded-lg text-agora-brass hover:bg-agora-bg/80 transition-colors shrink-0"
            >
              <Star
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  product.is_favorite
                    ? 'fill-agora-brass text-agora-brass'
                    : 'text-agora-ink-muted/60 hover:text-agora-brass'
                }`}
              />
            </button>
          )}

          {cartQuantity > 0 && (
            <span className="bg-agora-terracotta text-agora-card font-bold text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm animate-pulse">
              {cartQuantity} in cart
            </span>
          )}
        </div>
      </div>

      {/* Middle: Name (Category & Expiry visible only on Tablet/Desktop for high density) */}
      <div className="mb-1.5 sm:mb-3">
        <div className="hidden sm:flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-agora-brass block">
            {product.category}
          </span>
          {expDate && (
            <span className="text-[9px] text-agora-gold font-bold flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" /> Exp:{' '}
              {expDate.toLocaleDateString(undefined, { month: 'short' })}
            </span>
          )}
        </div>

        <h3 className="font-bold text-agora-ink text-xs sm:text-sm leading-tight sm:leading-snug line-clamp-2">
          {product.name}
        </h3>
      </div>

      {/* Bottom: Price & Stock Badge */}
      <div className="pt-1.5 sm:pt-2.5 border-t border-agora-border/70 flex items-center justify-between w-full gap-1">
        <span className="font-serif font-bold text-agora-terracotta text-xs sm:text-base truncate">
          {formatCurrency(product.price, currencySymbol)}{' '}
          {unitLabel && (
            <span className="text-[10px] sm:text-xs font-sans font-normal text-agora-ink-muted">
              /{unitLabel}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {isOut ? (
            <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-agora-brick bg-agora-brick-light px-1.5 sm:px-2 py-0.5 rounded-md border border-agora-brick-border">
              <PackageX className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Out
            </span>
          ) : isLowStock ? (
            <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-agora-gold bg-agora-gold-light px-1.5 sm:px-2 py-0.5 rounded-md border border-agora-gold-border">
              <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-agora-gold" />{' '}
              {remainingStock} left
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] font-semibold text-agora-ink-muted">
              {remainingStock} {unitLabel || 'left'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
