import React, { useState } from 'react';
import {
  Package, Plus, Search, Upload, Calculator, Pencil, Trash2,
  ChevronRight, FileSpreadsheet, CheckCircle2, AlertCircle, X
} from 'lucide-react';



const MOCK_PRODUCTS = [
  { id: 'GF-CAS-001', name: 'Casserole Set A (3pc)', category: 'Casserole', mrp: 1299, sellingPrice: 899, landedCost: 585, contributionPct: 34.9, stock: 650 },
  { id: 'GF-BWL-014', name: 'Bowl Set B (6pc)', category: 'Bowl', mrp: 799, sellingPrice: 549, landedCost: 410, contributionPct: 25.3, stock: 180 },
  { id: 'GF-PET-002', name: 'Pet Bowl Steel', category: 'Pet Accessories', mrp: 349, sellingPrice: 249, landedCost: 140, contributionPct: 43.8, stock: 900 },
  { id: 'GF-CAS-005', name: 'Casserole Set C (5pc)', category: 'Casserole', mrp: 1899, sellingPrice: 1399, landedCost: 1120, contributionPct: 19.9, stock: 90 },
];

const TABS = [
  { id: 'list', label: 'Product List', icon: Package },
  { id: 'edit', label: 'Add / Edit Product', icon: Plus },
  { id: 'cost', label: 'Cost Breakdown', icon: Calculator },
  { id: 'import', label: 'Bulk Import', icon: Upload },
];

function marginBadge(pct) {
  if (pct >= 30) return <span className="badge-ok">{pct.toFixed(1)}%</span>;
  if (pct >= 20) return <span className="badge-warn">{pct.toFixed(1)}%</span>;
  return <span className="badge-danger">{pct.toFixed(1)}%</span>;
}

/* ---------------- Product List ---------------- */
function ProductList({ products, onSelect }) {
  const [query, setQuery] = useState('');
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
        <button className="btn-primary">
          <Plus size={16} /> Add Product
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
            <tr key={p.id}>
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
                  <button className="btn-ghost !px-2" onClick={() => onSelect(p)} title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="btn-ghost !px-2" title="Delete">
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
    </div>
  );
}

/* ---------------- Add / Edit Product ---------------- */
function ProductForm({ product }) {
  const [form, setForm] = useState({
    id: product?.id || '',
    name: product?.name || '',
    category: product?.category || 'Casserole',
    mrp: product?.mrp || '',
    gst: '',
    weight: '',
    dimensions: '',
  });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="card p-6 max-w-2xl animate-enter">
      <h3 className="font-display font-semibold text-lg mb-1">
        {product ? `Edit ${product.name}` : 'Add New Product'}
      </h3>
      <p className="text-sm text-ink-muted mb-5">
        Every product gets a permanent SKU. Cost fields are set separately under Cost Breakdown.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">SKU Code</label>
          <input className="input" placeholder="GF-CAS-006" value={form.id} onChange={update('id')} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="select" value={form.category} onChange={update('category')}>
            <option>Casserole</option>
            <option>Bowl</option>
            <option>Pet Accessories</option>
            <option>Storage</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Product Name</label>
          <input className="input" placeholder="Casserole Set D (4pc)" value={form.name} onChange={update('name')} />
        </div>
        <div>
          <label className="label">MRP (₹)</label>
          <input className="input" type="number" placeholder="1299" value={form.mrp} onChange={update('mrp')} />
        </div>
        <div>
          <label className="label">GST %</label>
          <input className="input" type="number" placeholder="18" value={form.gst} onChange={update('gst')} />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input className="input" type="number" placeholder="1.2" value={form.weight} onChange={update('weight')} />
        </div>
        <div>
          <label className="label">Carton Dimensions</label>
          <input className="input" placeholder="30 x 20 x 15 cm" value={form.dimensions} onChange={update('dimensions')} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <button className="btn-primary">
          <CheckCircle2 size={16} /> Save Product
        </button>
        <button className="btn-outline">Cancel</button>
      </div>
    </div>
  );
}

/* ---------------- Cost Breakdown ---------------- */
function CostBreakdown({ product }) {
  const rows = [
    { label: 'Vendor basic price', value: 500 },
    { label: 'GST', value: 90 },
    { label: 'Inward freight allocation', value: 25 },
    { label: 'Corrugated packaging', value: 35 },
    { label: 'Label / barcode', value: 5 },
    { label: 'Inspection / handling', value: 10 },
    { label: 'Damage provision', value: 10 },
  ];
  const landedCost = rows.reduce((sum, r) => sum + r.value, 0);
  const sellingPrice = product?.sellingPrice ?? 899;
  const contribution = sellingPrice - landedCost;
  const contributionPct = (contribution / sellingPrice) * 100;

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-5 col-span-2">
        <h3 className="font-display font-semibold mb-1">
          Cost Breakdown — {product?.name || 'Casserole Set A (3pc)'}
        </h3>
        <p className="text-sm text-ink-muted mb-4">
          {product?.id || 'GF-CAS-001'} · GST tracked separately for input tax credit
        </p>
        <table className="table-clean">
          <thead>
            <tr>
              <th>Cost field</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td className="text-right font-mono">₹{r.value}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">Landed cost</td>
              <td className="text-right font-mono font-semibold">₹{landedCost}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4">
        <div className="kpi-card">
          <span className="section-title">Landed Cost</span>
          <span className="stat-figure">₹{landedCost}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Selling Price</span>
          <span className="stat-figure">₹{sellingPrice}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Contribution</span>
          <span className="stat-figure">₹{contribution}</span>
          <div>{marginBadge(contributionPct)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bulk Import ---------------- */
function BulkImport() {
  const [fileName, setFileName] = useState(null);

  return (
    <div className="card p-6 max-w-xl animate-enter">
      <h3 className="font-display font-semibold text-lg mb-1">Bulk Import Products</h3>
      <p className="text-sm text-ink-muted mb-5">
        Upload a CSV with columns: sku, name, category, mrp, gst, vendor_price, freight, packaging.
      </p>

      <label className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-md py-10 cursor-pointer"
        style={{ borderColor: 'var(--color-border)' }}>
        <FileSpreadsheet size={28} className="text-ink-muted" />
        <span className="text-sm text-ink-muted">
          {fileName ? fileName : 'Click to select a CSV file, or drag it here'}
        </span>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
        />
      </label>

      {fileName && (
        <div className="flex items-center gap-2 mt-4 text-sm text-primary-strong">
          <CheckCircle2 size={16} /> {fileName} ready to import
        </div>
      )}

      <div className="flex items-center gap-2 mt-5">
        <button className="btn-primary" disabled={!fileName}>
          <Upload size={16} /> Import Products
        </button>
        <button className="btn-outline">Download Template</button>
      </div>

      <div className="flex items-start gap-2 mt-5 text-xs text-ink-muted">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        Existing SKUs will be updated; new SKUs will be created. Rows with missing costs are held for review.
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function ProductMaster() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const goEdit = (product) => {
    setSelectedProduct(product);
    setActiveTab('edit');
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Product / SKU Master</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Product / SKU Master</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== 'edit') setSelectedProduct(null); }}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active ? { borderBottom: '2px solid var(--color-primary)' } : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'list' && <ProductList products={MOCK_PRODUCTS} onSelect={goEdit} />}
      {activeTab === 'edit' && <ProductForm product={selectedProduct} />}
      {activeTab === 'cost' && <CostBreakdown product={selectedProduct || MOCK_PRODUCTS[0]} />}
      {activeTab === 'import' && <BulkImport />}
    </div>
  );
}