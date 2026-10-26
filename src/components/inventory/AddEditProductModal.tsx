import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, UnitType, StoreSettings } from '@/types';
import { parseInputToCents, centsToDecimalString } from '@/utils/currency';
import { api } from '@/services/api';
import BottomSheet from '@/components/common/BottomSheet';
import { X, Package, AlertCircle, Star, Trash2 } from 'lucide-react';
import ProductAvatar from '@/components/common/ProductAvatar';

interface AddEditProductModalProps {
  isOpen: boolean;
  productToEdit?: Product | null;
  currencySymbol: string;
  onClose: () => void;
  onSave: (
    product: Partial<Product> & { name: string; price: number; stock_quantity: number }
  ) => Promise<void>;
  onDelete?: (productId: string, name: string) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Beverages',
  'Snacks',
  'Groceries',
  'Toiletries',
  'Pharmacy',
  'Stationery',
  'General',
];

const UNIT_TYPES: { id: UnitType; label: string }[] = [
  { id: 'piece', label: 'Pieces (pcs)' },
  { id: 'kg', label: 'Kilograms (kg)' },
  { id: 'g', label: 'Grams (g)' },
  { id: 'L', label: 'Liters (L)' },
  { id: 'ml', label: 'Milliliters (ml)' },
];

export default function AddEditProductModal({
  isOpen,
  productToEdit,
  currencySymbol,
  onClose,
  onSave,
  onDelete,
}: AddEditProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Beverages');
  const [priceInput, setPriceInput] = useState('');
  const [costPriceInput, setCostPriceInput] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [unitType, setUnitType] = useState<UnitType>('piece');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>({});
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      api
        .getSettings()
        .then(setSettings)
        .catch(() => {});

      if (productToEdit) {
        setName(productToEdit.name);
        setCategory(productToEdit.category);
        setPriceInput(centsToDecimalString(productToEdit.price));
        setCostPriceInput(
          productToEdit.cost_price ? centsToDecimalString(productToEdit.cost_price) : ''
        );
        setStockQuantity(productToEdit.stock_quantity);
        setLowStockThreshold(productToEdit.low_stock_threshold);
        setUnitType(productToEdit.unit_type || 'piece');
        setImageUrl(productToEdit.image_url || '');
        setIsFavorite(!!productToEdit.is_favorite);
        setAttributes(productToEdit.attributes || {});
      } else {
        setName('');
        setCategory('Beverages');
        setPriceInput('');
        setCostPriceInput('');
        setStockQuantity(10);
        setLowStockThreshold(5);
        setUnitType('piece');
        setImageUrl('');
        setIsFavorite(false);
        setAttributes({});
      }
      setIsSubmitting(false);
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleAttrChange = (key: string, value: string | number | boolean) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    const priceCents = parseInputToCents(priceInput);
    if (priceCents <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: productToEdit?.id,
        name: name.trim(),
        category,
        price: priceCents,
        cost_price: costPriceInput ? parseInputToCents(costPriceInput) : undefined,
        stock_quantity: stockQuantity,
        low_stock_threshold: lowStockThreshold,
        unit_type: unitType,
        attributes,
        image_url: imageUrl.trim(),
        is_favorite: isFavorite,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError('Failed to save product: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessType = settings?.business_type || 'GENERAL_RETAIL';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-agora-ink-muted shrink-0" />
          <span className="font-serif font-bold text-agora-ink text-lg">
            {productToEdit ? 'Edit Product' : 'Add Product'}
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Avatar Preview */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-agora-ink">Product Name</label>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                isFavorite
                  ? 'bg-agora-brass/15 border-agora-brass text-agora-brass'
                  : 'bg-agora-bg border-agora-border text-agora-ink-muted hover:text-agora-brass'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${isFavorite ? 'fill-agora-brass text-agora-brass' : ''}`}
              />
              <span>{isFavorite ? 'Pinned to Favorites' : 'Pin to Favorites'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <ProductAvatar name={name || 'P'} imageUrl={imageUrl} size="md" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol 500mg or Coca Cola"
              className="flex-1 bg-agora-bg border border-agora-border rounded-xl px-3 py-2 text-sm text-agora-ink font-semibold focus:outline-none focus:border-agora-terracotta"
            />
          </div>
        </div>

        {/* Category & Unit Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-ink">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-agora-bg border border-agora-border rounded-xl px-3 py-2 text-xs text-agora-ink font-semibold focus:outline-none focus:border-agora-terracotta"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-ink">Unit of Sale</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as UnitType)}
              className="w-full bg-agora-bg border border-agora-border rounded-xl px-3 py-2 text-xs text-agora-ink font-semibold focus:outline-none focus:border-agora-terracotta"
            >
              {UNIT_TYPES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-ink">
              Selling Price ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="1.50"
              className="w-full bg-agora-bg border border-agora-border rounded-xl px-3 py-2 text-sm text-agora-ink font-serif font-bold focus:outline-none focus:border-agora-terracotta"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-ink-muted">
              Cost Price ({currencySymbol}){' '}
              <span className="text-[10px] text-agora-ink-muted/70">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={costPriceInput}
              onChange={(e) => setCostPriceInput(e.target.value)}
              placeholder="0.90"
              className="w-full bg-agora-bg border border-agora-border rounded-xl px-3 py-2 text-sm text-agora-ink focus:outline-none focus:border-agora-terracotta"
            />
          </div>
        </div>

        {/* Inventory Controls */}
        <div className="grid grid-cols-2 gap-3 bg-agora-bg/60 p-4 rounded-2xl border border-agora-border">
          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-ink">Current Stock ({unitType})</label>
            <input
              type="number"
              min="0"
              step={unitType === 'piece' ? '1' : '0.01'}
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseFloat(e.target.value) || 0)}
              className="w-full bg-agora-card border border-agora-border rounded-xl px-3 py-2 text-sm text-agora-ink font-serif font-bold focus:outline-none focus:border-agora-terracotta"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-agora-gold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-agora-gold" /> Alert Level
            </label>
            <input
              type="number"
              min="1"
              required
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 1)}
              className="w-full bg-agora-card border border-agora-gold-border rounded-xl px-3 py-2 text-sm text-agora-gold font-serif font-bold focus:outline-none focus:border-agora-gold"
            />
          </div>
        </div>

        {/* Business Vertical Specific Dynamic Attributes */}
        <div className="bg-agora-bg/40 p-4 rounded-2xl border border-agora-border space-y-3">
          <span className="text-xs font-bold text-agora-brass uppercase tracking-wider block">
            Vertical Attributes ({businessType.replace('_', ' ')})
          </span>

          {/* Pharmacy Specific Fields */}
          {businessType === 'PHARMACY' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-agora-ink">Expiry Date</label>
                  <input
                    type="date"
                    value={String(attributes.expiry_date || '')}
                    onChange={(e) => handleAttrChange('expiry_date', e.target.value)}
                    className="w-full bg-agora-card border border-agora-border rounded-xl px-2.5 py-1.5 text-xs text-agora-ink"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-agora-ink">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BCH-901"
                    value={String(attributes.batch_no || '')}
                    onChange={(e) => handleAttrChange('batch_no', e.target.value)}
                    className="w-full bg-agora-card border border-agora-border rounded-xl px-2.5 py-1.5 text-xs text-agora-ink"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-agora-ink font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={!!attributes.prescription_required}
                  onChange={(e) => handleAttrChange('prescription_required', e.target.checked)}
                  className="rounded bg-agora-card border-agora-border text-agora-terracotta focus:ring-agora-terracotta"
                />
                <span>Requires Prescription (Rx)</span>
              </label>
            </div>
          )}

          {/* Restaurant Specific Fields */}
          {businessType === 'RESTAURANT' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-agora-ink">Prep Time (mins)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={String(attributes.prep_time_mins || '')}
                  onChange={(e) =>
                    handleAttrChange('prep_time_mins', parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-agora-card border border-agora-border rounded-xl px-2.5 py-1.5 text-xs text-agora-ink"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-agora-ink">Allergens</label>
                <input
                  type="text"
                  placeholder="e.g. Nuts, Dairy"
                  value={String(attributes.allergens || '')}
                  onChange={(e) => handleAttrChange('allergens', e.target.value)}
                  className="w-full bg-agora-card border border-agora-border rounded-xl px-2.5 py-1.5 text-xs text-agora-ink"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-agora-brick/10 border border-agora-brick/30 rounded-xl text-agora-brick text-xs font-medium">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-agora-border">
          {productToEdit && onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(productToEdit.id, productToEdit.name);
              }}
              className="p-3 bg-agora-brick/10 hover:bg-agora-brick/20 text-agora-brick font-bold rounded-xl text-sm border border-agora-brick/30 transition-all shrink-0"
              title="Delete product"
            >
              <Trash2 className="w-4 h-4 text-agora-brick" />
            </button>
          )}
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
            {isSubmitting ? 'Saving...' : productToEdit ? 'Save Changes' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
