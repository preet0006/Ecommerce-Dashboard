import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import SKUDropdown from './SKUDropdown';
import { CATEGORIES, EMPTY_PRODUCT_FORM, marginBadge } from './utils';

/* ── Add / Edit Product form ── */
export default function ProductForm({ product, products, onSave, onClose }) {
  const [form, setForm] = useState(
    product
      ? {
          id: product.id,
          name: product.name,
          category: product.category,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice ?? '',
          landedCost: product.landedCost ?? '',
          stock: product.stock ?? '',
          gst: product.gst ?? '',
          weight: product.weight ?? '',
          dimensions: product.dimensions ?? '',
        }
      : {
          ...EMPTY_PRODUCT_FORM,
          sellingPrice: '',
          landedCost: '',
          stock: '',
        }
  );
  const [selectedSKU, setSelectedSKU] = useState(product?.id || null);
  const [mode, setMode]               = useState(product ? 'edit' : 'select');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSKUSelect = (p) => {
    setSelectedSKU(p.id);
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice ?? '',
      landedCost: p.landedCost ?? '',
      stock: p.stock ?? '',
      gst: p.gst ?? '',
      weight: p.weight ?? '',
      dimensions: p.dimensions ?? '',
    });
    setMode('edit');
  };

  const handleAddNew = () => {
    setSelectedSKU(null);
    setForm({ ...EMPTY_PRODUCT_FORM, sellingPrice: '', landedCost: '', stock: '' });
    setMode('add');
  };

  const formReadOnly = mode === 'select';

  const sp = Number(form.sellingPrice) || 0;
  const lc = Number(form.landedCost) || 0;
  const autoContributionPct = sp > 0 ? ((sp - lc) / sp) * 100 : 0;

  return (
    <div className="p-6">
      <h3 className="font-display font-semibold text-lg mb-1">
        {mode === 'add' ? 'Add New Product' : mode === 'edit' ? `Edit — ${form.name || 'Product'}` : 'Add / Edit Product'}
      </h3>
      <p className="text-sm text-ink-muted mb-5">
        {mode === 'add'
          ? 'Fill in all details for the new product. Contribution % is automatically calculated.'
          : mode === 'edit'
          ? 'Fields are auto-filled from the catalogue. Update any value and save.'
          : 'Select a SKU from the dropdown to edit, or choose "+ Add New Product".'}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* SKU — full width */}
        <div className="col-span-2">
          <label className="label">SKU Code</label>
          {mode === 'add' ? (
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="e.g. GF-CAS-006"
                value={form.id}
                onChange={update('id')}
              />
              <button
                type="button"
                className="btn-outline text-sm"
                onClick={() => { setMode('select'); setForm({ ...EMPTY_PRODUCT_FORM }); setSelectedSKU(null); }}
              >
                ← Back
              </button>
            </div>
          ) : (
            <SKUDropdown
              products={products}
              value={selectedSKU}
              onSelect={handleSKUSelect}
              onAddProduct={handleAddNew}
              onEditProduct={handleSKUSelect}
            />
          )}
        </div>

        <div>
          <label className="label">Category</label>
          <select className="select" value={form.category} onChange={update('category')} disabled={formReadOnly}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Product Name</label>
          <input className="input" placeholder="e.g. Casserole Set D (4pc)" value={form.name} onChange={update('name')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">MRP (₹)</label>
          <input className="input" type="number" placeholder="1299" value={form.mrp} onChange={update('mrp')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">Selling Price (₹)</label>
          <input className="input" type="number" placeholder="899" value={form.sellingPrice} onChange={update('sellingPrice')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">Landed Cost (₹)</label>
          <input className="input" type="number" placeholder="585" value={form.landedCost} onChange={update('landedCost')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">Stock Qty</label>
          <input className="input" type="number" placeholder="100" value={form.stock} onChange={update('stock')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">GST %</label>
          <input className="input" type="number" placeholder="18" value={form.gst} onChange={update('gst')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">Weight (kg)</label>
          <input className="input" type="number" placeholder="1.2" value={form.weight} onChange={update('weight')} readOnly={formReadOnly} />
        </div>

        <div className="col-span-2">
          <label className="label">Carton Dimensions</label>
          <input className="input" placeholder="30 × 20 × 15 cm" value={form.dimensions} onChange={update('dimensions')} readOnly={formReadOnly} />
        </div>

        {/* Live Automated Contribution % calculation card */}
        {mode !== 'select' && sp > 0 && (
          <div className="col-span-2 p-3.5 rounded-lg bg-primary-soft/20 border border-primary/20 flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-muted">Automated Contribution %:</div>
              <div className="text-xs font-mono text-ink-muted">({sp} - {lc}) / {sp} × 100</div>
            </div>
            <div>{marginBadge(autoContributionPct)}</div>
          </div>
        )}
      </div>

      {mode !== 'select' && (
        <div className="flex items-center gap-2 mt-6">
          <button className="btn-primary" onClick={() => onSave(form, mode)}>
            <CheckCircle2 size={16} />
            {mode === 'add' ? 'Create Product' : 'Save Changes'}
          </button>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
        </div>
      )}
    </div>
  );
}
