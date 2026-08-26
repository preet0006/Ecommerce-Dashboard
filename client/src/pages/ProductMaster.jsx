import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

// Sub-components
import ProductList from '../components/productmaster/ProductList';
import CostBreakdown from '../components/productmaster/CostBreakdown';
import BulkImport from '../components/productmaster/BulkImport';
import ProductForm from '../components/productmaster/ProductForm';
import Modal from '../components/productmaster/Modal';

// Shared helpers and constants
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

  const [products, setProducts]         = useState(INITIAL_PRODUCTS);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  // Persist whenever tab or selected product changes
  useEffect(() => {
    try { localStorage.setItem('pm_activeTab', activeTab); } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (selectedProduct) localStorage.setItem('pm_selectedProductId', selectedProduct.id);
      else localStorage.removeItem('pm_selectedProductId');
    } catch {}
  }, [selectedProduct]);

  const openAddModal  = useCallback(() => { setModalProduct(null); setModalOpen(true); }, []);
  const openEditModal = useCallback((p) => { setModalProduct(p);   setModalOpen(true); }, []);
  const closeModal    = useCallback(() => { setModalOpen(false); },                     []);

  // Pencil icon → open edit modal
  const goEdit = (product) => openEditModal(product);

  // Row click → go to Cost Breakdown for that product
  const goViewCost = useCallback((product) => {
    setSelectedProduct(product);
    setActiveTab('cost');
  }, []);

  const handleSave = (form, mode) => {
    const sp = Number(form.sellingPrice) || 0;
    const lc = Number(form.landedCost) || 0;
    const autoContribution = sp > 0 ? ((sp - lc) / sp) * 100 : 0;

    if (mode === 'add') {
      const newProduct = {
        id: form.id,
        name: form.name,
        category: form.category,
        mrp: Number(form.mrp) || 0,
        sellingPrice: sp,
        landedCost: lc,
        contributionPct: autoContribution,
        stock: Number(form.stock) || 0,
        gst: Number(form.gst) || 0,
        weight: Number(form.weight) || 0,
        dimensions: form.dimensions || '',
      };
      setProducts(prev => [...prev, newProduct]);
    } else {
      setProducts(prev =>
        prev.map(p =>
          p.id === form.id
            ? {
                ...p,
                name: form.name,
                category: form.category,
                mrp: Number(form.mrp) || p.mrp,
                sellingPrice: form.sellingPrice !== '' ? Number(form.sellingPrice) : p.sellingPrice,
                landedCost: form.landedCost !== '' ? Number(form.landedCost) : p.landedCost,
                contributionPct:
                  (form.sellingPrice !== '' ? Number(form.sellingPrice) : p.sellingPrice) > 0
                    ? (((form.sellingPrice !== '' ? Number(form.sellingPrice) : p.sellingPrice) -
                        (form.landedCost !== '' ? Number(form.landedCost) : p.landedCost)) /
                        (form.sellingPrice !== '' ? Number(form.sellingPrice) : p.sellingPrice)) *
                      100
                    : 0,
                stock: form.stock !== '' ? Number(form.stock) : p.stock,
                gst: Number(form.gst) || p.gst,
                weight: Number(form.weight) || p.weight,
                dimensions: form.dimensions || p.dimensions,
              }
            : p
        )
      );
    }
    closeModal();
  };

  const handleBulkImport = (rows) => {
    setProducts(prev => {
      const existingMap = new Map(prev.map(p => [p.id, p]));
      rows.forEach(csvRow => {
        const existing = existingMap.get(csvRow.id);
        existingMap.set(csvRow.id, existing
          ? { ...existing, ...csvRow }
          : { ...csvRow }
        );
      });
      return Array.from(existingMap.values());
    });
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