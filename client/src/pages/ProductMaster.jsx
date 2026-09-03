import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

// Sub-components
import ProductList from '../components/productmaster/ProductList';
import CostBreakdown from '../components/productmaster/CostBreakdown';
import BulkImport from '../components/productmaster/BulkImport';
import ProductForm from '../components/productmaster/ProductForm';
import Modal from '../components/productmaster/Modal';

// API & Shared helpers
import { getProducts, createProduct, updateProduct, deleteProduct, bulkImportProducts } from '../lib/api';
import { addProductToCatalog } from '../lib/productsCatalog';
import {
  INITIAL_PRODUCTS,
  PRODUCT_MASTER_TABS,
  downloadProductsCSV,
} from '../components/productmaster/utils';

export default function ProductMaster() {
  // Persisted state: restore from localStorage on mount
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem('pm_activeTab') || 'list'; } catch { return 'list'; }
  });

  const [selectedProduct, setSelectedProduct] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_selectedProductId');
      return saved ? (INITIAL_PRODUCTS.find(p => p.id === saved) || null) : null;
    } catch { return null; }
  });

  // Load initial cached state from localStorage if available, else INITIAL_PRODUCTS
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initialMap = new Map(INITIAL_PRODUCTS.map(p => [p.id, p]));
          return parsed.map(p => {
            const base = initialMap.get(p.id || p.sku);
            if (base && (Number(p.sellingPrice || 0) === 0 || Number(p.landedCost || 0) === 0 || !p.category || p.category.toLowerCase().startsWith('uncategori'))) {
              return {
                ...base,
                ...p,
                category: (p.category && !p.category.toLowerCase().startsWith('uncategori')) ? p.category : base.category,
                mrp: Number(p.mrp || 0) > 0 ? Number(p.mrp) : base.mrp,
                sellingPrice: Number(p.sellingPrice || 0) > 0 ? Number(p.sellingPrice) : base.sellingPrice,
                landedCost: Number(p.landedCost || 0) > 0 ? Number(p.landedCost) : base.landedCost,
                stock: Number(p.stock || 0) > 0 ? Number(p.stock) : base.stock,
                contributionPct: base.contributionPct,
              };
            }
            return p;
          });
        }
      }
      return INITIAL_PRODUCTS;
    } catch (err) {
      return INITIAL_PRODUCTS;
    }
  });

  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  // Fetch products from backend API on mount
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      console.warn('[ProductMaster] Failed to load products from API, using fallback:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem('pm_activeTab', activeTab); } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (selectedProduct) localStorage.setItem('pm_selectedProductId', selectedProduct.id || selectedProduct.sku);
      else localStorage.removeItem('pm_selectedProductId');
    } catch {}
  }, [selectedProduct]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  const openAddModal  = useCallback(() => { setModalProduct(null); setModalOpen(true); }, []);
  const openEditModal = useCallback((p) => { setModalProduct(p);   setModalOpen(true); }, []);
  const closeModal    = useCallback(() => { setModalOpen(false); },                     []);

  // Pencil icon → open edit modal
  const goEdit = (product) => openEditModal(product);

  // Delete product action (API call + State update)
  const handleDelete = useCallback(async (productId) => {
    const target = products.find(p => p.id === productId || p.sku === productId);
    const label = target ? `"${target.name}" (${target.id || target.sku})` : 'this product';
    if (!window.confirm(`Are you sure you want to delete ${label}?`)) return;

    try {
      const skuCode = target?.sku || target?.id || productId;
      await deleteProduct(skuCode);
      setProducts(prev => prev.filter(p => p.id !== productId && p.sku !== productId));
      setSelectedProduct(prev => (prev?.id === productId || prev?.sku === productId ? null : prev));
    } catch (err) {
      console.error('Failed to delete product on server:', err.message);
      // Local fallback delete
      setProducts(prev => prev.filter(p => p.id !== productId && p.sku !== productId));
      setSelectedProduct(prev => (prev?.id === productId || prev?.sku === productId ? null : prev));
    }
  }, [products, deleteProduct]);

  // Row click → go to Cost Breakdown for that product
  const goViewCost = useCallback((product) => {
    setSelectedProduct(product);
    setActiveTab('cost');
  }, []);

  const handleSave = async (form, mode) => {
    const sp = Number(form.sellingPrice) || 0;
    const lc = Number(form.landedCost) || 0;
    const autoContribution = sp > 0 ? ((sp - lc) / sp) * 100 : 0;
    const skuCode = form.id?.trim().toUpperCase();

    const payload = {
      sku: skuCode,
      id: skuCode,
      name: form.name,
      category: form.category,
      mrp: Number(form.mrp) || 0,
      sellingPrice: sp,
      landedCost: lc,
      contributionPct: autoContribution,
      stock: Number(form.stock) || 0,
      physical: Number(form.stock) || 0,
      gst: Number(form.gst) || 0,
      weight: Number(form.weight) || 0,
      dimensions: form.dimensions || '',
    };

    if (mode === 'add') {
      try {
        const created = await createProduct(payload);
        setProducts(prev => [created, ...prev.filter(p => p.id !== created.id && p.sku !== created.sku)]);
        addProductToCatalog(created);
      } catch (err) {
        console.error('Failed to create product on server:', err.message);
        // Local fallback insert
        setProducts(prev => [payload, ...prev]);
        addProductToCatalog(payload);
      }
    } else {
      try {
        const updated = await updateProduct(skuCode, payload);
        setProducts(prev => prev.map(p => (p.id === skuCode || p.sku === skuCode ? updated : p)));
        addProductToCatalog(updated);
      } catch (err) {
        console.error('Failed to update product on server:', err.message);
        // Local fallback update
        setProducts(prev => prev.map(p => (p.id === skuCode || p.sku === skuCode ? { ...p, ...payload } : p)));
        addProductToCatalog(payload);
      }
    }
    closeModal();
  };

  const handleBulkImport = async (rows) => {
    try {
      const res = await bulkImportProducts(rows);
      if (res?.products && Array.isArray(res.products)) {
        setProducts(res.products);
        res.products.forEach(p => addProductToCatalog(p));
      } else {
        await loadProducts();
      }
    } catch (err) {
      console.error('Failed to bulk import products to server:', err.message);
      // Fallback local update
      setProducts(prev => {
        const existingMap = new Map(prev.map(p => [p.id, p]));
        rows.forEach(csvRow => {
          const existing = existingMap.get(csvRow.id);
          const updatedItem = existing ? { ...existing, ...csvRow } : { ...csvRow };
          existingMap.set(csvRow.id, updatedItem);
          addProductToCatalog(updatedItem);
        });
        return Array.from(existingMap.values());
      });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-bg transition-colors">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={13} /> <span className="text-ink font-medium">Product / SKU Master</span>
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-semibold mb-4 sm:mb-5">Product / SKU Master</h1>

      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto pb-0.5">
        {PRODUCT_MASTER_TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap text-xs sm:text-sm ${
                active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'
              }`}
              style={active ? { borderBottom: '2px solid var(--color-primary)' } : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'list'   && (
        <ProductList
          products={products}
          onSelect={goEdit}
          onDelete={handleDelete}
          onAddNew={openAddModal}
          onViewCost={goViewCost}
          onDownload={() => downloadProductsCSV(products)}
        />
      )}
      {activeTab === 'cost'   && <CostBreakdown product={selectedProduct || products[0]} />}
      {activeTab === 'import' && <BulkImport onImport={handleBulkImport} existingProducts={products} />}

      {/* Animated Modal */}
      <Modal open={modalOpen} onClose={closeModal}>
        <ProductForm
          product={modalProduct}
          products={products}
          onSave={handleSave}
          onClose={closeModal}
        />
      </Modal>
    </div>
  );
}
