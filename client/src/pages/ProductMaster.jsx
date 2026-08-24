import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Package, Plus, Search, Upload, Calculator, Pencil, Trash2,
  ChevronRight, FileSpreadsheet, CheckCircle2, AlertCircle, X, ChevronDown
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Product catalogue — single source of truth                         */
/* ------------------------------------------------------------------ */
const INITIAL_PRODUCTS = [
  { id: 'GF-CAS-001', name: 'Casserole Set A (3pc)', category: 'Casserole',      mrp: 1299, gst: 18, weight: 1.2, dimensions: '30 × 20 × 15 cm', sellingPrice: 899,  landedCost: 585,  contributionPct: 34.9, stock: 650 },
  { id: 'GF-BWL-014', name: 'Bowl Set B (6pc)',       category: 'Bowl',           mrp: 799,  gst: 12, weight: 0.8, dimensions: '25 × 18 × 12 cm', sellingPrice: 549,  landedCost: 410,  contributionPct: 25.3, stock: 180 },
  { id: 'GF-PET-002', name: 'Pet Bowl Steel',         category: 'Pet Accessories',mrp: 349,  gst: 12, weight: 0.4, dimensions: '20 × 20 × 8 cm',  sellingPrice: 249,  landedCost: 140,  contributionPct: 43.8, stock: 900 },
  { id: 'GF-CAS-005', name: 'Casserole Set C (5pc)',  category: 'Casserole',      mrp: 1899, gst: 18, weight: 2.1, dimensions: '40 × 28 × 18 cm', sellingPrice: 1399, landedCost: 1120, contributionPct: 19.9, stock: 90  },
];

const TABS = [
  { id: 'list',   label: 'Product List',   icon: Package },
  { id: 'cost',   label: 'Cost Breakdown', icon: Calculator },
  { id: 'import', label: 'Bulk Import',     icon: Upload },
];

const CATEGORIES = ['Casserole', 'Bowl', 'Pet Accessories', 'Storage'];

function marginBadge(pct) {
  if (pct >= 30) return <span className="badge-ok">{pct.toFixed(1)}%</span>;
  if (pct >= 20) return <span className="badge-warn">{pct.toFixed(1)}%</span>;
  return <span className="badge-danger">{pct.toFixed(1)}%</span>;
}

/* ------------------------------------------------------------------ */
/*  Smart SKU Dropdown                                                  */
/* ------------------------------------------------------------------ */
function SKUDropdown({ products, value, onSelect, onAddProduct, onEditProduct }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.id.toLowerCase().includes(query.toLowerCase())
  );

  const selected = products.find(p => p.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input flex items-center justify-between gap-2 w-full text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected ? 'text-ink font-mono text-sm' : 'text-ink-muted text-sm'}>
          {selected ? `${selected.id} — ${selected.name}` : 'Select SKU…'}
        </span>
        <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg shadow-lg border"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                autoFocus
                className="input pl-8 text-sm h-8"
                placeholder="Search SKU or product name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filtered.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer hover:bg-[var(--color-bg)] transition-colors"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div
                className="flex-1 min-w-0"
                onClick={() => { onSelect(p); setOpen(false); setQuery(''); }}
              >
                <span className="font-mono text-xs text-ink-muted mr-2">{p.id}</span>
                <span className="text-sm font-medium text-ink">{p.name}</span>
                <span className="ml-2 text-xs text-ink-muted">· {p.category}</span>
              </div>
              <button
                type="button"
                title="Edit product"
                className="btn-ghost !px-1.5 !py-1 shrink-0"
                onClick={(e) => { e.stopPropagation(); onEditProduct(p); setOpen(false); setQuery(''); }}
              >
                <Pencil size={13} />
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-3 text-sm text-ink-muted text-center">No products found</div>
          )}

          <div
            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer font-medium text-sm sticky bottom-0"
            style={{ color: 'var(--color-primary)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
            onClick={() => { onAddProduct(); setOpen(false); setQuery(''); }}
          >
            <Plus size={15} /> Add New Product
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Modal wrapper                                              */
/* ------------------------------------------------------------------ */
function Modal({ open, onClose, children }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.18s ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />
      {/* Card */}
      <div
        className="relative w-full max-w-2xl rounded-xl shadow-2xl"
        style={{
          background: 'var(--color-surface)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn-ghost !px-2 !py-2 absolute top-4 right-4 z-10"
          title="Close"
        >
          <X size={18} />
        </button>
        {children}
      </div>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(28px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product List tab                                                    */
/* ------------------------------------------------------------------ */
function ProductList({ products, onSelect, onAddNew, onViewCost }) {
  const [query, setQuery] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="card p-5 animate-enter">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            className="input pl-9"
            placeholder="Search by SKU or product name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={onAddNew}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      <table className="table-clean">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Category</th>
            <th>MRP</th>
            <th>Selling Price</th>
            <th>Landed Cost</th>
            <th>Contribution %</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr
              key={p.id}
              onClick={() => onViewCost(p)}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                cursor: 'pointer',
                background: hoveredId === p.id ? 'rgba(34, 102, 68, 0.10)' : '',
                transition: 'background 0.18s ease',
              }}
              title="Click to view Cost Breakdown"
            >
              <td className="font-mono text-xs text-ink-muted">{p.id}</td>
              <td className="font-medium">{p.name}</td>
              <td>{p.category}</td>
              <td>₹{p.mrp.toLocaleString('en-IN')}</td>
              <td>₹{p.sellingPrice.toLocaleString('en-IN')}</td>
              <td>₹{p.landedCost.toLocaleString('en-IN')}</td>
              <td>{marginBadge(p.contributionPct)}</td>
              <td>{p.stock.toLocaleString('en-IN')}</td>
              <td>
                <div className="flex items-center gap-1 justify-end">
                  <button
                    className="btn-ghost !px-2"
                    title="Edit product"
                    onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn-ghost !px-2"
                    title="Delete"
                    style={{ color: 'var(--color-danger, #e53e3e)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-ink-muted py-8">
                No products match "{query}".
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Subtle hint */}
      <p className="text-xs text-ink-muted mt-3 text-center">
        💡 Click any row to view its Cost Breakdown
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add / Edit Product form                                             */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = { id: '', name: '', category: 'Casserole', mrp: '', gst: '', weight: '', dimensions: '' };

function ProductForm({ product, products, onSave, onClose }) {
  const [form, setForm] = useState(
    product
      ? { id: product.id, name: product.name, category: product.category, mrp: product.mrp, gst: product.gst ?? '', weight: product.weight ?? '', dimensions: product.dimensions ?? '' }
      : { ...EMPTY_FORM }
  );
  const [selectedSKU, setSelectedSKU] = useState(product?.id || null);
  const [mode, setMode]               = useState(product ? 'edit' : 'select');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSKUSelect = (p) => {
    setSelectedSKU(p.id);
    setForm({ id: p.id, name: p.name, category: p.category, mrp: p.mrp, gst: p.gst ?? '', weight: p.weight ?? '', dimensions: p.dimensions ?? '' });
    setMode('edit');
  };

  const handleAddNew = () => {
    setSelectedSKU(null);
    setForm({ ...EMPTY_FORM });
    setMode('add');
  };

  const formReadOnly = mode === 'select';

  return (
    <div className="p-6">
      <h3 className="font-display font-semibold text-lg mb-1">
        {mode === 'add' ? 'Add New Product' : mode === 'edit' ? `Edit — ${form.name || 'Product'}` : 'Add / Edit Product'}
      </h3>
      <p className="text-sm text-ink-muted mb-5">
        {mode === 'add'
          ? 'Fill in all details for the new product. A permanent SKU will be created.'
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
                onClick={() => { setMode('select'); setForm({ ...EMPTY_FORM }); setSelectedSKU(null); }}
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
          <label className="label">GST %</label>
          <input className="input" type="number" placeholder="18" value={form.gst} onChange={update('gst')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">Weight (kg)</label>
          <input className="input" type="number" placeholder="1.2" value={form.weight} onChange={update('weight')} readOnly={formReadOnly} />
        </div>

        <div>
          <label className="label">Carton Dimensions</label>
          <input className="input" placeholder="30 × 20 × 15 cm" value={form.dimensions} onChange={update('dimensions')} readOnly={formReadOnly} />
        </div>
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

/* ------------------------------------------------------------------ */
/*  Cost Breakdown — editable rows                                      */
/* ------------------------------------------------------------------ */
const DEFAULT_COST_ROWS = [
  { id: 1, label: 'Vendor basic price',       value: 500 },
  { id: 2, label: 'GST',                       value: 90  },
  { id: 3, label: 'Inward freight allocation', value: 25  },
  { id: 4, label: 'Corrugated packaging',      value: 35  },
  { id: 5, label: 'Label / barcode',           value: 5   },
  { id: 6, label: 'Inspection / handling',     value: 10  },
  { id: 7, label: 'Damage provision',          value: 10  },
];

function CostBreakdown({ product }) {
  const [rows,      setRows]      = useState(DEFAULT_COST_ROWS);
  const [editingId, setEditingId] = useState(null);   // row id being edited
  const [draft,     setDraft]     = useState({});      // { label, value } draft
  const [nextId,    setNextId]    = useState(8);

  const landedCost      = rows.reduce((sum, r) => sum + Number(r.value || 0), 0);
  const sellingPrice    = product?.sellingPrice ?? 899;
  const contribution    = sellingPrice - landedCost;
  const contributionPct = sellingPrice > 0 ? (contribution / sellingPrice) * 100 : 0;

  const startEdit = (r) => { setEditingId(r.id); setDraft({ label: r.label, value: r.value }); };
  const cancelEdit = ()  => { setEditingId(null); setDraft({}); };
  const saveEdit   = (id) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, label: draft.label, value: Number(draft.value) || 0 } : r));
    setEditingId(null);
  };
  const deleteRow = (id) => setRows(prev => prev.filter(r => r.id !== id));
  const addRow    = () => {
    const newId = nextId;
    setNextId(n => n + 1);
    setRows(prev => [...prev, { id: newId, label: 'New cost field', value: 0 }]);
    setEditingId(newId);
    setDraft({ label: 'New cost field', value: 0 });
  };

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-5 col-span-2">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-display font-semibold">
            Cost Breakdown — {product?.name || 'Casserole Set A (3pc)'}
          </h3>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          {product?.id || 'GF-CAS-001'} · GST tracked separately for input tax credit
        </p>

        <table className="table-clean">
          <thead>
            <tr>
              <th>Cost field</th>
              <th className="text-right">Amount (₹)</th>
              <th style={{ width: 72 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ transition: 'background 0.12s' }}>
                {editingId === r.id ? (
                  /* ---- Edit mode ---- */
                  <>
                    <td>
                      <input
                        className="input text-sm h-8 w-full"
                        value={draft.label}
                        onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
                        autoFocus
                      />
                    </td>
                    <td className="text-right">
                      <input
                        className="input text-sm h-8 w-24 text-right font-mono"
                        type="number"
                        value={draft.value}
                        onChange={e => setDraft(d => ({ ...d, value: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(r.id); if (e.key === 'Escape') cancelEdit(); }}
                      />
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-primary !px-2 !py-1 text-xs" onClick={() => saveEdit(r.id)}>
                          <CheckCircle2 size={13} />
                        </button>
                        <button className="btn-outline !px-2 !py-1 text-xs" onClick={cancelEdit}>
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  /* ---- View mode ---- */
                  <>
                    <td>{r.label}</td>
                    <td className="text-right font-mono">₹{Number(r.value).toLocaleString('en-IN')}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button
                          className="btn-ghost !px-1.5 !py-1"
                          title="Edit row"
                          onClick={() => startEdit(r)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn-ghost !px-1.5 !py-1"
                          title="Delete row"
                          style={{ color: 'var(--color-danger, #e53e3e)' }}
                          onClick={() => deleteRow(r.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Landed cost total row */}
            <tr style={{ borderTop: '2px solid var(--color-border)' }}>
              <td className="font-semibold">Landed cost</td>
              <td className="text-right font-mono font-semibold">₹{landedCost.toLocaleString('en-IN')}</td>
              <td />
            </tr>
          </tbody>
        </table>

        {/* Add row button */}
        <button
          className="btn-outline text-sm mt-4 w-full"
          onClick={addRow}
        >
          <Plus size={14} /> Add Cost Field
        </button>
      </div>

      {/* KPI sidebar */}
      <div className="flex flex-col gap-4">
        <div className="kpi-card">
          <span className="section-title">Landed Cost</span>
          <span className="stat-figure">₹{landedCost.toLocaleString('en-IN')}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Selling Price</span>
          <span className="stat-figure">₹{sellingPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Contribution</span>
          <span className="stat-figure">₹{contribution.toLocaleString('en-IN')}</span>
          <div>{marginBadge(contributionPct)}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bulk Import                                                         */
/* ------------------------------------------------------------------ */
const TEMPLATE_HEADERS = ['sku','name','category','mrp','gst','weight','dimensions','selling_price','landed_cost','stock'];
const TEMPLATE_SAMPLE  = ['GF-CAS-006','Casserole Set D (4pc)','Casserole','1499','18','1.4','"32 x 22 x 16 cm"','1099','650','200'];

/* Tokenise one CSV line respecting RFC-4180 quoted fields */
function splitCSVLine(line) {
  const fields = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }   // escaped quote
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { fields.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

/* Normalise a header string: lowercase, strip non-alphanumeric, collapse spaces */
function normHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/* Strip ₹, commas, %, spaces so "₹1,299" → 1299 and "34.90%" → 34.9 */
function parseNum(v) {
  if (v == null) return 0;
  const cleaned = String(v).replace(/[₹,%\s]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/* Try to resolve a normalised header to our internal field name */
function resolveHeader(raw) {
  const n = normHeader(raw);
  const MAP = {
    sku: 'sku', skucode: 'sku', skuid: 'sku', id: 'sku',
    name: 'name', productname: 'name', product: 'name', title: 'name',
    category: 'category', cat: 'category',
    mrp: 'mrp', maximumretailprice: 'mrp', listprice: 'mrp',
    gst: 'gst', gstpercent: 'gst', gstp: 'gst', tax: 'gst',
    weight: 'weight', weightkg: 'weight', wt: 'weight',
    dimensions: 'dimensions', cartondimensions: 'dimensions', size: 'dimensions',
    // full names
    sellingprice: 'selling_price', saleprice: 'selling_price', price: 'selling_price', sp: 'selling_price',
    landedcost: 'landed_cost', cost: 'landed_cost', landedcostprice: 'landed_cost', lc: 'landed_cost',
    stock: 'stock', quantity: 'stock', qty: 'stock', inventory: 'stock',
    contributionpct: 'contributionpct', margin: 'contributionpct',
    contribution: 'contributionpct', contributionpercent: 'contributionpct',
    contributionmargin: 'contributionpct',
    // truncated column names (Excel cuts long headers in narrow cols)
    sellingpr: 'selling_price', sellingp: 'selling_price', sellingpri: 'selling_price',
    landedco: 'landed_cost', landedc: 'landed_cost', landedcos: 'landed_cost',
    contribut: 'contributionpct', contributi: 'contributionpct',
  };
  return MAP[n] || n;
}

function parseCSV(text) {
  // Strip BOM if present
  const clean = text.replace(/^\uFEFF/, '').trim();
  const lines = clean.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const rawHeaders = splitCSVLine(lines[0]);
  const headers    = rawHeaders.map(resolveHeader);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    if (vals.every(v => v === '')) continue;           // skip blank lines

    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });

    const sp = parseNum(obj.selling_price);
    const lc = parseNum(obj.landed_cost);

    rows.push({
      id:              (obj.sku || '').trim(),
      name:            (obj.name || '').trim(),
      category:        (obj.category || 'Uncategorised').trim(),
      mrp:             parseNum(obj.mrp),
      gst:             parseNum(obj.gst),
      weight:          parseNum(obj.weight),
      dimensions:      (obj.dimensions || '').trim(),
      sellingPrice:    sp,
      landedCost:      lc,
      contributionPct: sp > 0 ? ((sp - lc) / sp) * 100 : parseNum(obj.contributionpct),
      stock:           parseNum(obj.stock),
    });
  }

  return rows.filter(p => p.id);   // must have a SKU
}

function downloadTemplate() {
  const csv  = [TEMPLATE_HEADERS.join(','), TEMPLATE_SAMPLE.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'greenfibre_product_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function BulkImport({ onImport }) {
  const [fileName,  setFileName]  = useState(null);
  const [fileRef,   setFileRef]   = useState(null);   // raw File object
  const [preview,   setPreview]   = useState([]);     // parsed rows
  const [imported,  setImported]  = useState(false);
  const [error,     setError]     = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileRef(file);
    setImported(false);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      if (rows.length === 0) {
        setError('No valid rows found. Make sure the CSV has the correct headers.');
        setPreview([]);
      } else {
        setPreview(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (preview.length === 0) return;
    onImport(preview);
    setImported(true);
  };

  return (
    <div className="card p-6 max-w-3xl animate-enter">
      <h3 className="font-display font-semibold text-lg mb-1">Bulk Import Products</h3>
      <p className="text-sm text-ink-muted mb-5">
        Upload a CSV with columns:
        <span className="font-mono text-xs ml-1">
          sku, name, category, mrp, gst, weight, dimensions, selling_price, landed_cost, stock
        </span>
      </p>

      {/* Drop zone */}
      <label
        className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-md py-10 cursor-pointer"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <FileSpreadsheet size={28} className="text-ink-muted" />
        <span className="text-sm text-ink-muted">
          {fileName ? fileName : 'Click to select a CSV file, or drag it here'}
        </span>
        <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-4 text-sm" style={{ color: '#e53e3e' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && !imported && (
        <div className="mt-5">
          <p className="text-sm font-medium mb-2">
            Preview — {preview.length} row{preview.length > 1 ? 's' : ''} detected
          </p>
          <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
            <table className="table-clean text-xs">
              <thead>
                <tr>
                  <th>SKU</th><th>Name</th><th>Category</th>
                  <th>MRP</th><th>Selling Price</th><th>Landed Cost</th><th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i}>
                    <td className="font-mono">{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>₹{p.mrp}</td>
                    <td>₹{p.sellingPrice}</td>
                    <td>₹{p.landedCost}</td>
                    <td>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success */}
      {imported && (
        <div className="flex items-center gap-2 mt-4 text-sm" style={{ color: 'var(--color-primary)' }}>
          <CheckCircle2 size={16} /> {preview.length} product{preview.length > 1 ? 's' : ''} imported successfully!
        </div>
      )}

      {/* Ready badge */}
      {fileName && !imported && !error && (
        <div className="flex items-center gap-2 mt-4 text-sm text-primary-strong">
          <CheckCircle2 size={16} /> {fileName} ready to import
        </div>
      )}

      <div className="flex items-center gap-2 mt-5">
        <button
          className="btn-primary"
          disabled={preview.length === 0 || imported}
          onClick={handleImport}
        >
          <Upload size={16} /> Import {preview.length > 0 ? `${preview.length} Products` : 'Products'}
        </button>
        <button className="btn-outline" onClick={downloadTemplate}>
          Download Template
        </button>
      </div>

      <div className="flex items-start gap-2 mt-5 text-xs text-ink-muted">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        Existing SKUs will be updated; new SKUs will be created. Rows with missing costs are held for review.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page root                                                           */
/* ------------------------------------------------------------------ */
export default function ProductMaster() {
  // ── Persisted state: restore from localStorage on mount ──────────────
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem('pm_activeTab') || 'list'; } catch { return 'list'; }
  });

  const [selectedProduct, setSelectedProduct] = useState(() => {
    try {
      const saved = localStorage.getItem('pm_selectedProductId');
      return saved ? (INITIAL_PRODUCTS.find(p => p.id === saved) || null) : null;
    } catch { return null; }
  });

  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  // ── Persist whenever tab or selected product changes ─────────────────
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
    if (mode === 'add') {
      const newProduct = {
        id: form.id, name: form.name, category: form.category,
        mrp: Number(form.mrp) || 0, gst: Number(form.gst) || 0,
        weight: Number(form.weight) || 0, dimensions: form.dimensions,
        sellingPrice: 0, landedCost: 0, contributionPct: 0, stock: 0,
      };
      setProducts(prev => [...prev, newProduct]);
    } else {
      setProducts(prev =>
        prev.map(p =>
          p.id === form.id
            ? { ...p, name: form.name, category: form.category, mrp: Number(form.mrp) || p.mrp, gst: Number(form.gst) || p.gst, weight: Number(form.weight) || p.weight, dimensions: form.dimensions || p.dimensions }
            : p
        )
      );
    }
    closeModal();
  };

  // Bulk import: upsert by SKU id
  const handleBulkImport = (rows) => {
    setProducts(prev => {
      const map = Object.fromEntries(prev.map(p => [p.id, p]));
      rows.forEach(r => { map[r.id] = { ...map[r.id], ...r }; });
      return Object.values(map);
    });
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Product / SKU Master</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Product / SKU Master</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active ? { borderBottom: '2px solid var(--color-primary)' } : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'list'   && <ProductList products={products} onSelect={goEdit} onAddNew={openAddModal} onViewCost={goViewCost} />}
      {activeTab === 'cost'   && <CostBreakdown product={selectedProduct || products[0]} />}
      {activeTab === 'import' && <BulkImport onImport={handleBulkImport} />}

      {/* ---- Animated Modal ---- */}
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

