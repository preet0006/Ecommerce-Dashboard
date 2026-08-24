import React, { useState } from 'react';
import {
  Truck, Plus, Search, History, BarChart3, Pencil, Trash2,
  ChevronRight, TrendingUp, TrendingDown, Star, Loader2, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

/* ============================================================
   MOCK QUOTES — replace with GET /api/vendors/:id/quotes
   once the quotation table is added to the schema.
   ============================================================ */
const MOCK_QUOTES = [
  { date: '2026-08-02', sku: 'GF-CAS-001', qty: 2500, rate: 495, moq: 500, freight: 12, creditDays: 30, leadTime: 10 },
  { date: '2026-06-14', sku: 'GF-CAS-001', qty: 2000, rate: 510, moq: 500, freight: 12, creditDays: 30, leadTime: 12 },
  { date: '2026-04-01', sku: 'GF-CAS-001', qty: 1500, rate: 522, moq: 500, freight: 15, creditDays: 15, leadTime: 12 },
  { date: '2026-01-19', sku: 'GF-CAS-001', qty: 1000, rate: 540, moq: 500, freight: 15, creditDays: 15, leadTime: 14 },
];

const TABS = [
  { id: 'list',      label: 'Vendor List',            icon: Truck },
  { id: 'edit',      label: 'Add / Edit Vendor',       icon: Plus },
  { id: 'history',   label: 'Quotation History',       icon: History },
  { id: 'scorecard', label: 'Performance Scorecard',   icon: BarChart3 },
];

function scoreBadge(pct, goodAbove) {
  if (pct >= goodAbove)      return <span className="badge-ok">{pct}%</span>;
  if (pct >= goodAbove - 10) return <span className="badge-warn">{pct}%</span>;
  return <span className="badge-danger">{pct}%</span>;
}

/* ── Shared loading / error states ─────────────────────────────────────────── */
function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-8 text-ink-muted">
        <Loader2 size={20} className="inline animate-spin mr-2" />Loading…
      </td>
    </tr>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-sm"
         style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)', color: 'var(--color-red)' }}>
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}

/* ── Vendor List ─────────────────────────────────────────────────────────── */
function VendorList({ onSelect, onAdd, onDeleted }) {
  const [query, setQuery]     = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Load vendors from the real API
  React.useEffect(() => {
    setLoading(true);
    api.getVendors()
      .then(setVendors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(query.toLowerCase())
  );

  async function handleDelete(id) {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await api.deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
      onDeleted?.();
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }

  return (
    <div className="card p-5 animate-enter">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            className="input pl-9"
            placeholder="Search vendors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={onAdd}>
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <table className="table-clean">
        <thead>
          <tr>
            <th>Code</th>
            <th>Vendor</th>
            <th>Contact</th>
            <th>SKUs Supplied</th>
            <th>Lead Time</th>
            <th>Rejection %</th>
            <th>On-time Delivery</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? <LoadingRow cols={8} />
            : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-ink-muted">
                    {query ? 'No vendors match your search.' : 'No vendors yet — click Add Vendor to get started.'}
                  </td>
                </tr>
              )
              : filtered.map((v) => (
                <tr key={v.id}>
                  <td className="text-ink-muted font-mono text-xs">{v.vendorCode}</td>
                  <td className="font-medium">{v.name}</td>
                  <td className="text-ink-muted">{v.contact || '—'}</td>
                  <td>{v.skusSupplied}</td>
                  <td>{v.leadTimeDays} days</td>
                  <td>{scoreBadge(100 - Number(v.rejectionPct), 95)}</td>
                  <td>{scoreBadge(Number(v.deliveryPct), 95)}</td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button className="btn-ghost !px-2" onClick={() => onSelect(v)} title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button className="btn-ghost !px-2" title="Delete" onClick={() => handleDelete(v.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  );
}

/* ── Add / Edit Vendor ────────────────────────────────────────────────────── */
function VendorForm({ vendor, onSaved, onCancel }) {
  const isEdit = Boolean(vendor?.id);

  const [form, setForm] = useState({
    vendorCode:   vendor?.vendorCode   || '',
    name:         vendor?.name         || '',
    contact:      vendor?.contact      || '',
    email:        vendor?.email        || '',
    gstin:        vendor?.gstin        || '',
    leadTimeDays: vendor?.leadTimeDays || '',
    creditDays:   vendor?.creditDays   || '',
    address:      vendor?.address      || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        creditDays:   form.creditDays   ? Number(form.creditDays)   : undefined,
      };
      if (isEdit) {
        await api.updateVendor(vendor.id, payload);
      } else {
        await api.createVendor(payload);
      }
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 max-w-2xl animate-enter">
      <h3 className="font-display font-semibold text-lg mb-1">
        {isEdit ? `Edit ${vendor.name}` : 'Add New Vendor'}
      </h3>
      <p className="text-sm text-ink-muted mb-5">
        Vendor rates and quotations are tracked per SKU under Quotation History — this form is master data only.
      </p>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          {!isEdit && (
            <div>
              <label className="label">Vendor Code <span className="text-red-500">*</span></label>
              <input
                className="input"
                placeholder="V-004"
                value={form.vendorCode}
                onChange={update('vendorCode')}
                required
              />
            </div>
          )}
          <div className={isEdit ? 'col-span-2' : ''}>
            <label className="label">Vendor Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="Shreeji Plastics" value={form.name} onChange={update('name')} required />
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input className="input" placeholder="+91 98200 11223" value={form.contact} onChange={update('contact')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="orders@vendor.com" value={form.email} onChange={update('email')} />
          </div>
          <div>
            <label className="label">GSTIN</label>
            <input className="input" placeholder="27ABCDE1234F1Z5" value={form.gstin} onChange={update('gstin')} />
          </div>
          <div>
            <label className="label">Standard Lead Time (days)</label>
            <input className="input" type="number" placeholder="10" value={form.leadTimeDays} onChange={update('leadTimeDays')} />
          </div>
          <div>
            <label className="label">Credit Days</label>
            <input className="input" type="number" placeholder="30" value={form.creditDays} onChange={update('creditDays')} />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea className="textarea" rows={3} placeholder="Factory / warehouse address" value={form.address} onChange={update('address')} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Vendor'}
          </button>
          <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

/* ── Quotation History ────────────────────────────────────────────────────── */
function QuotationHistory({ quotes }) {
  const sorted = [...quotes].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const best   = [...quotes].sort((a, b) => a.rate - b.rate)[0];

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-5 col-span-2">
        <h3 className="font-display font-semibold mb-1">Quotation History — GF-CAS-001</h3>
        <p className="text-sm text-ink-muted mb-4">Shreeji Plastics · every quote kept, never overwritten</p>
        <table className="table-clean">
          <thead>
            <tr>
              <th>Date</th><th>Qty</th><th className="text-right">Rate</th>
              <th>MOQ</th><th>Freight</th><th>Credit Days</th><th>Lead Time</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((q, i) => (
              <tr key={i}>
                <td>{q.date}</td>
                <td>{q.qty.toLocaleString('en-IN')}</td>
                <td className="text-right font-mono">₹{q.rate}</td>
                <td>{q.moq}</td>
                <td>₹{q.freight}</td>
                <td>{q.creditDays} days</td>
                <td>{q.leadTime} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4">
        <div className="kpi-card">
          <span className="section-title">Latest Quote</span>
          <span className="stat-figure">₹{latest.rate}</span>
          <span className="text-xs text-ink-muted">{latest.date}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Best Historical Rate</span>
          <span className="stat-figure">₹{best.rate}</span>
          <span className="text-xs text-ink-muted">{best.date}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Change vs Best</span>
          <div className="flex items-center gap-1">
            {latest.rate > best.rate
              ? <TrendingUp size={16} className="text-red" />
              : <TrendingDown size={16} className="text-primary" />}
            <span className="stat-figure">
              {(((latest.rate - best.rate) / best.rate) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Performance Scorecard ────────────────────────────────────────────────── */
function PerformanceScorecard() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  React.useEffect(() => {
    api.getVendors()
      .then(setVendors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16 text-ink-muted">
      <Loader2 size={24} className="animate-spin mr-2" />Loading scorecards…
    </div>
  );

  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      {vendors.map((v) => (
        <div key={v.id} className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold">{v.name}</h3>
            <div className="flex items-center gap-1 text-amber">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-medium">{(5 - Number(v.rejectionPct) / 2).toFixed(1)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="section-title block mb-1">Lead Time</span>
              <span className="font-mono text-lg">{v.leadTimeDays}d</span>
            </div>
            <div>
              <span className="section-title block mb-1">SKUs</span>
              <span className="font-mono text-lg">{v.skusSupplied}</span>
            </div>
            <div>
              <span className="section-title block mb-1">Rejection %</span>
              <span className="font-mono text-lg">{v.rejectionPct}%</span>
            </div>
            <div>
              <span className="section-title block mb-1">On-time %</span>
              <span className="font-mono text-lg">{v.deliveryPct}%</span>
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {Number(v.deliveryPct) >= 95 && Number(v.rejectionPct) < 2
              ? <span className="badge-ok">Preferred vendor</span>
              : Number(v.deliveryPct) >= 90
                ? <span className="badge-warn">Monitor</span>
                : <span className="badge-danger">Needs review</span>}
          </div>
        </div>
      ))}
      {vendors.length === 0 && (
        <p className="col-span-3 text-center py-12 text-ink-muted">No vendors to score yet.</p>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function VendorMaster() {
  const [activeTab, setActiveTab]       = useState('list');
  const [selectedVendor, setSelectedVendor] = useState(null);
  // A simple counter to trigger re-fetches in VendorList
  const [refreshKey, setRefreshKey]     = useState(0);

  const goEdit = (vendor) => { setSelectedVendor(vendor); setActiveTab('edit'); };
  const goAdd  = ()       => { setSelectedVendor(null);   setActiveTab('edit'); };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
    setActiveTab('list');
    setSelectedVendor(null);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Vendor Master</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Vendor Master</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== 'edit') setSelectedVendor(null); }}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active
                ? { borderBottom: '2px solid var(--color-primary)' }
                : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'list'      && (
        <VendorList
          key={refreshKey}
          onSelect={goEdit}
          onAdd={goAdd}
          onDeleted={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {activeTab === 'edit'      && (
        <VendorForm
          vendor={selectedVendor}
          onSaved={handleSaved}
          onCancel={() => setActiveTab('list')}
        />
      )}
      {activeTab === 'history'   && <QuotationHistory quotes={MOCK_QUOTES} />}
      {activeTab === 'scorecard' && <PerformanceScorecard />}
    </div>
  );
}