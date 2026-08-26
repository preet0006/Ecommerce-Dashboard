import React, { useState } from 'react';
import { Search, Plus, Pencil, Trash2, FileSpreadsheet } from 'lucide-react';
import { marginBadge } from './utils';

export default function ProductList({ products, onSelect, onAddNew, onViewCost, onDownload }) {
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
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={onDownload}>
            <FileSpreadsheet size={15} /> Download CSV
          </button>
          <button className="btn-primary" onClick={onAddNew}>
            <Plus size={15} /> Add Product
          </button>
        </div>
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
          {filtered.map((p) => {
            const sp = Number(p.sellingPrice) || 0;
            const lc = Number(p.landedCost) || 0;
            const autoContributionPct = sp > 0 ? ((sp - lc) / sp) * 100 : (Number(p.contributionPct) || 0);

            return (
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
                <td>₹{Number(p.mrp || 0).toLocaleString('en-IN')}</td>
                <td>₹{sp.toLocaleString('en-IN')}</td>
                <td>₹{lc.toLocaleString('en-IN')}</td>
                <td>{marginBadge(autoContributionPct)}</td>
                <td>{Number(p.stock || 0).toLocaleString('en-IN')}</td>
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
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-ink-muted py-8">
                No products match "{query}".
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="text-xs text-ink-muted mt-3 text-center">
        💡 Click any row to view its Cost Breakdown
      </p>
    </div>
  );
}
