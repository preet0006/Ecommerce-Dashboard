/* ============================================================
   GREEN FIBRE PRODUCT & SKU CATALOG HELPER
   – Single source of truth for products & SKUs across dashboard
   – Syncs with backend API & persists to localStorage
   ============================================================ */

export const INITIAL_CATALOG = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', category: 'Casserole', defaultRate: 495, moq: 500 },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', category: 'Bowl', defaultRate: 380, moq: 300 },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', category: 'Pet Accessories', defaultRate: 118, moq: 1000 },
  { sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', category: 'Casserole', defaultRate: 1085, moq: 200 },
  { sku: 'GF-STG-009', name: 'Storage Container Set (4pc)', category: 'Storage', defaultRate: 450, moq: 400 },
  { sku: 'GF-PET-006', name: 'Pet Feeder Large', category: 'Pet Accessories', defaultRate: 290, moq: 500 },
];

const STORAGE_KEY = 'greenfibre_products_catalog';

/**
 * Fetch products from backend API and update localStorage cache
 */
export async function fetchAndSyncProductsCatalog() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(p => ({
          sku: p.sku || p.id,
          name: p.name,
          category: p.category || 'General',
          defaultRate: Number(p.sellingPrice || p.mrp || 0),
          moq: Number(p.stock || 100),
          addedAt: p.createdAt || new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
        return formatted;
      }
    }
  } catch (err) {
    console.warn('Could not sync products catalog from backend:', err);
  }
  return getProductsCatalog();
}

/**
 * Get all available products from catalog (combining initial products with any custom created ones)
 */
export function getProductsCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...INITIAL_CATALOG];
    const custom = JSON.parse(raw);
    if (!Array.isArray(custom)) return [...INITIAL_CATALOG];

    // Merge custom with initial, avoiding duplicate SKUs
    const map = new Map();
    INITIAL_CATALOG.forEach((item) => map.set(item.sku.trim().toUpperCase(), item));
    custom.forEach((item) => {
      if (item && (item.sku || item.id)) {
        const key = (item.sku || item.id).trim().toUpperCase();
        map.set(key, { ...map.get(key), ...item, sku: key });
      }
    });
    return Array.from(map.values());
  } catch (err) {
    console.warn('Failed to load products catalog from localStorage:', err);
    return [...INITIAL_CATALOG];
  }
}

/**
 * Add or update a product in the catalog and save to localStorage
 */
export function addProductToCatalog(product) {
  if (!product || (!product.sku && !product.name && !product.id)) return null;
  let normalizedSku = (product.sku || product.id)?.trim().toUpperCase();
  const normalizedName = product.name?.trim() || normalizedSku || 'General Item';
  if (!normalizedSku) {
    const clean = normalizedName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    normalizedSku = `GF-${clean || 'ITEM'}-${rand}`;
  }
  const normalizedProduct = {
    sku: normalizedSku,
    name: normalizedName,
    category: product.category?.trim() || 'General',
    defaultRate: Number(product.defaultRate || product.rate || product.sellingPrice) || 0,
    moq: Number(product.moq || product.stock) || 100,
    addedAt: new Date().toISOString(),
  };

  try {
    const catalog = getProductsCatalog();
    const existingIndex = catalog.findIndex((p) => p.sku.toUpperCase() === normalizedSku);
    if (existingIndex >= 0) {
      catalog[existingIndex] = { ...catalog[existingIndex], ...normalizedProduct };
    } else {
      catalog.unshift(normalizedProduct);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    return normalizedProduct;
  } catch (err) {
    console.warn('Failed to save product to localStorage:', err);
    return normalizedProduct;
  }
}

/**
 * Find a product by SKU code
 */
export function findProductBySku(sku) {
  if (!sku) return null;
  const catalog = getProductsCatalog();
  return catalog.find((p) => p.sku.toUpperCase() === sku.trim().toUpperCase()) || null;
}

