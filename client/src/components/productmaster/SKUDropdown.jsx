import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, ChevronDown } from 'lucide-react';

/* ── Smart SKU Dropdown ── */
export default function SKUDropdown({ products, value, onSelect, onAddProduct, onEditProduct }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref               = React.useRef(null);

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
