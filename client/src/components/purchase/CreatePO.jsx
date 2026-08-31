import React, { useState, useEffect } from 'react';
import {
  Send, Calendar, Package, ShieldCheck, Plus, Sparkles, CheckCircle2, RotateCcw
} from 'lucide-react';
import { getProductsCatalog, addProductToCatalog, fetchAndSyncProductsCatalog } from '../../lib/productsCatalog';
import { createProduct } from '../../lib/api';
import { calculateDeliveryDays, getDefaultDate } from './utils';
import VendorSendModal from './VendorSendModal';

/* ══════════════════════════════════════════════════════════════
   CREATE PO TAB
   – Dual Mode: Select from Product Catalog or Add Brand New Product
   – SKU Code is Optional (auto-generated from Product Name if left blank)
   – Primary Vendor is selected in broadcast / vendor send modal
   – Matches expected delivery date with current date & calculates dynamic SLA
══════════════════════════════════════════════════════════════ */
export default function CreatePO({ onOrdersCreated }) {
  const [catalog, setCatalog] = useState(() => getProductsCatalog());
  const [isCustomSku, setIsCustomSku] = useState(false);

  useEffect(() => {
    fetchAndSyncProductsCatalog().then((updated) => {
      if (Array.isArray(updated) && updated.length > 0) {
        setCatalog(updated);
      }
    });
  }, []);

  const initialItem = catalog[0] || { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', defaultRate: 495, category: 'Casserole' };

  const [form, setForm] = useState({
    sku: initialItem.sku,
    productName: initialItem.name,
    category: initialItem.category || 'Casserole',
    qty: '2500',
    rate: String(initialItem.defaultRate || '495'),
    creditDays: '30',
    notes: '',
    delivery: getDefaultDate(14),
  });

  const [showModal, setShowModal] = useState(false);
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const total = (Number(form.qty) || 0) * (Number(form.rate) || 0);

  // Handle selecting SKU from dropdown
  function handleSkuChange(e) {
    const selectedVal = e.target.value;
    if (selectedVal === '__ADD_NEW__') {
      setIsCustomSku(true);
      setForm((f) => ({ ...f, sku: '', productName: '', rate: f.rate || '495' }));
      return;
    }

    const item = catalog.find((p) => p.sku.toUpperCase() === selectedVal.toUpperCase());
    if (item) {
      setIsCustomSku(false);
      setForm((f) => ({
        ...f,
        sku: item.sku,
        productName: item.name,
        category: item.category || 'General',
        rate: String(item.defaultRate || f.rate),
      }));
    }
  }

  function handleStartAddNewSku() {
    setIsCustomSku(true);
    setForm((f) => ({ ...f, sku: '', productName: '' }));
  }

  function handleCancelAddNewSku() {
    setIsCustomSku(false);
    const fallback = catalog[0] || initialItem;
    setForm((f) => ({
      ...f,
      sku: fallback.sku,
      productName: fallback.name,
      category: fallback.category || 'General',
      rate: String(fallback.defaultRate || f.rate),
    }));
  }

  const timeline = calculateDeliveryDays(form.delivery);

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.productName.trim()) {
      alert('Please enter or select a product / item name.');
      return;
    }

    let finalSku = form.sku.trim().toUpperCase();
    if (!finalSku) {
      const clean = form.productName.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const rand = Math.floor(100 + Math.random() * 900);
      finalSku = `GF-${clean || 'ITEM'}-${rand}`;
    }

    const updatedForm = {
      ...form,
      sku: finalSku,
      productName: form.productName.trim(),
    };

    const newProd = {
      sku: finalSku,
      id: finalSku,
      name: form.productName.trim(),
      category: form.category || 'General',
      defaultRate: Number(form.rate) || 0,
      sellingPrice: Number(form.rate) || 0,
      mrp: Number(form.rate) || 0,
    };

    addProductToCatalog(newProd);
    createProduct(newProd).catch((err) =>
      console.warn('Backend product creation notice:', err.message)
    );

    setCatalog(getProductsCatalog());
    setForm(updatedForm);

    setShowModal(true);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-5 animate-enter">
        <div className="card p-6 col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg mb-1">Create Purchase Order</h3>
              <p className="text-sm text-ink-muted">
                Select existing products or enter a new product name (SKU code is optional). System dynamically calculates delivery timeline.
              </p>
            </div>

            {/* Quick Toggle Button */}
            {!isCustomSku ? (
              <button
                type="button"
                onClick={handleStartAddNewSku}
                className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-primary border-primary/30 hover:border-primary shrink-0"
                title="Add a brand new Product"
              >
                <Plus size={14} /> + Add New Product
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelAddNewSku}
                className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-ink-muted hover:text-ink shrink-0"
                title="Return to existing products catalogue"
              >
                <RotateCcw size={13} /> Select Existing Product
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              {/* Product & SKU Selection Section */}
              {!isCustomSku ? (
                <>
                  <div className="col-span-2 md:col-span-1">
                    <label className="label flex items-center justify-between">
                      <span>Product / SKU</span>
                      <span className="text-[11px] text-ink-muted font-normal">Catalog</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        className="select font-mono flex-1 text-xs"
                        value={form.sku}
                        onChange={handleSkuChange}
                      >
                        {catalog.map((p) => (
                          <option key={p.sku} value={p.sku}>
                            {p.sku} — {p.name}
                          </option>
                        ))}
                        <option value="__ADD_NEW__">➕ + Add New Product / Custom SKU...</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleStartAddNewSku}
                        className="btn-outline !py-2 !px-2.5 shrink-0 text-primary border-primary/40 hover:bg-primary-soft"
                        title="Add New Product"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="label flex items-center justify-between">
                      <span>Product / Item Name</span>
                      <span className="text-[11px] text-primary font-medium">Auto-filled</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Casserole Set A (3pc)"
                      value={form.productName}
                      onChange={update('productName')}
                      required
                    />
                  </div>
                </>
              ) : (
                /* NEW PRODUCT CREATION BANNER & INPUTS */
                <div className="col-span-2 p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary-soft/30 flex flex-col gap-3 animate-enter">
                  <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Sparkles size={16} /> Adding Brand New Product
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelAddNewSku}
                      className="text-xs text-ink-muted hover:text-ink underline flex items-center gap-1"
                    >
                      Cancel & pick existing
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label !text-xs font-semibold text-ink">
                        Product / Item Name <span className="text-red">*</span>
                      </label>
                      <input
                        className="input text-xs"
                        placeholder="e.g. Stainless Steel Thermal Bottle 750ml"
                        value={form.productName}
                        onChange={update('productName')}
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="label !text-xs font-semibold text-ink flex items-center justify-between">
                        <span>SKU Code</span>
                        <span className="text-[10px] text-ink-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        className="input font-mono uppercase text-xs"
                        placeholder="e.g. GF-FLK-750 (auto-generated if empty)"
                        value={form.sku}
                        onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <CheckCircle2 size={13} /> Saved to catalogue for future orders
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      SKU: <strong>{form.sku || (form.productName.trim() ? `Auto-generated from name` : 'Optional')}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery ETA */}
              <div className="col-span-2 md:col-span-1">
                <label className="label flex items-center justify-between">
                  <span>Expected Delivery Date</span>
                  <span className="text-[11px] text-primary font-mono font-bold">
                    {timeline.days} Days
                  </span>
                </label>
                <input
                  className="input font-mono"
                  type="date"
                  value={form.delivery}
                  onChange={update('delivery')}
                  required
                />
              </div>

              {/* Credit Days */}
              <div className="col-span-2 md:col-span-1">
                <label className="label">Credit Days</label>
                <input
                  className="input font-mono"
                  type="number"
                  placeholder="30"
                  value={form.creditDays}
                  onChange={update('creditDays')}
                />
              </div>

              {/* Quantity & Rate */}
              <div>
                <label className="label">Quantity</label>
                <input
                  className="input font-mono"
                  type="number"
                  placeholder="2500"
                  value={form.qty}
                  onChange={update('qty')}
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="label">Target Rate (₹/unit)</label>
                <input
                  className="input font-mono font-semibold"
                  type="number"
                  step="0.01"
                  placeholder="495"
                  value={form.rate}
                  onChange={update('rate')}
                  required
                  min="0.01"
                />
              </div>

              <div className="col-span-2 p-2.5 rounded-lg bg-surface-raised border text-[11px] text-ink-muted flex items-center gap-2">
                <Calendar size={14} className="text-primary shrink-0" />
                <span>
                  Delivery SLA: <strong className="text-primary font-semibold">{timeline.days} days allotted</strong> (Auto follow-up triggers on Day {timeline.autoCheckDay})
                </span>
              </div>

              <div className="col-span-2">
                <label className="label">Notes & Specifications</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Packaging specifications, delivery terms, inspection requirements..."
                  value={form.notes}
                  onChange={update('notes')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Package size={14} className="text-primary" />
                <span>
                  Ordering: <strong className="text-ink font-medium">{form.productName || 'Product'}</strong> {form.sku ? `(${form.sku})` : ''}
                </span>
              </div>

              <button type="submit" className="btn-primary">
                <Send size={15} /> Submit & Broadcast Email to Vendors
              </button>
            </div>
          </form>
        </div>

        {/* Right Side KPI Cards */}
        <div className="flex flex-col gap-4">
          <div className="kpi-card">
            <span className="section-title">PO Total Value</span>
            <span className="stat-figure font-mono">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div className="card p-4 flex flex-col gap-2 border" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1">
              <Package size={13} className="text-primary" /> Item Details
            </span>
            <div className="font-display font-bold text-base text-ink leading-tight">
              {form.productName || 'Product / Item Name'}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="badge bg-surface-raised border">{form.sku || 'SKU (Auto)'}</span>
              <span className="text-ink-muted">·</span>
              <span className="font-semibold text-primary">₹{form.rate || '0'}/unit</span>
            </div>
            <div className="text-xs text-ink-muted pt-1 border-t flex justify-between">
              <span>Order Quantity:</span>
              <strong className="font-mono text-ink">{Number(form.qty || 0).toLocaleString('en-IN')} units</strong>
            </div>
          </div>

          <div className="kpi-card" style={{ borderColor: 'var(--color-primary)' }}>
            <span className="section-title flex items-center gap-1">
              <Calendar size={12} /> Dynamic Lead Time Match
            </span>
            <span className="stat-figure font-mono text-primary">{timeline.days} Days</span>
            <span className="text-xs text-ink-muted">
              Auto check on Day {timeline.autoCheckDay} · Due on {form.delivery}
            </span>
          </div>

          <div className="card p-5 text-sm text-ink-muted leading-relaxed flex flex-col gap-2">
            <div className="font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-primary" /> Dynamic Delivery Tracking
            </div>
            <p className="text-xs">
              • <strong>SKU Code Optional</strong>: If left blank, SKU is automatically generated from the product name.
            </p>
            <p className="text-xs">
              • <strong>Custom Timeline</strong>: When you pick a date, the exact day difference from today is calculated dynamically.
            </p>
            <p className="text-xs">
              • <strong>Automated Follow-up</strong>: Status inquiry will automatically trigger at ~67% of delivery time (Day {timeline.autoCheckDay} of {timeline.days}).
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Send Modal */}
      {showModal && (
        <VendorSendModal
          poDetails={form}
          onClose={() => setShowModal(false)}
          onOrdersCreated={(orders) => {
            if (onOrdersCreated) onOrdersCreated(orders);
          }}
        />
      )}
    </>
  );
}
