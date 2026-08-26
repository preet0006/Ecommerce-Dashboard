import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Tags, SlidersHorizontal, ListChecks, History, ChevronRight,
  CheckCircle2, XCircle, Clock, TrendingDown, TrendingUp, Search, ExternalLink
} from 'lucide-react';
import { UNIFIED_PRODUCTS, marginPct } from '../lib/productsData';
import {
  createPriceChangeRequest,
  getPriceChanges,
  decidePriceChange
} from '../lib/api';

/* ============================================================
   PRICING & DISCOUNTS
   Uses unified product schema + Real Email/Dashboard Price Change Engine
   ============================================================ */

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
function ChannelPricing({ rows, priceOverrides = {} }) {
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
              const amazonPrice = priceOverrides[`${r.sku}-amazon`] ?? (r.amazon ?? r.sellingPrice);
              const flipkartPrice = priceOverrides[`${r.sku}-flipkart`] ?? (r.flipkart ?? r.sellingPrice);
              const websitePrice = priceOverrides[`${r.sku}-website`] ?? (r.website ?? r.sellingPrice);
              const cost = r.landedCost ?? r.costPrice ?? 0;

              const hasAmazonOverride = priceOverrides[`${r.sku}-amazon`] != null;
              const hasFlipkartOverride = priceOverrides[`${r.sku}-flipkart`] != null;
              const hasWebsiteOverride = priceOverrides[`${r.sku}-website`] != null;

              return (
                <tr key={r.sku}>
                  <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
                  <td className="font-medium">{r.name}</td>
                  <td className={`text-right font-mono ${hasAmazonOverride ? 'text-primary font-bold' : ''}`}>
                    ₹{amazonPrice}
                  </td>
                  <td className={`text-right font-mono ${hasFlipkartOverride ? 'text-primary font-bold' : ''}`}>
                    ₹{flipkartPrice}
                  </td>
                  <td className={`text-right font-mono ${hasWebsiteOverride ? 'text-primary font-bold' : ''}`}>
                    ₹{websitePrice}
                  </td>
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
function DiscountSimulator({ rows, onSubmitted }) {
  const [selectedSku, setSelectedSku] = useState(rows[0]?.sku || 'GF-CAS-001');
  const [channel, setChannel] = useState('amazon');
  const [discountPct, setDiscountPct] = useState(10);
  const [expectedVolume, setExpectedVolume] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState(null); // 'success' | 'error' | null

  const product = rows.find(r => r.sku === selectedSku) || rows[0];
  const currentPrice = product ? (product[channel] ?? product.sellingPrice ?? 0) : 0;
  const cost = product ? (product.landedCost ?? product.costPrice ?? 0) : 0;
  const newPrice = Math.round(currentPrice * (1 - discountPct / 100));
  const marginAfter = marginPct(newPrice, cost);
  const monthlyProfit = (newPrice - cost) * Number(expectedVolume || 0);

  const handleSendForApproval = async () => {
    try {
      setIsSubmitting(true);
      setSubmitState(null);
      await createPriceChangeRequest({
        sku: product.sku,
        productName: product.name,
        channel,
        fromPrice: currentPrice,
        toPrice: newPrice,
        marginAfterPct: Number(marginAfter.toFixed(2)),
        requestedBy: 'Discount Simulator',
      });
      setSubmitState('success');
      if (onSubmitted) onSubmitted();
      setTimeout(() => setSubmitState(null), 4000);
    } catch (err) {
      console.error('[handleSendForApproval error]', err);
      setSubmitState('error');
      setTimeout(() => setSubmitState(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={handleSendForApproval}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Sending Approval Request…'
            ) : submitState === 'success' ? (
              <>
                <CheckCircle2 size={16} /> Sent for Approval ✓
              </>
            ) : submitState === 'error' ? (
              'Failed to Send — Retry'
            ) : (
              'Send for Approval'
            )}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setDiscountPct(10)}
            disabled={isSubmitting}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Price Change Approval Queue ---------------- */
function PriceApprovalQueue({ items = [], onDecided, isLoading = false }) {
  const [decidingId, setDecidingId] = useState(null);

  const handleDecision = async (id, action) => {
    try {
      setDecidingId(id);
      await decidePriceChange(id, action);
      if (onDecided) onDecided();
    } catch (err) {
      console.error('[handleDecision error]', err);
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-enter">
      {isLoading ? (
        <div className="card p-8 text-center text-ink-muted">Loading pending approval requests...</div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">No price changes waiting for approval.</div>
      ) : (
        items.map((item) => {
          const fromPrice = Number(item.fromPrice ?? item.from ?? 0);
          const toPrice = Number(item.toPrice ?? item.to ?? 0);
          const margin = Number(item.marginAfterPct ?? item.marginAfter ?? 0);
          const pct = fromPrice > 0 ? (((toPrice - fromPrice) / fromPrice) * 100).toFixed(1) : 0;
          const isDeciding = decidingId === item.id;

          return (
            <div key={item.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-ink-muted">PC-{item.id}</span>
                  <span className="font-medium">{item.sku}</span>
                  {item.productName && <span className="text-sm text-ink-muted">({item.productName})</span>}
                  <span className="badge capitalize">{item.channel}</span>
                  {item.emailPreviewUrl && (
                    <a
                      href={item.emailPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline ml-2"
                    >
                      <ExternalLink size={12} /> View Email Preview
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-ink-muted flex-wrap">
                  <span>₹{fromPrice} → <strong className="text-ink">₹{toPrice}</strong></span>
                  <span className="flex items-center gap-1">
                    {toPrice < fromPrice ? <TrendingDown size={14} className="text-red" /> : <TrendingUp size={14} className="text-primary" />}
                    {pct}%
                  </span>
                  {marginBadge(margin)}
                  <span>Requested by: {item.requestedBy || 'Team'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="btn-outline flex items-center gap-1.5"
                  onClick={() => handleDecision(item.id, 'reject')}
                  disabled={isDeciding}
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  type="button"
                  className="btn-primary flex items-center gap-1.5"
                  onClick={() => handleDecision(item.id, 'approve')}
                  disabled={isDeciding}
                >
                  <CheckCircle2 size={16} /> Approve & Publish
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ---------------- Price History ---------------- */
function PriceHistory({ rows = [], isLoading = false }) {
  return (
    <div className="card p-5 animate-enter overflow-x-auto">
      {isLoading ? (
        <div className="p-8 text-center text-ink-muted">Loading price change history...</div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-ink-muted">No price change history recorded yet.</div>
      ) : (
        <table className="table-clean w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>SKU</th>
              <th>Channel</th>
              <th className="text-right">From</th>
              <th className="text-right">To</th>
              <th>Change</th>
              <th>Status</th>
              <th>Decided Via / By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const fromPrice = Number(r.fromPrice ?? r.from ?? 0);
              const toPrice = Number(r.toPrice ?? r.to ?? 0);
              const pct = fromPrice > 0 ? (((toPrice - fromPrice) / fromPrice) * 100).toFixed(1) : 0;
              const dateDisplay = r.decidedAt
                ? new Date(r.decidedAt).toISOString().split('T')[0]
                : r.createdAt
                ? new Date(r.createdAt).toISOString().split('T')[0]
                : r.date || '—';

              const byDisplay = r.decidedVia === 'email'
                ? 'Approved via email'
                : r.decidedVia === 'dashboard'
                ? 'Dashboard'
                : r.by || r.requestedBy || 'Team';

              const isApproved = r.status === 'approved';

              return (
                <tr key={r.id || i}>
                  <td className="text-ink-muted">{dateDisplay}</td>
                  <td className="font-mono text-xs">{r.sku}</td>
                  <td><span className="badge capitalize">{r.channel}</span></td>
                  <td className="text-right font-mono">₹{fromPrice}</td>
                  <td className="text-right font-mono font-medium">₹{toPrice}</td>
                  <td className="flex items-center gap-1">
                    {toPrice < fromPrice ? (
                      <span className="flex items-center gap-1 text-red text-sm">
                        <TrendingDown size={14} />{Math.abs(pct)}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-primary text-sm">
                        <TrendingUp size={14} />{pct}%
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={isApproved ? 'badge-ok capitalize' : 'badge-danger capitalize'}>
                      {r.status || 'approved'}
                    </span>
                  </td>
                  <td className="text-ink-muted">{byDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- Main Page ---------------- */
export default function PricingDiscounts() {
  const [activeTab, setActiveTab] = useState('channel');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch approved price overrides to apply to Channel Pricing
  const fetchApprovedOverrides = useCallback(async () => {
    try {
      const data = await getPriceChanges('approved');
      if (Array.isArray(data)) {
        const overrides = {};
        data.forEach(item => {
          if (item.sku && item.channel && item.toPrice != null) {
            overrides[`${item.sku}-${item.channel.toLowerCase()}`] = Number(item.toPrice);
          }
        });
        setPriceOverrides(overrides);
      }
    } catch (err) {
      console.error('[fetchApprovedOverrides error]', err);
    }
  }, []);

  // Fetch pending approvals for Queue
  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoadingApprovals(true);
      const data = await getPriceChanges('pending');
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[fetchPendingApprovals error]', err);
    } finally {
      setLoadingApprovals(false);
    }
  }, []);

  // Fetch all price changes for History
  const fetchPriceHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await getPriceChanges();
      if (Array.isArray(data)) {
        setPriceHistory(data.filter(item => item.status !== 'pending'));
      }
    } catch (err) {
      console.error('[fetchPriceHistory error]', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // On mount: fetch approved overrides
  useEffect(() => {
    fetchApprovedOverrides();
  }, [fetchApprovedOverrides]);

  // When tab changes, fetch relevant data
  useEffect(() => {
    if (activeTab === 'approval') {
      fetchPendingApprovals();
    } else if (activeTab === 'history') {
      fetchPriceHistory();
    } else if (activeTab === 'channel') {
      fetchApprovedOverrides();
    }
  }, [activeTab, fetchPendingApprovals, fetchPriceHistory, fetchApprovedOverrides]);

  const handleDecisionComplete = () => {
    fetchPendingApprovals();
    fetchApprovedOverrides();
  };

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
              {tab.id === 'approval' && pendingApprovals.length > 0 && (
                <span className="badge-warn ml-1.5 text-xs px-1.5 py-0.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'channel' && (
        <ChannelPricing rows={UNIFIED_PRODUCTS} priceOverrides={priceOverrides} />
      )}
      {activeTab === 'simulator' && (
        <DiscountSimulator
          rows={UNIFIED_PRODUCTS}
          onSubmitted={() => {
            fetchPendingApprovals();
            fetchApprovedOverrides();
          }}
        />
      )}
      {activeTab === 'approval' && (
        <PriceApprovalQueue
          items={pendingApprovals}
          isLoading={loadingApprovals}
          onDecided={handleDecisionComplete}
        />
      )}
      {activeTab === 'history' && (
        <PriceHistory
          rows={priceHistory}
          isLoading={loadingHistory}
        />
      )}
    </div>
  );
}