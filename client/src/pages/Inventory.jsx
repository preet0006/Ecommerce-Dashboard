import React, { useState } from 'react';
import {
  Boxes, RefreshCw, Ship, AlertTriangle, ChevronRight, Search, PackageCheck
} from 'lucide-react';

/* ============================================================
   MOCK DATA — replace with API calls to your Inventory Engine
   endpoints (GET /api/inventory, GET /api/inventory/reorder, etc.)
   ============================================================ */

const MOCK_STOCK = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', warehouse: 'Bhiwandi', physical: 650, inTransit: 0, reserved: 40 },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', warehouse: 'Bhiwandi', physical: 180, inTransit: 800, reserved: 60 },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', warehouse: 'Delhi NCR', physical: 900, inTransit: 0, reserved: 20 },
  { sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', warehouse: 'Bhiwandi', physical: 90, inTransit: 400, reserved: 15 },
];

const MOCK_REORDER = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', stock: 650, sales30d: 500, daysCover: 39, suggestedOrder: 1000, orderDate: '2026-09-05', urgent: false },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', stock: 180, sales30d: 400, daysCover: 14, suggestedOrder: 800, orderDate: 'Order Now', urgent: true },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', stock: 900, sales30d: 300, daysCover: 90, suggestedOrder: 0, orderDate: 'Hold', urgent: false },
  { sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', stock: 90, sales30d: 180, daysCover: 15, suggestedOrder: 500, orderDate: 'Order Now', urgent: true },
];

const MOCK_IN_TRANSIT = [
  { poId: 'PO-2026-0142', sku: 'GF-CAS-001', qty: 2500, vendor: 'Shreeji Plastics', shippedDate: '2026-08-15', eta: '2026-09-02', status: 'On Water' },
  { poId: 'PO-2026-0140', sku: 'GF-BWL-014', qty: 800, vendor: 'Komal Packaging Co.', shippedDate: '2026-08-10', eta: '2026-08-24', status: 'Customs' },
  { poId: 'PO-2026-0138', sku: 'GF-CAS-005', qty: 400, vendor: 'Anand Steelware', shippedDate: '2026-08-05', eta: '2026-08-20', status: 'At Warehouse' },
];

const MOCK_DEAD_STOCK = [
  { sku: 'GF-STG-009', name: 'Storage Container Set', stock: 420, lastSaleDaysAgo: 74, value: 68000, action: 'Bundle offer' },
  { sku: 'GF-PET-006', name: 'Pet Feeder Large', stock: 210, lastSaleDaysAgo: 61, value: 31500, action: 'Clearance discount' },
  { sku: 'GF-CAS-003', name: 'Casserole Set (Discontinued)', stock: 85, lastSaleDaysAgo: 120, value: 42500, action: 'Liquidate' },
];

const TABS = [
  { id: 'stock', label: 'Stock Overview', icon: Boxes },
  { id: 'reorder', label: 'Reorder Recommendations', icon: RefreshCw },
  { id: 'transit', label: 'In-Transit Tracking', icon: Ship },
  { id: 'dead', label: 'Slow-moving / Dead Stock', icon: AlertTriangle },
];

/* ---------------- Stock Overview ---------------- */
function StockOverview({ rows }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.sku.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="card p-5 animate-enter">
      <div className="relative w-full max-w-sm mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input className="input pl-9" placeholder="Search by SKU or product name" value={query} onChange={(e) => setQuery(e.target.value)} />
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

/* ---------------- Reorder Recommendations ---------------- */
function ReorderRecommendations({ rows }) {
  return (
    <div className="flex flex-col gap-4 animate-enter">
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card">
          <span className="section-title">SKUs to Reorder Now</span>
          <span className="stat-figure">{rows.filter(r => r.urgent).length}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Total Suggested Units</span>
          <span className="stat-figure">{rows.reduce((s, r) => s + r.suggestedOrder, 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Avg Days Cover</span>
          <span className="stat-figure">{Math.round(rows.reduce((s, r) => s + r.daysCover, 0) / rows.length)}d</span>
        </div>
      </div>

      <div className="card p-5">
        <table className="table-clean">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th className="text-right">Stock</th>
              <th className="text-right">30-Day Sales</th>
              <th className="text-right">Days Cover</th>
              <th className="text-right">Suggested Order</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sku}>
                <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
                <td className="font-medium">{r.name}</td>
                <td className="text-right">{r.stock.toLocaleString('en-IN')}</td>
                <td className="text-right">{r.sales30d.toLocaleString('en-IN')}</td>
                <td className="text-right">{r.daysCover}d</td>
                <td className="text-right font-semibold">{r.suggestedOrder.toLocaleString('en-IN')}</td>
                <td>
                  {r.urgent
                    ? <span className="badge-danger">{r.orderDate}</span>
                    : r.orderDate === 'Hold'
                      ? <span className="badge">{r.orderDate}</span>
                      : <span className="badge-warn">{r.orderDate}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- In-Transit Tracking ---------------- */
function InTransitTracking({ rows }) {
  const statusStep = { 'On Water': 1, 'Customs': 2, 'At Warehouse': 3 };
  return (
    <div className="flex flex-col gap-4 animate-enter">
      {rows.map((r) => (
        <div key={r.poId} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-mono text-xs text-ink-muted">{r.poId}</span>
              <h4 className="font-medium">{r.sku} · {r.qty.toLocaleString('en-IN')} units · {r.vendor}</h4>
            </div>
            <span className="badge-warn">{r.status}</span>
          </div>
          <div className="flex items-center gap-2">
            {['Shipped', 'On Water', 'Customs', 'At Warehouse'].map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: i <= statusStep[r.status] ? 'var(--color-primary)' : 'var(--color-border)',
                      color: i <= statusStep[r.status] ? '#fff' : 'var(--color-ink-muted)',
                    }}
                  >
                    {i <= statusStep[r.status] ? <PackageCheck size={12} /> : i + 1}
                  </div>
                  <span className={i <= statusStep[r.status] ? 'text-ink' : 'text-ink-muted'}>{step}</span>
                </div>
                {i < 3 && <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-ink-muted mt-3">
            <span>Shipped: {r.shippedDate}</span>
            <span>ETA: {r.eta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Dead Stock Report ---------------- */
function DeadStockReport({ rows }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th className="text-right">Stock</th>
            <th>Last Sale</th>
            <th className="text-right">Value Tied Up</th>
            <th>Suggested Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sku}>
              <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
              <td className="font-medium">{r.name}</td>
              <td className="text-right">{r.stock.toLocaleString('en-IN')}</td>
              <td><span className="badge-danger">{r.lastSaleDaysAgo} days ago</span></td>
              <td className="text-right font-mono">₹{r.value.toLocaleString('en-IN')}</td>
              <td className="text-ink-muted">{r.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-sm text-ink-muted">Total capital tied up in slow-moving stock</span>
        <span className="font-mono font-semibold text-lg">₹{rows.reduce((s, r) => s + r.value, 0).toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Inventory</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Inventory</h1>

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

      {activeTab === 'stock' && <StockOverview rows={MOCK_STOCK} />}
      {activeTab === 'reorder' && <ReorderRecommendations rows={MOCK_REORDER} />}
      {activeTab === 'transit' && <InTransitTracking rows={MOCK_IN_TRANSIT} />}
      {activeTab === 'dead' && <DeadStockReport rows={MOCK_DEAD_STOCK} />}
    </div>
  );
}