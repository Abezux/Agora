import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, CartItem, Sale, StoreSettings } from '@/types';
import { api } from '@/services/api';
import ProductTile from '@/components/pos/ProductTile';
import CartDrawer from '@/components/pos/CartDrawer';
import CheckoutModal from '@/components/pos/CheckoutModal';
import ProductAvatar from '@/components/common/ProductAvatar';
import { formatCurrency } from '@/utils/currency';
import {
  Search,
  AlertTriangle,
  Plus,
  ShoppingCart,
  RefreshCw,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
} from 'lucide-react';

export default function SellView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Agora Kiosk',
    currency_symbol: '$',
    currency_code: 'USD',
    low_stock_alerts_enabled: true,
    business_type: 'GENERAL_RETAIL',
    expiry_alert_days: 30,
    custom_attributes: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Pull to refresh gesture state
  const catalogRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, stgs, salesHistory] = await Promise.all([
        api.getProducts(),
        api.getSettings(),
        api.getSales(),
      ]);
      setProducts(prods);
      setSettings(stgs);
      setSales(salesHistory);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 4000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', 'FAVORITES', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'ALL'
          ? true
          : selectedCategory === 'FAVORITES'
            ? product.is_favorite === true
            : product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLowStock =
        !showLowStockOnly || product.stock_quantity <= product.low_stock_threshold;

      return matchesCategory && matchesSearch && matchesLowStock;
    });
  }, [products, selectedCategory, searchQuery, showLowStockOnly]);

  const totalCartItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const totalCartAmountInCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showWarning(`Max stock reached (${product.stock_quantity} available)`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock_quantity) {
              showWarning(`Max stock reached (${item.product.stock_quantity} available)`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleConfirmSale = async (
    payments?: { method: string; amount: number }[],
    discountAmount: number = 0,
    discountReason?: string,
    notes?: string
  ): Promise<Sale | undefined> => {
    const saleItems = cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }));

    const sale = await api.createSale(saleItems, payments, discountAmount, discountReason, notes);
    setCart([]);
    setIsCartSheetOpen(false);
    await loadData();
    return sale;
  };

  const handleToggleFavorite = async (product: Product) => {
    const newFav = !product.is_favorite;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_favorite: newFav } : p))
    );
    await api.toggleFavoriteProduct(product.id, newFav);
  };

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock_quantity <= p.low_stock_threshold).length,
    [products]
  );

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (catalogRef.current && catalogRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0 && catalogRef.current && catalogRef.current.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.4, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= 60) {
      setIsPullRefreshing(true);
      await loadData();
      setIsPullRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 sm:gap-5 overflow-hidden relative">
      {/* Products Area (Left) — Filter fixed at top, Grid scrolls internally */}
      <div className="flex-1 flex flex-col space-y-3 sm:space-y-4 min-w-0 h-full overflow-hidden">
        {warningMessage && (
          <div className="bg-agora-brick-light border border-agora-brick-border text-agora-brick px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-agora-brick shrink-0" />
              <span>{warningMessage}</span>
            </div>
            <button
              onClick={() => setWarningMessage(null)}
              className="text-agora-brick hover:text-agora-ink font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Toolbar (Fixed Top) */}
        <div className="ledger-card p-3 sm:p-4 space-y-3 shadow-sm shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-agora-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
              <button
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  showLowStockOnly
                    ? 'bg-agora-gold-light border-agora-gold-border text-agora-gold'
                    : 'bg-agora-card border-agora-border text-agora-ink-muted hover:text-agora-ink'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-agora-gold" />
                <span>Low Stock ({lowStockCount})</span>
              </button>

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl bg-agora-card border border-agora-border text-agora-ink-muted hover:text-agora-ink transition-all"
                title="Refresh products"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pr-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-agora-terracotta text-agora-card shadow-sm'
                      : 'bg-agora-card border border-agora-border text-agora-ink-muted hover:text-agora-ink hover:bg-agora-bg'
                  }`}
                >
                  {cat === 'FAVORITES' ? '★ Favorites' : cat}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-agora-card to-transparent" />
          </div>
        </div>

        {/* Pull to refresh visual indicator */}
        {(pullDistance > 0 || isPullRefreshing) && (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-agora-terracotta py-1 shrink-0 animate-in fade-in duration-150">
            <RefreshCw
              className={`w-4 h-4 ${isPullRefreshing || pullDistance >= 60 ? 'animate-spin' : ''}`}
            />
            <span>
              {isPullRefreshing
                ? 'Refreshing catalog...'
                : pullDistance >= 60
                  ? 'Release to refresh'
                  : 'Pull down to refresh'}
            </span>
          </div>
        )}

        {/* Product Catalog Grid (Scrolls internally) */}
        <div
          ref={catalogRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto pr-1 min-h-0 pb-16 lg:pb-0"
        >
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 sm:h-36 bg-agora-card rounded-xl sm:rounded-2xl border border-agora-border"
                ></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="ledger-card p-8 sm:p-10 text-center text-agora-ink-muted space-y-3">
              <div className="w-12 h-12 rounded-full bg-agora-bg border border-agora-border flex items-center justify-center mx-auto text-agora-brass">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-agora-ink text-base sm:text-lg">
                No products found
              </h3>
              <p className="text-xs text-agora-ink-muted max-w-xs mx-auto">
                {products.length === 0
                  ? 'Your catalog is empty. Add products to start selling.'
                  : 'Try clearing your search query or choosing a different category.'}
              </p>
              {products.length === 0 && (
                <button
                  onClick={() => {
                    window.location.hash = 'inventory';
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-agora-terracotta text-agora-card text-xs font-serif font-bold rounded-xl shadow-md"
                >
                  <Plus className="w-4 h-4" /> Go to Products
                </button>
              )}
            </div>
          ) : (
            /* Tactile Product Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 pb-4">
              {filteredProducts.map((product) => {
                const cartItem = cart.find((i) => i.product.id === product.id);
                return (
                  <ProductTile
                    key={product.id}
                    product={product}
                    currencySymbol={settings.currency_symbol}
                    cartQuantity={cartItem?.quantity || 0}
                    onAddToCart={handleAddToCart}
                    onToggleFavorite={handleToggleFavorite}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Register Column (lg: 1024px and up) */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 shrink-0 h-full flex-col">
        <CartDrawer
          cart={cart}
          currencySymbol={settings.currency_symbol}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />
      </div>

      {/* Mobile/Tablet Floating Bottom Cart Bar (< lg) */}
      {cart.length > 0 && (
        <div
          onClick={() => setIsCartSheetOpen(true)}
          className="lg:hidden fixed bottom-14 left-3 right-3 z-30 bg-agora-terracotta text-agora-card rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all border border-agora-terracotta-hover animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="bg-agora-card/20 p-2 rounded-xl text-agora-card">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif font-bold text-sm leading-tight flex items-center gap-2">
                <span>
                  {totalCartItems} item{totalCartItems > 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span className="text-base">
                  {formatCurrency(totalCartAmountInCents, settings.currency_symbol)}
                </span>
              </div>
              <span className="text-[11px] opacity-90 block">Tap to view cart & checkout</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-agora-card/20 px-3 py-1.5 rounded-xl font-bold text-xs">
            <span>View</span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Mobile/Tablet Collapsible Cart Bottom Sheet Overlay (< lg) */}
      {isCartSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-agora-ink/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsCartSheetOpen(false)}
        >
          <div
            className="bg-agora-card border-t border-agora-border rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col w-full animate-in slide-in-from-bottom duration-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="pt-3 pb-1 flex flex-col items-center shrink-0 border-b border-agora-border/60">
              <div className="w-12 h-1.5 bg-agora-border rounded-full mb-2" />
              <div className="w-full px-4 flex items-center justify-between">
                <span className="text-xs font-bold text-agora-ink-muted uppercase tracking-wider">
                  Cart Register
                </span>
                <button
                  onClick={() => setIsCartSheetOpen(false)}
                  className="p-1 rounded-lg text-agora-ink-muted hover:text-agora-ink"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Drawer Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <CartDrawer
                cart={cart}
                currencySymbol={settings.currency_symbol}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onProceedToCheckout={() => {
                  setIsCartSheetOpen(false);
                  setIsCheckoutOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        cart={cart}
        currencySymbol={settings.currency_symbol}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmSale={handleConfirmSale}
      />
    </div>
  );
}
