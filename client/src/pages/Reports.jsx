import React, { useState } from 'react';
import {
  Trophy, TrendingDown, Truck, PieChart, Users, ChevronRight, Star
} from 'lucide-react';

/* ============================================================
   MOCK DATA — replace with API calls to your Reports endpoints
   (GET /api/reports/hero-products, GET /api/reports/channel, etc.)
   ============================================================ */

const MOCK_HERO = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', unitsSold: 4820, revenue: 4332180, profit: 1516263 },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', unitsSold: 3900, revenue: 971100, profit: 425000 },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', unitsSold: 3100, revenue: 1701900, profit: 431000 },
];

const MOCK_DEAD = [
  { sku: 'GF-STG-009', name: 'Storage Container Set', unitsSold: 12, daysSinceLastSale: 74 },
  { sku: 'GF-PET-006', name: 'Pet Feeder Large', unitsSold: 6, daysSinceLastSale: 61 },
  { sku: 'GF-CAS-003', name: 'Casserole Set (Discontinued)', unitsSold: 2, daysSinceLastSale: 120 },
];

const MOCK_VENDOR_PERF = [
  { vendor: 'Shreeji Plastics', poCount: 18, onTimePct: 96, rejectionPct: 1.8, avgRate: 502, spend: 1284000 },
  { vendor: 'Anand Steelware', poCount: 9, onTimePct: 89, rejectionPct: 3.2, avgRate: 122, spend: 342000 },
  { vendor: 'Komal Packaging Co.', poCount: 14, onTimePct: 98, rejectionPct: 0.9, avgRate: 34, spend: 156000 },
];

const MOCK_CHANNEL_PROFIT = [
  { channel: 'Amazon', revenue: 3120000, fees: 468000, ads: 312000, netProfit: 918000 },
  { channel: 'Flipkart', revenue: 1980000, fees: 267000, ads: 178000, netProfit: 542000 },
  { channel: 'Website', revenue: 940000, fees: 28000, ads: 94000, netProfit: 402000 },
];

const MOCK_CUSTOMERS = [
  { segment: 'Repeat (2+ orders)', customers: 1240, avgOrderValue: 890, lifetimeValue: 2340 },
  { segment: 'One-time buyers', customers: 6420, avgOrderValue: 610, lifetimeValue: 610 },
  { segment: 'High value (>₹5000 LTV)', customers: 180, avgOrderValue: 1450, lifetimeValue: 6820 },
];

const TABS = [
  { id: 'hero', label: 'Hero Products', icon: Trophy },
  { id: 'dead', label: 'Dead Products', icon: TrendingDown },
  { id: 'vendor', label: 'Vendor Performance', icon: Truck },
  { id: 'channel', label: 'Channel Profitability', icon: PieChart },
  { id: 'customers', label: 'Customer Insights', icon: Users },
];

/* ---------------- Hero Products ---------------- */
function HeroProducts({ rows }) {
  return (
    <div className="flex flex-col gap-4 animate-enter">
      {rows.map((r, i) => (
        <div key={r.sku} className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-strong)' }}>
            <Star size={18} fill="currentColor" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-muted">{r.sku}</span>
              <span className="font-medium">{r.name}</span>
            </div>
            <span className="text-sm text-ink-muted">#{i + 1} by profit this quarter</span>
          </div>
          <div className="flex items-center gap-8 text-right">
            <div>
              <span className="section-title block">Units Sold</span>
              <span className="font-mono font-semibold">{r.unitsSold.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="section-title block">Revenue</span>
              <span className="font-mono font-semibold">₹{(r.revenue / 100000).toFixed(1)}L</span>
            </div>
            <div>
              <span className="section-title block">Profit</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--color-primary-strong)' }}>₹{(r.profit / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Dead Products ---------------- */
function DeadProducts({ rows }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th className="text-right">Units Sold (90d)</th>
            <th>Last Sale</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sku}>
              <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
              <td className="font-medium">{r.name}</td>
              <td className="text-right">{r.unitsSold}</td>
              <td><span className="badge-danger">{r.daysSinceLastSale} days ago</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Vendor Performance Report ---------------- */
function VendorPerformanceReport({ rows }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
        <thead>
          <tr>
            <th>Vendor</th>
            <th className="text-right">POs Placed</th>
            <th>On-time %</th>
            <th>Rejection %</th>
            <th className="text-right">Avg Rate</th>
            <th className="text-right">Total Spend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.vendor}>
              <td className="font-medium">{v.vendor}</td>
              <td className="text-right">{v.poCount}</td>
              <td>{v.onTimePct >= 95 ? <span className="badge-ok">{v.onTimePct}%</span> : <span className="badge-warn">{v.onTimePct}%</span>}</td>
              <td>{v.rejectionPct < 2 ? <span className="badge-ok">{v.rejectionPct}%</span> : <span className="badge-warn">{v.rejectionPct}%</span>}</td>
              <td className="text-right font-mono">₹{v.avgRate}</td>
              <td className="text-right font-mono">₹{v.spend.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Channel Profitability ---------------- */
function ChannelProfitability({ rows }) {
  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      {rows.map((c) => (
        <div key={c.channel} className="card p-5 flex flex-col gap-4">
          <h3 className="font-display font-semibold">{c.channel}</h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">Revenue</span><span className="font-mono">₹{(c.revenue / 100000).toFixed(1)}L</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Marketplace Fees</span><span className="font-mono">₹{(c.fees / 100000).toFixed(1)}L</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Ads Spend</span><span className="font-mono">₹{(c.ads / 100000).toFixed(1)}L</span></div>
          </div>
          <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
            <span className="section-title">Net Profit</span>
            <span className="stat-figure" style={{ color: 'var(--color-primary-strong)' }}>₹{(c.netProfit / 100000).toFixed(1)}L</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Customer Insights ---------------- */
function CustomerInsights({ rows }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
        <thead>
          <tr>
            <th>Segment</th>
            <th className="text-right">Customers</th>
            <th className="text-right">Avg Order Value</th>
            <th className="text-right">Lifetime Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.segment}>
              <td className="font-medium">{c.segment}</td>
              <td className="text-right">{c.customers.toLocaleString('en-IN')}</td>
              <td className="text-right font-mono">₹{c.avgOrderValue}</td>
              <td className="text-right font-mono">₹{c.lifetimeValue.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function Reports() {
  const [activeTab, setActiveTab] = useState('hero');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Reports</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Reports</h1>

      <div className="flex items-center gap-1 mb-5 border-b flex-wrap" style={{ borderColor: 'var(--color-border)' }}>
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

      {activeTab === 'hero' && <HeroProducts rows={MOCK_HERO} />}
      {activeTab === 'dead' && <DeadProducts rows={MOCK_DEAD} />}
      {activeTab === 'vendor' && <VendorPerformanceReport rows={MOCK_VENDOR_PERF} />}
      {activeTab === 'channel' && <ChannelProfitability rows={MOCK_CHANNEL_PROFIT} />}
      {activeTab === 'customers' && <CustomerInsights rows={MOCK_CUSTOMERS} />}
    </div>
  );
}