import { Product, StockMovement } from '@/types';
import { INITIAL_SAMPLE_PRODUCTS } from '@/lib/seed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PRODUCTS_KEY, MOVEMENTS_KEY, getLocal, setLocal, getActiveStoreId } from './common';

export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (!storeId) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
    return (data || []) as Product[];
  }

  return getLocal<Product[]>(PRODUCTS_KEY, []);
}

export async function saveProduct(
  productData: Partial<Product> & { name: string; price: number; stock_quantity: number }
): Promise<Product> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const now = new Date().toISOString();
      let savedProd: Product;

      if (productData.id) {
        // Fetch existing product for stock diff calculation
        const { data: oldProd } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productData.id)
          .single();

        const diff = oldProd ? productData.stock_quantity - oldProd.stock_quantity : 0;

        const { data, error } = await supabase
          .from('products')
          .update({
            name: productData.name.trim(),
            category: productData.category || 'General',
            price: productData.price,
            cost_price: productData.cost_price,
            stock_quantity: productData.stock_quantity,
            low_stock_threshold: productData.low_stock_threshold ?? 5,
            unit_type: productData.unit_type || 'piece',
            attributes: productData.attributes || {},
            image_url: productData.image_url || '',
            is_favorite: productData.is_favorite ?? false,
            updated_at: now,
          })
          .eq('id', productData.id)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        savedProd = data as Product;

        if (diff !== 0) {
          await supabase.from('stock_movements').insert({
            store_id: storeId,
            product_id: savedProd.id,
            product_name: savedProd.name,
            change_amount: diff,
            quantity_after: savedProd.stock_quantity,
            reason: 'MANUAL_ADJUSTMENT',
            note: 'Product stock updated in catalog',
            timestamp: now,
          });
        }
      } else {
        // Insert new product
        const { data, error } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: productData.name.trim(),
            category: productData.category || 'General',
            price: productData.price,
            cost_price: productData.cost_price,
            stock_quantity: productData.stock_quantity,
            low_stock_threshold: productData.low_stock_threshold ?? 5,
            unit_type: productData.unit_type || 'piece',
            attributes: productData.attributes || {},
            image_url: productData.image_url || '',
            is_favorite: productData.is_favorite ?? false,
          })
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        savedProd = data as Product;

        await supabase.from('stock_movements').insert({
          store_id: storeId,
          product_id: savedProd.id,
          product_name: savedProd.name,
          change_amount: savedProd.stock_quantity,
          quantity_after: savedProd.stock_quantity,
          reason: 'RESTOCK',
          note: 'Initial catalog item creation',
          timestamp: now,
        });
      }

      return savedProd;
    }
  }

  // Local Storage Fallback
  const products = getLocal<Product[]>(PRODUCTS_KEY, []);
  const movements = getLocal<StockMovement[]>(MOVEMENTS_KEY, []);
  const now = new Date().toISOString();

  if (productData.id) {
    const idx = products.findIndex((p) => p.id === productData.id);
    if (idx !== -1) {
      const old = products[idx];
      const diff = productData.stock_quantity - old.stock_quantity;
      const updated: Product = { ...old, ...productData, updated_at: now };
      products[idx] = updated;

      if (diff !== 0) {
        movements.unshift({
          id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product_id: updated.id,
          product_name: updated.name,
          change_amount: diff,
          quantity_after: updated.stock_quantity,
          reason: 'MANUAL_ADJUSTMENT',
          note: 'Product stock updated in catalog',
          timestamp: now,
        });
      }

      setLocal(PRODUCTS_KEY, products);
      setLocal(MOVEMENTS_KEY, movements);
      return updated;
    }
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: productData.name,
    category: productData.category || 'General',
    price: productData.price,
    cost_price: productData.cost_price,
    stock_quantity: productData.stock_quantity,
    low_stock_threshold: productData.low_stock_threshold ?? 5,
    unit_type: productData.unit_type || 'piece',
    attributes: productData.attributes || {},
    image_url: productData.image_url || '',
    created_at: now,
    updated_at: now,
  };

  products.unshift(newProduct);
  movements.unshift({
    id: `sm-${Date.now()}`,
    product_id: newProduct.id,
    product_name: newProduct.name,
    change_amount: newProduct.stock_quantity,
    quantity_after: newProduct.stock_quantity,
    reason: 'RESTOCK',
    note: 'Initial catalog item creation',
    timestamp: now,
  });

  setLocal(PRODUCTS_KEY, products);
  setLocal(MOVEMENTS_KEY, movements);
  return newProduct;
}

export async function toggleFavoriteProduct(
  id: string,
  isFavorite: boolean
): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { data, error } = await supabase
        .from('products')
        .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('store_id', storeId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update favorite status: ${error.message}`);
      }
      return data as Product;
    }
  }

  const products = getLocal<Product[]>(PRODUCTS_KEY, []);
  const idx = products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    products[idx] = {
      ...products[idx],
      is_favorite: isFavorite,
      updated_at: new Date().toISOString(),
    };
    setLocal(PRODUCTS_KEY, products);
    return products[idx];
  }
  return null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId);
      if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
      }
      return true;
    }
  }

  const products = getLocal<Product[]>(PRODUCTS_KEY, []);
  const filtered = products.filter((p) => p.id !== id);
  setLocal(PRODUCTS_KEY, filtered);
  return true;
}

export async function restockProduct(
  id: string,
  addQuantity: number,
  note?: string
): Promise<Product> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const { data: prod, error: getErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (getErr || !prod) throw new Error('Product not found');

      const newStock = Number(prod.stock_quantity) + addQuantity;
      const now = new Date().toISOString();

      const { data: updatedProd, error: updateErr } = await supabase
        .from('products')
        .update({ stock_quantity: newStock, updated_at: now })
        .eq('id', id)
        .select('*')
        .single();

      if (updateErr) throw new Error(updateErr.message);

      await supabase.from('stock_movements').insert({
        store_id: storeId,
        product_id: id,
        product_name: prod.name,
        change_amount: addQuantity,
        quantity_after: newStock,
        reason: 'RESTOCK',
        note: note || `Restocked +${addQuantity} units`,
        timestamp: now,
      });

      return updatedProd as Product;
    }
  }

  const products = getLocal<Product[]>(PRODUCTS_KEY, []);
  const movements = getLocal<StockMovement[]>(MOVEMENTS_KEY, []);
  const product = products.find((p) => p.id === id);

  if (!product) throw new Error('Product not found');

  const now = new Date().toISOString();
  product.stock_quantity += addQuantity;
  product.updated_at = now;

  movements.unshift({
    id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    product_id: product.id,
    product_name: product.name,
    change_amount: addQuantity,
    quantity_after: product.stock_quantity,
    reason: 'RESTOCK',
    note: note || `Restocked +${addQuantity} units`,
    timestamp: now,
  });

  setLocal(PRODUCTS_KEY, products);
  setLocal(MOVEMENTS_KEY, movements);
  return product;
}

export async function seedDemo(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const storeId = await getActiveStoreId();
    if (storeId) {
      const now = new Date().toISOString();
      const demoProductsToInsert = INITIAL_SAMPLE_PRODUCTS.map((p) => ({
        store_id: storeId,
        name: p.name,
        category: p.category,
        price: p.price,
        cost_price: p.cost_price,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        unit_type: p.unit_type || 'piece',
        attributes: p.attributes || {},
        image_url: p.image_url || '',
      }));

      const { data: insertedProds, error } = await supabase
        .from('products')
        .insert(demoProductsToInsert)
        .select('*');

      if (error) throw new Error(error.message);

      const movementsToInsert = (insertedProds || []).map((p) => ({
        store_id: storeId,
        product_id: p.id,
        product_name: p.name,
        change_amount: p.stock_quantity,
        quantity_after: p.stock_quantity,
        reason: 'RESTOCK' as const,
        note: 'Demo Kiosk catalog seed',
        timestamp: now,
      }));

      await supabase.from('stock_movements').insert(movementsToInsert);
      return insertedProds as Product[];
    }
  }

  const defaultProducts: Product[] = INITIAL_SAMPLE_PRODUCTS.map((p, idx) => ({
    ...p,
    id: `prod-seed-${idx + 1}-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const initialMovements: StockMovement[] = defaultProducts.map((p) => ({
    id: `sm-seed-${p.id}`,
    product_id: p.id,
    product_name: p.name,
    change_amount: p.stock_quantity,
    quantity_after: p.stock_quantity,
    reason: 'RESTOCK' as const,
    note: 'Demo Kiosk catalog seed',
    timestamp: p.created_at || new Date().toISOString(),
  }));

  setLocal(PRODUCTS_KEY, defaultProducts);
  setLocal(MOVEMENTS_KEY, initialMovements);
  return defaultProducts;
}
