import React, { useState, useMemo } from 'react';
import {
  Tags, SlidersHorizontal, ListChecks, History, ChevronRight,
  CheckCircle2, XCircle, Clock, TrendingDown, TrendingUp
} from 'lucide-react';

/* ============================================================
   MOCK DATA — replace with API calls to your Pricing Engine
   endpoints (GET /api/pricing, POST /api/pricing/simulate, etc.)
   ============================================================ */

const MOCK_CHANNEL_PRICING = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', amazon: 899, flipkart: 879, website: 949, landedCost: 585 },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', amazon: 549, flipkart: 559, website: 599, landedCost: 410 },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', amazon: 249, flipkart: 239, website: 279, landedCost: 140 },
  { sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', amazon: 1399, flipkart: 1379, website: 1449, landedCost: 1120 },
];

const MOCK_PRICE_APPROVALS = [
  { id: 'PC-2026-091', sku: 'GF-BWL-014', channel: 'Amazon', from: 549, to: 469, marginAfter: 18.6, requestedBy: 'Marketing Team' },
  { id: 'PC-2026-090', sku: 'GF-PET-002', channel: 'Website', from: 279, to: 249, marginAfter: 38.2, requestedBy: 'Sales Team' },
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

function marginPct(price, cost) {
  return ((price - cost) / price) * 100;
}

function marginBadge(pct) {
  if (pct >= 30) return <span className="badge-ok">{pct.toFixed(1)}%</span>;
  if (pct >= 20) return <span className="badge-warn">{pct.toFixed(1)}%</span>;
  return <span className="badge-danger">{pct.toFixed(1)}%</span>;
}

/* ---------------- Channel Pricing ---------------- */
function ChannelPricing({ rows }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
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
          {rows.map((r) => (
            <tr key={r.sku}>
              <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
              <td className="font-medium">{r.name}</td>
              <td className="text-right">₹{r.amazon}</td>
              <td className="text-right">₹{r.flipkart}</td>
              <td className="text-right">₹{r.website}</td>
              <td>{marginBadge(marginPct(r.amazon, r.landedCost))}</td>
              <td>{marginBadge(marginPct(r.flipkart, r.landedCost))}</td>
              <td>{marginBadge(marginPct(r.website, r.landedCost))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Discount Simulator ---------------- */
function DiscountSimulator({ rows }) {
  const [skuIdx, setSkuIdx] = useState(0);
  const [channel, setChannel] = useState('amazon');
  const [discountPct, setDiscountPct] = useState(10);
  const [expectedVolume, setExpectedVolume] = useState(300);

  const product = rows[skuIdx];
  const currentPrice = product[channel];
  const newPrice = Math.round(currentPrice * (1 - discountPct / 100));
  const marginAfter = marginPct(newPrice, product.landedCost);
  const monthlyProfit = (newPrice - product.landedCost) * Number(expectedVolume || 0);

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Simulate Discount</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">SKU</label>
            <select className="select" value={skuIdx} onChange={(e) => setSkuIdx(Number(e.target.value))}>
              {rows.map((r, i) => <option key={r.sku} value={i}>{r.sku} — {r.name}</option>)}
            </select>
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
            <input className="input" type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Expected Monthly Volume</label>
            <input className="input" type="number" value={expectedVolume} onChange={(e) => setExpectedVolume(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-6 col-span-2">
        <h3 className="font-display font-semibold text-lg mb-1">Impact Preview</h3>
        <p className="text-sm text-ink-muted mb-5">Nothing goes live until this is approved and published.</p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="kpi-card">
            <span className="section-title">Current Price</span>
            <span className="stat-figure">₹{currentPrice}</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">New Price</span>
            <span className="stat-figure">₹{newPrice}</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Margin After Discount</span>
            <span className="stat-figure">{marginAfter.toFixed(1)}%</span>
            <div>{marginBadge(marginAfter)}</div>
          </div>
          <div className="kpi-card">
            <span className="section-title">Projected Monthly Profit</span>
            <span className="stat-figure">₹{monthlyProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {marginAfter < 20 && (
          <div className="p-4 rounded-md mb-4 text-sm" style={{ background: 'var(--color-red-soft)', color: 'var(--color-red)' }}>
            This discount pushes margin below 20% — floor-price rule requires manager approval to publish.
          </div>
        )}

        <div className="flex items-center gap-2">
          <button className="btn-primary">Send for Approval</button>
          <button className="btn-outline">Reset</button>
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
    <div className="card p-5 animate-enter">
      <table className="table-clean">
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
              <td className="text-right">₹{r.from}</td>
              <td className="text-right font-medium">₹{r.to}</td>
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

      {activeTab === 'channel' && <ChannelPricing rows={MOCK_CHANNEL_PRICING} />}
      {activeTab === 'simulator' && <DiscountSimulator rows={MOCK_CHANNEL_PRICING} />}
      {activeTab === 'approval' && <PriceApprovalQueue items={MOCK_PRICE_APPROVALS} />}
      {activeTab === 'history' && <PriceHistory rows={MOCK_PRICE_HISTORY} />}
    </div>
  );
}