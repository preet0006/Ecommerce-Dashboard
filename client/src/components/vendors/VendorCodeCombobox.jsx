import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, ChevronDown, Check, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

export default function VendorCodeCombobox({ value, onChange, onSelectExisting, onAddNew, isEdit }) {
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
      .catch(() => {})
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

  const exactMatch = codes.find(
    (c) => c.vendorCode.toUpperCase() === (value || search).trim().toUpperCase()
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

  function handleAddNewCode() {
    setOpen(false);
    setSearch('');
    onAddNew();
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <input
          className="input pr-10 font-mono font-semibold"
          placeholder={fetching ? 'Loading vendor…' : 'e.g. V-003, V-NEW, or type any code'}
          value={fetching ? '' : value || ''}
          onChange={(e) => {
            const rawVal = e.target.value.toUpperCase();
            onChange(rawVal);
            setSearch(rawVal);
            setOpen(true);
          }}
          onFocus={() => {
            setSearch(value || '');
            setOpen(true);
          }}
          autoComplete="off"
          required
        />
        {fetching ? (
          <Loader2
            size={15}
            className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        ) : (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((o) => !o)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink cursor-pointer"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-surface border border-border rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col animate-enter">
          {/* Quick Add Option */}
          <button
            type="button"
            onClick={handleAddNewCode}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-primary bg-primary-soft/50 hover:bg-primary hover:text-white transition-colors border-b border-border text-left"
          >
            <Plus size={13} />
            <span>Create As New Vendor Code</span>
          </button>

          {/* Existing Codes List */}
          <div className="overflow-y-auto flex-1 divide-y divide-border/60">
            {loading ? (
              <div className="p-3 text-xs text-ink-muted flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-primary" /> Loading existing codes…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-xs text-ink-muted flex flex-col gap-1">
                <span>No existing vendor matches <strong>"{search}"</strong>.</span>
                <span className="text-[11px] text-primary font-medium">✓ You are creating a new vendor with this code.</span>
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = value === c.vendorCode;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectExisting(c)}
                    className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors hover:bg-surface-raised ${
                      isSelected ? 'bg-primary-soft font-semibold text-primary' : 'text-ink'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-ink">{c.vendorCode}</div>
                      <div className="text-[11px] text-ink-muted">{c.name}</div>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
