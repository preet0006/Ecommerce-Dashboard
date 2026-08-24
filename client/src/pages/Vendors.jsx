import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Plus, Search, History, BarChart3, Pencil, Trash2,
  ChevronRight, TrendingUp, TrendingDown, Star, Loader2, AlertCircle,
  ChevronDown, Check, X
} from 'lucide-react';
import { api } from '../lib/api';

/* ============================================================
   MOCK QUOTES — replace with GET /api/vendors/:id/quotes
   ============================================================ */
const MOCK_QUOTES = [
  { date: '2026-08-02', sku: 'GF-CAS-001', qty: 2500, rate: 495, moq: 500, freight: 12, creditDays: 30, leadTime: 10 },
  { date: '2026-06-14', sku: 'GF-CAS-001', qty: 2000, rate: 510, moq: 500, freight: 12, creditDays: 30, leadTime: 12 },
  { date: '2026-04-01', sku: 'GF-CAS-001', qty: 1500, rate: 522, moq: 500, freight: 15, creditDays: 15, leadTime: 12 },
  { date: '2026-01-19', sku: 'GF-CAS-001', qty: 1000, rate: 540, moq: 500, freight: 15, creditDays: 15, leadTime: 14 },
];

const TABS = [
  { id: 'list', label: 'Vendor List', icon: Truck },
  { id: 'edit', label: 'Add / Edit Vendor', icon: Plus },
  { id: 'history', label: 'Quotation History', icon: History },
  { id: 'scorecard', label: 'Performance Scorecard', icon: BarChart3 },
];

function scoreBadge(pct, goodAbove) {
  if (pct >= goodAbove) return <span className="badge-ok">{pct}%</span>;
  if (pct >= goodAbove - 10) return <span className="badge-warn">{pct}%</span>;
  return <span className="badge-danger">{pct}%</span>;
}

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

/* ══════════════════════════════════════════════════════════════
   VENDOR CODE COMBOBOX
   – Fetches existing codes from /api/vendors/codes
   – Shows them in a styled dropdown
   – Has an "Add New Vendor" option at top
   – When existing code selected → loads that vendor's full data
     and fires onSelectExisting(vendor)
   – When "Add New" selected → fires onAddNew()
   – When typing a new code manually → just updates the value
══════════════════════════════════════════════════════════════ */
function VendorCodeCombobox({ value, onChange, onSelectExisting, onAddNew, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [codes, setCodes] = useState([]);       // { id, vendorCode, name }
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);   // fetching full vendor on select
  const wrapRef = useRef(null);

  // Load vendor codes on mount
  useEffect(() => {
    setLoading(true);
    api.getVendorCodes()
      .then(setCodes)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = codes.filter(
    (c) =>
      c.vendorCode.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelectExisting(codeItem) {
    setOpen(false);
    setSearch('');
    setFetching(true);
    try {
      const vendor = await api.getVendor(codeItem.id);
      onSelectExisting(vendor);
    } catch {
      // fallback: just set the code
      onChange(codeItem.vendorCode);
    } finally {
      setFetching(false);
    }
  }

  function handleAddNew() {
    setOpen(false);
    setSearch('');
    onAddNew();
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger input */}
      <div style={{ position: 'relative' }}>
        <input
          className="input pr-10"
          placeholder={fetching ? 'Loading…' : 'e.g. V-004 or select existing'}
          value={fetching ? '' : value}
          disabled={disabled || fetching}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { setSearch(''); setOpen(true); }}
          autoComplete="off"
          required
        />
        {fetching ? (
          <Loader2 size={15} className="animate-spin"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)' }} />
        ) : (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((o) => !o)}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: 'var(--color-ink-muted)',
            }}
          >
            <ChevronDown size={16} style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          zIndex: 100,
          overflow: 'hidden',
          maxHeight: 280,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search inside dropdown */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)' }} />
              <input
                autoFocus
                className="input"
                style={{ paddingLeft: 28, height: 32, fontSize: 13 }}
                placeholder="Search codes or names…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* ── Add New Vendor option ── */}
            <button
              type="button"
              onClick={handleAddNew}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: 13,
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-primary-strong)',
                fontWeight: 600,
              }}
            >
              <Plus size={14} />
              Add New Vendor
            </button>

            {/* ── Existing codes ── */}
            {loading ? (
              <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={13} className="animate-spin" /> Loading codes…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--color-ink-muted)' }}>
                {codes.length === 0 ? 'No vendors yet — add the first one!' : 'No codes match your search.'}
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectExisting(c)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '9px 14px',
                    background: value === c.vendorCode ? 'var(--color-primary-soft)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>
                      {c.vendorCode}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{c.name}</span>
                  </span>
                  {value === c.vendorCode && <Check size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VENDOR LIST
══════════════════════════════════════════════════════════════ */
function VendorList({ onSelect, onAdd, onDeleted }) {
  const [query, setQuery] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getVendors()
      .then(setVendors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(query.toLowerCase()) ||
    v.vendorCode.toLowerCase().includes(query.toLowerCase())
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
            placeholder="Search by name or code"
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

/* ══════════════════════════════════════════════════════════════
   ADD / EDIT VENDOR FORM
   – Vendor Code field is now a smart combobox
   – Selecting an existing code switches to Edit mode
   – Selecting "Add New Vendor" resets to Create mode
══════════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  vendorCode: '', name: '', contact: '', email: '',
  gstin: '', leadTimeDays: '', creditDays: '', address: '',
};

function VendorForm({ vendor: initialVendor, onSaved, onCancel }) {
  const [editingVendor, setEditingVendor] = useState(initialVendor || null);
  const isEdit = Boolean(editingVendor?.id);

  const [form, setForm] = useState(
    initialVendor
      ? {
        vendorCode: initialVendor.vendorCode || '',
        name: initialVendor.name || '',
        contact: initialVendor.contact || '',
        email: initialVendor.email || '',
        gstin: initialVendor.gstin || '',
        leadTimeDays: initialVendor.leadTimeDays || '',
        creditDays: initialVendor.creditDays || '',
        address: initialVendor.address || '',
      }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Called when user picks an existing vendor from the combobox
  function handleSelectExisting(vendor) {
    setEditingVendor(vendor);
    setForm({
      vendorCode: vendor.vendorCode || '',
      name: vendor.name || '',
      contact: vendor.contact || '',
      email: vendor.email || '',
      gstin: vendor.gstin || '',
      leadTimeDays: vendor.leadTimeDays || '',
      creditDays: vendor.creditDays || '',
      address: vendor.address || '',
    });
    setError(null);
    setSuccess(null);
  }

  // Called when user picks "Add New Vendor" from the combobox
  function handleAddNew() {
    setEditingVendor(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        creditDays: form.creditDays ? Number(form.creditDays) : undefined,
      };
      if (isEdit) {
        await api.updateVendor(editingVendor.id, payload);
        setSuccess(`${form.name} updated successfully!`);
      } else {
        const created = await api.createVendor(payload);
        setSuccess(`${created.name} (${created.vendorCode}) created!`);
        setForm({ ...EMPTY_FORM });
        setEditingVendor(null);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-semibold text-lg">
          {isEdit ? `Edit — ${editingVendor.name}` : 'Add New Vendor'}
        </h3>
        {isEdit && (
          <span className="badge-ok flex items-center gap-1">
            <Pencil size={11} /> Edit Mode
          </span>
        )}
      </div>
      <p className="text-sm text-ink-muted mb-5">
        {isEdit
          ? 'Editing existing vendor master data. Select a different code or "Add New Vendor" to switch.'
          : 'Select an existing vendor code to edit it, or type a new code to create one.'}
      </p>

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-sm"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary-strong)' }}>
          <Check size={15} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">

          {/* ── Vendor Code — Smart Combobox ── */}
          <div>
            <label className="label">
              Vendor Code <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <VendorCodeCombobox
              value={form.vendorCode}
              onChange={(val) => setForm((f) => ({ ...f, vendorCode: val }))}
              onSelectExisting={handleSelectExisting}
              onAddNew={handleAddNew}
              disabled={isEdit} /* code is locked in edit mode */
            />
            {isEdit && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
                Code is locked in edit mode. Pick a different code above to switch vendors.
              </p>
            )}
          </div>

          {/* ── Vendor Name ── */}
          <div>
            <label className="label">
              Vendor Name <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <input className="input" placeholder="Shreeji Plastics" value={form.name} onChange={update('name')} required />
          </div>

          {/* ── Contact ── */}
          <div>
            <label className="label">Contact Number</label>
            <input className="input" placeholder="+91 98200 11223" value={form.contact} onChange={update('contact')} />
          </div>

          {/* ── Email ── */}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="orders@vendor.com" value={form.email} onChange={update('email')} />
          </div>

          {/* ── GSTIN ── */}
          <div>
            <label className="label">GSTIN</label>
            <input className="input" placeholder="27ABCDE1234F1Z5" value={form.gstin} onChange={update('gstin')} />
          </div>

          {/* ── Lead Time ── */}
          <div>
            <label className="label">Standard Lead Time (days)</label>
            <input className="input" type="number" placeholder="10" value={form.leadTimeDays} onChange={update('leadTimeDays')} />
          </div>

          {/* ── Credit Days ── */}
          <div>
            <label className="label">Credit Days</label>
            <input className="input" type="number" placeholder="30" value={form.creditDays} onChange={update('creditDays')} />
          </div>

          {/* ── Address ── */}
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea className="textarea" rows={3} placeholder="Factory / warehouse address" value={form.address} onChange={update('address')} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : isEdit ? 'Update Vendor' : 'Create Vendor'}
          </button>
          <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
          {isEdit && (
            <button type="button" className="btn-ghost" onClick={handleAddNew}
              style={{ marginLeft: 'auto', color: 'var(--color-primary)' }}>
              <Plus size={14} /> Add New Instead
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   QUOTATION HISTORY
══════════════════════════════════════════════════════════════ */
function QuotationHistory({ quotes }) {
  const sorted = [...quotes].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const best = [...quotes].sort((a, b) => a.rate - b.rate)[0];

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

/* ══════════════════════════════════════════════════════════════
   PERFORMANCE SCORECARD
══════════════════════════════════════════════════════════════ */
function PerformanceScorecard() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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


export default function VendorMaster() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const goEdit = (vendor) => { setSelectedVendor(vendor); setActiveTab('edit'); };
  const goAdd = () => { setSelectedVendor(null); setActiveTab('edit'); };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Vendor Master</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Vendor Master</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
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

      {activeTab === 'list' && (
        <VendorList
          key={refreshKey}
          onSelect={goEdit}
          onAdd={goAdd}
          onDeleted={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {activeTab === 'edit' && (
        <VendorForm
          vendor={selectedVendor}
          onSaved={handleSaved}
          onCancel={() => { setActiveTab('list'); setSelectedVendor(null); }}
        />
      )}
      {activeTab === 'history' && <QuotationHistory quotes={MOCK_QUOTES} />}
      {activeTab === 'scorecard' && <PerformanceScorecard />}
    </div>
  );
}