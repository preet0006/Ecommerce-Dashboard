import React, { useState } from 'react';
import { Pencil, Trash2, Plus, CheckCircle2, X } from 'lucide-react';
import { marginBadge } from './utils';

const DEFAULT_COST_ROWS = [
  { id: 1, label: 'Vendor basic price',       value: 500 },
  { id: 2, label: 'GST',                       value: 90  },
  { id: 3, label: 'Inward freight allocation', value: 25  },
  { id: 4, label: 'Corrugated packaging',      value: 35  },
  { id: 5, label: 'Label / barcode',           value: 5   },
  { id: 6, label: 'Inspection / handling',     value: 10  },
  { id: 7, label: 'Damage provision',          value: 10  },
];

export default function CostBreakdown({ product }) {
  const [rows,      setRows]      = useState(DEFAULT_COST_ROWS);
  const [editingId, setEditingId] = useState(null);
  const [draft,     setDraft]     = useState({});
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

            <tr style={{ borderTop: '2px solid var(--color-border)' }}>
              <td className="font-semibold">Landed cost</td>
              <td className="text-right font-mono font-semibold">₹{landedCost.toLocaleString('en-IN')}</td>
              <td />
            </tr>
          </tbody>
        </table>

        <button
          className="btn-outline text-sm mt-4 w-full"
          onClick={addRow}
        >
          <Plus size={14} /> Add Cost Field
        </button>
      </div>

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
