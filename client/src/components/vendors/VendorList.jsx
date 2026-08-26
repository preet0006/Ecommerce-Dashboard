import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { scoreBadge, LoadingRow, ErrorBanner } from './utils';

/* ══════════════════════════════════════════════════════════════
   VENDOR LIST
══════════════════════════════════════════════════════════════ */
export default function VendorList({ onSelect, onAdd, onDeleted }) {
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
