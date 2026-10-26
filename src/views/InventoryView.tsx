'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, StoreSettings, Sale } from '@/types';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
import AddEditProductModal from '@/components/inventory/AddEditProductModal';
import RestockModal from '@/components/inventory/RestockModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import ListRow, { SwipeAction } from '@/components/common/ListRow';
import FilterSheet from '@/components/common/FilterSheet';
import ListSkeleton from '@/components/common/ListSkeleton';
import ProductAvatar from '@/components/common/ProductAvatar';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  PlusCircle,
  Edit3,
  Trash2,
  TrendingUp,
  Layers,
  ShieldAlert,
  Calendar,
  Star,
} from 'lucide-react';

export default function InventoryView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Agora Kiosk',
    currency_symbol: '$',
    currency_code: 'USD',
    low_stock_alerts_enabled: true,
    business_type: 'GENERAL_RETAIL',
    expiry_alert_days: 30,
    custom_attributes: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [filterExpiringOnly, setFilterExpiringOnly] = useState(false);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [productToRestock, setProductToRestock] = useState<Product | null>(null);

  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, stgs, salesData] = await Promise.all([
        api.getProducts(),
        api.getSettings(),
        api.getSales(),
      ]);
      setProducts(prods);
      setSettings(stgs);
      setSales(salesData);
    } catch (err: unknown) {
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (window.location.hash.includes('filter=low_stock')) {
      setFilterLowStockOnly(true);
    }
  }, []);

  const handleToggleFavorite = async (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFav = !p.is_favorite;
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, is_favorite: newFav } : item))
    );
    await api.toggleFavoriteProduct(p.id, newFav);
  };

  const restockSuggestions = useMemo(() => {
    return api.getSmartRestockSuggestions(products, sales);
  }, [products, sales]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', 'FAVORITES', ...Array.from(set)];
  }, [products]);

  const now = Date.now();
  const expiryCutoff = now + (settings.expiry_alert_days || 30) * 86400000;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'ALL'
          ? true
          : selectedCategory === 'FAVORITES'
            ? p.is_favorite === true
            : p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.attributes?.batch_no
          ? String(p.attributes.batch_no).toLowerCase().includes(searchQuery.toLowerCase())
          : false);

      const matchesLowStock = !filterLowStockOnly || p.stock_quantity <= p.low_stock_threshold;

      let matchesExpiring = true;
      if (filterExpiringOnly) {
        if (!p.attributes?.expiry_date) matchesExpiring = false;
        else {
          const exp = new Date(p.attributes.expiry_date as string).getTime();
          matchesExpiring = !isNaN(exp) && exp <= expiryCutoff;
        }
      }

      return matchesCat && matchesSearch && matchesLowStock && matchesExpiring;
    });
  }, [
    products,
    selectedCategory,
    searchQuery,
    filterLowStockOnly,
    filterExpiringOnly,
    expiryCutoff,
  ]);

  // Group products by Category with sticky headers
  const groupedProducts = useMemo(() => {
    const groups: { category: string; items: Product[] }[] = [];
    const map = new Map<string, Product[]>();

    filteredProducts.forEach((p) => {
      const cat = p.category || 'General';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(p);
    });

    map.forEach((items, category) => {
      groups.push({ category, items });
    });

    return groups;
  }, [filteredProducts]);

  // Inventory KPI calculations
  const totalValuationCents = useMemo(() => {
    return products.reduce((sum, p) => sum + p.price * p.stock_quantity, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)
      .length;
  }, [products]);

  const expiringCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.attributes?.expiry_date) return false;
      const exp = new Date(p.attributes.expiry_date as string).getTime();
      return !isNaN(exp) && exp <= expiryCutoff;
    }).length;
  }, [products, expiryCutoff]);

  const activeFilterCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (filterLowStockOnly ? 1 : 0) +
    (filterExpiringOnly ? 1 : 0);

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setProductToEdit(p);
    setIsAddEditOpen(true);
  };

  const handleOpenRestock = (p: Product) => {
    setProductToRestock(p);
    setIsRestockOpen(true);
  };

  const handleSaveProduct = async (
    productData: Partial<Product> & { name: string; price: number; stock_quantity: number }
  ) => {
    await api.saveProduct(productData);
    await loadData();
  };

  const handleRestockProduct = async (productId: string, addQty: number, note?: string) => {
    await api.restockProduct(productId, addQty, note);
    await loadData();
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteProduct(productToDelete.id);
      setProductToDelete(null);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to delete product:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-agora-ink pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-agora-ink tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 sm:w-7 sm:h-7 text-agora-ink-muted" />
            Products
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-agora-terracotta hover:bg-agora-terracotta-hover text-agora-card font-serif font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="ledger-card p-3 sm:p-4">
          <div className="flex items-center justify-between text-agora-ink-muted text-xs font-bold">
            <span>Total Products</span>
            <Layers className="w-4 h-4 text-agora-ink-muted" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-black text-agora-ink mt-1.5">
            {products.length}
          </div>
          <span className="text-[10px] text-agora-ink-muted font-medium">Active catalog items</span>
        </div>

        <div className="ledger-card p-3 sm:p-4 border-agora-gold/40 bg-agora-gold-light/40">
          <div className="flex items-center justify-between text-agora-gold text-xs font-bold">
            <span>Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-agora-gold" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-black text-agora-gold mt-1.5">
            {lowStockCount}
          </div>
          <span className="text-[10px] text-agora-gold font-semibold">Needs restock</span>
        </div>

        <div className="ledger-card p-3 sm:p-4 border-agora-brick-border bg-agora-brick-light/30">
          <div className="flex items-center justify-between text-agora-brick text-xs font-bold">
            <span>Expiring Soon</span>
            <ShieldAlert className="w-4 h-4 text-agora-brick" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-black text-agora-brick mt-1.5">
            {expiringCount}
          </div>
          <span className="text-[10px] text-agora-brick font-semibold">
            In {settings.expiry_alert_days || 30} days
          </span>
        </div>

        <div className="ledger-card p-3 sm:p-4">
          <div className="flex items-center justify-between text-agora-ink-muted text-xs font-bold">
            <span>Stock Value</span>
            <TrendingUp className="w-4 h-4 text-agora-sage" />
          </div>
          <div className="text-lg sm:text-xl font-serif font-black text-agora-sage mt-1.5 truncate">
            {formatCurrency(totalValuationCents, settings.currency_symbol)}
          </div>
          <span className="text-[10px] text-agora-ink-muted font-medium">Retail total</span>
        </div>
      </div>

      {/* Toolbar: Search + FilterSheet */}
      <div className="ledger-card p-3 sm:p-4 shadow-sm flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-agora-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, category, batch..."
            className="w-full bg-agora-bg border border-agora-border rounded-xl py-2 pl-9 pr-4 text-xs text-agora-ink placeholder:text-agora-ink-muted/80 focus:outline-none focus:border-agora-terracotta"
          />
        </div>

        <FilterSheet
          activeCount={activeFilterCount}
          title="Filter Product Catalog"
          onReset={() => {
            setSelectedCategory('ALL');
            setFilterLowStockOnly(false);
            setFilterExpiringOnly(false);
          }}
        >
          {/* Categories Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left truncate ${
                    selectedCategory === cat
                      ? 'bg-agora-terracotta/15 border-agora-terracotta text-agora-terracotta shadow-sm'
                      : 'bg-agora-bg border-agora-border text-agora-ink-muted hover:text-agora-ink'
                  }`}
                >
                  {cat === 'FAVORITES' ? '★ Favorites' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-2 pt-2 border-t border-agora-border">
            <label className="text-xs font-bold uppercase tracking-wider text-agora-ink-muted">
              Stock Alerts
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setFilterLowStockOnly(!filterLowStockOnly);
                  if (!filterLowStockOnly) setFilterExpiringOnly(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                  filterLowStockOnly
                    ? 'bg-agora-gold-light border-agora-gold-border text-agora-gold'
                    : 'bg-agora-bg border-agora-border text-agora-ink-muted hover:text-agora-ink'
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-agora-gold" />
                  Show Low Stock Items Only
                </span>
                <span>({lowStockCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterExpiringOnly(!filterExpiringOnly);
                  if (!filterExpiringOnly) setFilterLowStockOnly(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                  filterExpiringOnly
                    ? 'bg-agora-brick-light border-agora-brick-border text-agora-brick'
                    : 'bg-agora-bg border-agora-border text-agora-ink-muted hover:text-agora-ink'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-agora-brick" />
                  Show Expiring Items Only
                </span>
                <span>({expiringCount})</span>
              </button>
            </div>
          </div>
        </FilterSheet>
      </div>

      {/* Wallet-App Category Grouped List Row View */}
      <div className="space-y-4">
        {isLoading ? (
          <ListSkeleton count={6} />
        ) : filteredProducts.length === 0 ? (
          <div className="ledger-card p-8 text-center text-xs text-agora-ink-muted">
            No products found matching filters.
          </div>
        ) : (
          groupedProducts.map((group) => (
            <div key={group.category} className="space-y-1.5">
              {/* Sticky Category Group Header */}
              <div className="sticky top-[56px] sm:top-[65px] z-10 bg-agora-bg/95 backdrop-blur-sm py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-agora-brass border-b border-agora-border/60 flex items-center justify-between">
                <span>{group.category}</span>
                <span className="text-[10px] text-agora-ink-muted">
                  ({group.items.length} items)
                </span>
              </div>

              {/* Product Rows */}
              {group.items.map((p) => {
                const isOut = p.stock_quantity <= 0;
                const isLow = !isOut && p.stock_quantity <= p.low_stock_threshold;
                const expDate = p.attributes?.expiry_date
                  ? new Date(p.attributes.expiry_date as string)
                  : null;
                const isExpiring = expDate ? expDate.getTime() <= expiryCutoff : false;
                const suggestedQty = restockSuggestions[p.id];

                const swipeActions: SwipeAction[] = [
                  {
                    id: 'restock',
                    label: 'Restock',
                    icon: PlusCircle,
                    bgColorClass: 'bg-agora-terracotta text-agora-card',
                    onClick: () => handleOpenRestock(p),
                  },
                  {
                    id: 'edit',
                    label: 'Edit',
                    icon: Edit3,
                    bgColorClass: 'bg-agora-brass text-agora-card',
                    onClick: () => handleOpenEdit(p),
                  },
                  {
                    id: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    bgColorClass: 'bg-agora-brick text-agora-card',
                    onClick: () => setProductToDelete({ id: p.id, name: p.name }),
                  },
                ];

                return (
                  <ListRow
                    key={p.id}
                    onClick={() => handleOpenEdit(p)}
                    swipeActions={swipeActions}
                    icon={<ProductAvatar name={p.name} imageUrl={p.image_url} size="md" />}
                    title={
                      <div className="flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(p, e)}
                          title={p.is_favorite ? 'Unpin favorite' : 'Pin to favorites'}
                          className="p-0.5 rounded text-agora-brass hover:bg-agora-bg transition-colors"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              p.is_favorite
                                ? 'fill-agora-brass text-agora-brass'
                                : 'text-agora-ink-muted/50 hover:text-agora-brass'
                            }`}
                          />
                        </button>
                      </div>
                    }
                    subtitle={
                      <div className="flex items-center gap-2 text-[11px]">
                        <span>
                          Cost:{' '}
                          {p.cost_price
                            ? formatCurrency(p.cost_price, settings.currency_symbol)
                            : '-'}
                        </span>
                        {p.unit_type && <span>• {p.unit_type}</span>}
                        {p.attributes?.batch_no && (
                          <span>• Batch {String(p.attributes.batch_no)}</span>
                        )}
                      </div>
                    }
                    value={formatCurrency(p.price, settings.currency_symbol)}
                    badge={
                      <div className="flex flex-col items-end space-y-0.5">
                        {isExpiring ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-agora-brick-light border border-agora-brick-border text-agora-brick inline-flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Expiring
                          </span>
                        ) : isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-agora-brick-light border border-agora-brick-border text-agora-brick">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-agora-gold-light text-agora-gold border border-agora-gold-border">
                            Low ({p.stock_quantity})
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-agora-ink">
                            Stock:{' '}
                            <strong className="font-serif font-bold text-agora-ink">
                              {p.stock_quantity}
                            </strong>
                          </span>
                        )}

                        {(isLow || isOut) && suggestedQty && (
                          <span className="text-[9px] font-bold text-agora-gold">
                            Reorder: +{suggestedQty}
                          </span>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      <AddEditProductModal
        isOpen={isAddEditOpen}
        productToEdit={productToEdit}
        currencySymbol={settings.currency_symbol}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveProduct}
        onDelete={(id, name) => setProductToDelete({ id, name })}
      />

      <RestockModal
        isOpen={isRestockOpen}
        product={productToRestock}
        suggestedQuantity={productToRestock ? restockSuggestions[productToRestock.id] : undefined}
        onClose={() => setIsRestockOpen(false)}
        onRestock={handleRestockProduct}
      />

      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDeleteProduct}
        title="Remove Product"
        message={`Are you sure you want to remove "${productToDelete?.name}" from your catalog?`}
        confirmText="Delete Product"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
}
