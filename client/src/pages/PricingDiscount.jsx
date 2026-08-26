import React, { useState, useMemo } from 'react';
import {
  Tags, SlidersHorizontal, ListChecks, History, ChevronRight,
  CheckCircle2, XCircle, Clock, TrendingDown, TrendingUp, Search
} from 'lucide-react';
import { UNIFIED_PRODUCTS, marginPct } from '../lib/productsData';

/* ============================================================
   PRICING & DISCOUNTS
   Uses unified product schema (UNIFIED_PRODUCTS)
   ============================================================ */

const MOCK_PRICE_APPROVALS = [
  { id: 'PC-2026-091', sku: 'GF-BWL-014', channel: 'Amazon', from: 549, to: 469, marginAfter: 18.6, requestedBy: 'Marketing Team' },
  { id: 'PC-2026-090', sku: 'GF-PET-002', channel: 'Website', from: 279, to: 249, marginAfter: 38.2, requestedBy: 'Sales Team' },
  { id: 'PC-2026-089', sku: 'GF-CAS-005', channel: 'Flipkart', from: 1379, to: 1299, marginAfter: 13.8, requestedBy: 'Promotions Lead' },
];

const MOCK_PRICE_HISTORY = [
  { date: '2026-08-18', sku: 'GF-CAS-001', channel: 'Amazon', from: 949, to: 899, by: 'A. Sharma' },
  { date: '2026-08-05', sku: 'GF-PET-002', channel: 'Flipkart', from: 259, to: 239, by: 'R. Iyer' },
  { date: '2026-07-22', sku: 'GF-CAS-005', channel: 'Website', from: 1499, to: 1449, by: 'A. Sharma' },
  { date: '2026-07-10', sku: 'GF-BWL-014', channel: 'Amazon', from: 599, to: 549, by: 'System (rule)' },
];

const TABS = [
  { id: 'channel', label: 'Channel Pricing', icon: Tags },
  { id: 'simulator', label: 'Discount Simulator', icon: SlidersHorizontal },
  { id: 'approval', label: 'Price Change Approval', icon: ListChecks },
  { id: 'history', label: 'Price History', icon: History },
];

function marginBadge(pct) {
  if (pct >= 30) return <span className="badge-ok">{pct.toFixed(1)}%</span>;
  if (pct >= 20) return <span className="badge-warn">{pct.toFixed(1)}%</span>;
  return <span className="badge-danger">{pct.toFixed(1)}%</span>;
}

/* ---------------- Channel Pricing ---------------- */
function ChannelPricing({ rows }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      r => r.sku.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || (r.category && r.category.toLowerCase().includes(q))
    );
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-4 animate-enter">
      {/* Search Header */}
      <div className="card p-3 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            className="input pl-9 w-full"
            placeholder="Search by SKU or product name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="text-xs text-ink-muted font-mono">
          Showing {filtered.length} of {rows.length} products
        </div>
      </div>

      <div className="card p-5 overflow-x-auto">
        <table className="table-clean w-full">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th className="text-right">Amazon</th>
              <th className="text-right">Flipkart</th>
              <th className="text-right">Website</th>
              <th>Amazon Margin</th>
              <th>Flipkart Margin</th>
              <th>Website Margin</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const amazonPrice = r.amazon ?? r.sellingPrice;
              const flipkartPrice = r.flipkart ?? r.sellingPrice;
              const websitePrice = r.website ?? r.sellingPrice;
              const cost = r.landedCost ?? r.costPrice ?? 0;

              return (
                <tr key={r.sku}>
                  <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
                  <td className="font-medium">{r.name}</td>
                  <td className="text-right font-mono">₹{amazonPrice}</td>
                  <td className="text-right font-mono">₹{flipkartPrice}</td>
                  <td className="text-right font-mono">₹{websitePrice}</td>
                  <td>{marginBadge(marginPct(amazonPrice, cost))}</td>
                  <td>{marginBadge(marginPct(flipkartPrice, cost))}</td>
                  <td>{marginBadge(marginPct(websitePrice, cost))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Custom Downward SKU Selector ---------------- */
function SkuSelect({ rows, selectedSku, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      r => r.sku.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const current = rows.find(r => r.sku === selectedSku) || rows[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input flex items-center justify-between gap-2 w-full text-left cursor-pointer"
        onClick={() => setOpen(prev => !prev)}
      >
        <span className="font-medium text-sm text-ink truncate">
          <span className="font-mono text-xs text-ink-muted mr-1.5">{current?.sku}</span>
          {current?.name}
        </span>
        <span className="text-xs text-ink-muted shrink-0">▼</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-xl border overflow-hidden"
          style={{
            background: 'var(--color-surface, #ffffff)',
            borderColor: 'var(--color-border)',
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="p-2 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                autoFocus
                type="text"
                className="input pl-8 text-xs h-8 w-full"
                placeholder="Type to filter 50 SKUs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-ink-muted">No matching SKU found</div>
            ) : (
              filtered.map((r) => {
                const isSelected = r.sku === current?.sku;
                return (
                  <button
                    key={r.sku}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors hover:bg-black/5"
                    style={isSelected ? { background: 'var(--color-primary-soft, rgba(15,118,110,0.08))' } : {}}
                    onClick={() => {
                      onSelect(r.sku);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <div className="truncate">
                      <div className="font-mono font-medium text-ink">{r.sku}</div>
                      <div className="text-ink-muted truncate">{r.name}</div>
                    </div>
                    {isSelected && <span className="text-primary font-bold text-xs">✓</span>}
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

/* ---------------- Discount Simulator ---------------- */
function DiscountSimulator({ rows }) {
  const [selectedSku, setSelectedSku] = useState(rows[0]?.sku || 'GF-CAS-001');
  const [channel, setChannel] = useState('amazon');
  const [discountPct, setDiscountPct] = useState(10);
  const [expectedVolume, setExpectedVolume] = useState(300);

  const product = rows.find(r => r.sku === selectedSku) || rows[0];
  const currentPrice = product ? (product[channel] ?? product.sellingPrice ?? 0) : 0;
  const cost = product ? (product.landedCost ?? product.costPrice ?? 0) : 0;
  const newPrice = Math.round(currentPrice * (1 - discountPct / 100));
  const marginAfter = marginPct(newPrice, cost);
  const monthlyProfit = (newPrice - cost) * Number(expectedVolume || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-enter">
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Simulate Discount</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">SKU / Product</label>
            <SkuSelect
              rows={rows}
              selectedSku={selectedSku}
              onSelect={(sku) => setSelectedSku(sku)}
            />
          </div>
          <div>
            <label className="label">Channel</label>
            <select className="select" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
              <option value="website">Website</option>
            </select>
          </div>
          <div>
            <label className="label">Proposed Discount %</label>
            <input className="input" type="number" min="0" max="90" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Expected Monthly Volume</label>
            <input className="input" type="number" min="1" value={expectedVolume} onChange={(e) => setExpectedVolume(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-6 lg:col-span-2">
        <h3 className="font-display font-semibold text-lg mb-1">Impact Preview</h3>
        <p className="text-sm text-ink-muted mb-5">
          Simulated channel impact for <strong className="text-ink">{product?.name} ({product?.sku})</strong>.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="kpi-card">
            <span className="section-title">Current Channel Price</span>
            <span className="stat-figure">₹{currentPrice}</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">New Price After Discount</span>
            <span className="stat-figure">₹{newPrice}</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Margin After Discount</span>
            <span className="stat-figure">{marginAfter.toFixed(1)}%</span>
            <div className="mt-1">{marginBadge(marginAfter)}</div>
          </div>
          <div className="kpi-card">
            <span className="section-title">Projected Monthly Profit</span>
            <span className="stat-figure">₹{monthlyProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {marginAfter < 20 && (
          <div className="p-4 rounded-md mb-4 text-sm" style={{ background: 'var(--color-red-soft)', color: 'var(--color-red)' }}>
            This discount pushes margin below 20% floor — manager approval will be required to publish.
          </div>
        )}

        <div className="flex items-center gap-2">
          <button className="btn-primary">Send for Approval</button>
          <button className="btn-outline" onClick={() => setDiscountPct(10)}>Reset</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Price Change Approval ---------------- */
function PriceApprovalQueue({ items }) {
  const [decisions, setDecisions] = useState({});
  const decide = (id, decision) => setDecisions((d) => ({ ...d, [id]: decision }));

  return (
    <div className="flex flex-col gap-4 animate-enter">
      {items.length === 0 && <div className="card p-8 text-center text-ink-muted">No price changes waiting for approval.</div>}
      {items.map((item) => (
        <div key={item.id} className="card p-5 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-ink-muted">{item.id}</span>
              <span className="font-medium">{item.sku}</span>
              <span className="badge">{item.channel}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-muted">
              <span>₹{item.from} → ₹{item.to}</span>
              <span className="flex items-center gap-1">
                {item.to < item.from ? <TrendingDown size={14} className="text-red" /> : <TrendingUp size={14} className="text-primary" />}
                {(((item.to - item.from) / item.from) * 100).toFixed(1)}%
              </span>
              {marginBadge(item.marginAfter)}
              <span>Requested by: {item.requestedBy}</span>
            </div>
          </div>

          {decisions[item.id] ? (
            <span className={decisions[item.id] === 'approved' ? 'badge-ok' : 'badge-danger'}>
              {decisions[item.id] === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button className="btn-outline" onClick={() => decide(item.id, 'rejected')}><XCircle size={16} /> Reject</button>
              <button className="btn-primary" onClick={() => decide(item.id, 'approved')}><CheckCircle2 size={16} /> Approve & Publish</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Price History ---------------- */
function PriceHistory({ rows }) {
  return (
    <div className="card p-5 animate-enter overflow-x-auto">
      <table className="table-clean w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>SKU</th>
            <th>Channel</th>
            <th className="text-right">From</th>
            <th className="text-right">To</th>
            <th>Change</th>
            <th>Changed By</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="text-ink-muted">{r.date}</td>
              <td className="font-mono text-xs">{r.sku}</td>
              <td><span className="badge">{r.channel}</span></td>
              <td className="text-right font-mono">₹{r.from}</td>
              <td className="text-right font-mono font-medium">₹{r.to}</td>
              <td className="flex items-center gap-1">
                {r.to < r.from
                  ? <span className="flex items-center gap-1 text-red text-sm"><TrendingDown size={14} />{(((r.from - r.to) / r.from) * 100).toFixed(1)}%</span>
                  : <span className="flex items-center gap-1 text-primary text-sm"><TrendingUp size={14} />{(((r.to - r.from) / r.from) * 100).toFixed(1)}%</span>}
              </td>
              <td className="text-ink-muted">{r.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function PricingDiscounts() {
  const [activeTab, setActiveTab] = useState('channel');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Pricing & Discounts</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Pricing & Discounts</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active ? { borderBottom: '2px solid var(--color-primary)' } : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'channel' && <ChannelPricing rows={UNIFIED_PRODUCTS} />}
      {activeTab === 'simulator' && <DiscountSimulator rows={UNIFIED_PRODUCTS} />}
      {activeTab === 'approval' && <PriceApprovalQueue items={MOCK_PRICE_APPROVALS} />}
      {activeTab === 'history' && <PriceHistory rows={MOCK_PRICE_HISTORY} />}
    </div>
  );
}