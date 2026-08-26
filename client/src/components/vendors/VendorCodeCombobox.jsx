import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, ChevronDown, Check } from 'lucide-react';
import { api } from '../../lib/api';

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
export default function VendorCodeCombobox({ value, onChange, onSelectExisting, onAddNew, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.getVendorCodes()
      .then(setCodes)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

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
