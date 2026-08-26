import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function StockOverview({ rows }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.sku.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="card p-5 animate-enter">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" placeholder="Search by SKU or product name" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <span className="text-xs text-ink-muted font-mono">{filtered.length} products</span>
      </div>
      <table className="table-clean">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Warehouse</th>
            <th className="text-right">Physical Stock</th>
            <th className="text-right">In-Transit</th>
            <th className="text-right">Reserved</th>
            <th className="text-right">Available</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.sku}>
              <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
              <td className="font-medium">{r.name}</td>
              <td>{r.warehouse}</td>
              <td className="text-right">{r.physical.toLocaleString('en-IN')}</td>
              <td className="text-right">{r.inTransit.toLocaleString('en-IN')}</td>
              <td className="text-right">{r.reserved.toLocaleString('en-IN')}</td>
              <td className="text-right font-semibold">{(r.physical + r.inTransit - r.reserved).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
