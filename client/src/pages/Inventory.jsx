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

/* ── AI Reorder data — each field feeds the scoring engine ── */
const MOCK_REORDER = [
  {
    sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', category: 'Casserole',
    stock: 650, inTransit: 0, reserved: 40,
    sales30d: 500, sales7d: 140,
    leadTimeDays: 21, safetyStockDays: 7,
    landedCost: 585, sellingPrice: 899,
    orderDate: '2026-09-05',
    riskReasons: ['Festive season ahead', 'Vendor lead time 21d'],
  },
  {
    sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', category: 'Bowl',
    stock: 180, inTransit: 800, reserved: 60,
    sales30d: 400, sales7d: 130,
    leadTimeDays: 14, safetyStockDays: 5,
    landedCost: 410, sellingPrice: 549,
    orderDate: 'Order Now',
    riskReasons: ['Stock below reorder point', 'High 7-day velocity'],
  },
  {
    sku: 'GF-PET-002', name: 'Pet Bowl Steel', category: 'Pet Accessories',
    stock: 900, inTransit: 0, reserved: 20,
    sales30d: 300, sales7d: 65,
    leadTimeDays: 18, safetyStockDays: 5,
    landedCost: 140, sellingPrice: 249,
    orderDate: 'Hold',
    riskReasons: ['Overstocked — 90d cover'],
  },
  {
    sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', category: 'Casserole',
    stock: 90, inTransit: 400, reserved: 15,
    sales30d: 180, sales7d: 62,
    leadTimeDays: 12, safetyStockDays: 4,
    landedCost: 1120, sellingPrice: 1399,
    orderDate: 'Order Now',
    riskReasons: ['Near stockout', 'Transit qty may not arrive in time'],
  },
];

/* ── AI scoring engine (pure, no external deps) ── */
function computeAI(r) {
  const dailyVelocity    = r.sales30d / 30;
  const velocity7d       = r.sales7d  / 7;
  const trend            = dailyVelocity > 0 ? ((velocity7d - dailyVelocity) / dailyVelocity) * 100 : 0;
  const availableStock   = r.stock + r.inTransit - r.reserved;
  const daysCover        = dailyVelocity > 0 ? availableStock / dailyVelocity : 999;
  const reorderPoint     = (dailyVelocity * r.leadTimeDays) + (dailyVelocity * r.safetyStockDays);
  const targetStock      = dailyVelocity * (r.leadTimeDays + 30 + r.safetyStockDays);
  const suggestedOrder   = Math.max(0, Math.round(targetStock - availableStock));
  const orderValue       = suggestedOrder * r.landedCost;
  const margin           = r.sellingPrice > 0 ? ((r.sellingPrice - r.landedCost) / r.sellingPrice) * 100 : 0;

  let urgency, urgencyColor, urgencyBg;
  if (daysCover <= r.leadTimeDays || r.orderDate === 'Order Now') {
    urgency = 'Critical';  urgencyColor = '#B23A34'; urgencyBg = '#FBEAE8';
  } else if (daysCover <= r.leadTimeDays + r.safetyStockDays + 7) {
    urgency = 'Warning';   urgencyColor = '#B9791E'; urgencyBg = '#FBF1DF';
  } else if (r.orderDate === 'Hold' || suggestedOrder === 0) {
    urgency = 'Hold';      urgencyColor = '#5B6B62'; urgencyBg = '#F0F3EF';
  } else {
    urgency = 'Planned';   urgencyColor = '#1F6E4C'; urgencyBg = '#E7F2EC';
  }

  let confidence = 60;
  if (Math.abs(trend) > 15)  confidence += 15;
  if (r.sales30d > 200)      confidence += 10;
  if (r.leadTimeDays <= 14)  confidence += 10;
  if (r.riskReasons.length > 1) confidence -= 5;
  confidence = Math.min(95, Math.max(40, confidence));

  const coverBarPct   = Math.min(100, (daysCover / 60) * 100);
  const coverBarColor = daysCover <= r.leadTimeDays ? '#B23A34'
    : daysCover <= 30 ? '#B9791E' : '#1F6E4C';

  return {
    dailyVelocity, velocity7d, trend,
    availableStock, daysCover: Math.round(daysCover),
    reorderPoint: Math.round(reorderPoint),
    suggestedOrder, orderValue, margin,
    urgency, urgencyColor, urgencyBg,
    confidence, coverBarPct, coverBarColor,
  };
}

/* ---------------- Reorder Recommendations ---------------- */
function ReorderRecommendations({ rows }) {
  const [sortBy, setSortBy]       = useState('urgency');
  const [expandedSku, setExpandedSku] = useState(null);

  const enriched = rows.map(r => ({ ...r, ai: computeAI(r) }));
  const urgencyOrder = { Critical: 0, Warning: 1, Planned: 2, Hold: 3 };
  const sorted = [...enriched].sort((a, b) => {
    if (sortBy === 'urgency') return urgencyOrder[a.ai.urgency] - urgencyOrder[b.ai.urgency];
    if (sortBy === 'cover')   return a.ai.daysCover - b.ai.daysCover;
    if (sortBy === 'value')   return b.ai.orderValue - a.ai.orderValue;
    return 0;
  });

  const criticalCount = enriched.filter(r => r.ai.urgency === 'Critical').length;
  const warningCount  = enriched.filter(r => r.ai.urgency === 'Warning').length;
  const totalUnits    = enriched.reduce((s, r) => s + r.ai.suggestedOrder, 0);
  const totalValue    = enriched.reduce((s, r) => s + r.ai.orderValue, 0);
  const avgCover      = Math.round(enriched.reduce((s, r) => s + r.ai.daysCover, 0) / enriched.length);

  return (
    <div className="flex flex-col gap-4 animate-enter">

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card">
          <span className="section-title">Critical SKUs</span>
          <span className="stat-figure" style={{ color: criticalCount > 0 ? '#B23A34' : 'inherit' }}>
            {criticalCount}
          </span>
          <span className="text-xs text-ink-muted">{warningCount} warning</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Suggested Units</span>
          <span className="stat-figure">{totalUnits.toLocaleString('en-IN')}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Order Value (Est.)</span>
          <span className="stat-figure text-lg">₹{(totalValue / 1000).toFixed(1)}k</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Avg Days Cover</span>
          <span className="stat-figure">{avgCover}d</span>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted font-medium uppercase tracking-wide mr-1">Sort by:</span>
        {[['urgency', 'Urgency'], ['cover', 'Days Cover'], ['value', 'Order Value']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={sortBy === key ? 'badge-ok cursor-pointer' : 'badge cursor-pointer'}
            style={sortBy !== key ? { background: 'var(--color-bg)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Recommendation cards */}
      {sorted.map((r) => {
        const { ai } = r;
        const expanded = expandedSku === r.sku;
        return (
          <div
            key={r.sku}
            className="card p-0 overflow-hidden"
            style={{ borderLeft: `4px solid ${ai.urgencyColor}` }}
          >
            <div
              className="flex items-start justify-between gap-4 p-4 cursor-pointer select-none"
              onClick={() => setExpandedSku(expanded ? null : r.sku)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span
                  className="badge shrink-0 mt-0.5 font-semibold text-xs"
                  style={{ background: ai.urgencyBg, color: ai.urgencyColor }}
                >
                  {ai.urgency === 'Critical' && '🔴 '}
                  {ai.urgency === 'Warning'  && '🟡 '}
                  {ai.urgency === 'Planned'  && '🟢 '}
                  {ai.urgency === 'Hold'     && '⏸ '}
                  {ai.urgency}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{r.name}</span>
                    <span className="font-mono text-xs text-ink-muted">{r.sku}</span>
                    <span className="badge text-xs" style={{ background: 'var(--color-bg)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)' }}>
                      {r.category}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 max-w-[160px] h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${ai.coverBarPct}%`, background: ai.coverBarColor }}
                      />
                    </div>
                    <span className="text-xs text-ink-muted whitespace-nowrap">
                      {ai.daysCover}d cover · {ai.availableStock.toLocaleString('en-IN')} avail
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.riskReasons.map(reason => (
                      <span key={reason} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: ai.urgencyBg, color: ai.urgencyColor, opacity: 0.85 }}>
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="font-mono font-bold text-xl" style={{ color: ai.suggestedOrder > 0 ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                  {ai.suggestedOrder > 0 ? ai.suggestedOrder.toLocaleString('en-IN') : '—'}
                </div>
                <div className="text-xs text-ink-muted">units suggested</div>
                {ai.suggestedOrder > 0 && (
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-primary)' }}>
                    ₹{(ai.orderValue / 1000).toFixed(1)}k est. cost
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1 justify-end">
                  <span className="text-xs text-ink-muted">AI confidence</span>
                  <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${ai.confidence}%`, background: 'var(--color-primary)' }} />
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{ai.confidence}%</span>
                </div>
                <div className="text-xs text-ink-muted mt-1">{expanded ? '▲ less' : '▼ details'}</div>
              </div>
            </div>

            {expanded && (
              <div className="border-t px-4 pb-4 pt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                <div className="col-span-2 font-semibold text-xs uppercase tracking-wide text-ink-muted mb-1">AI Analysis Breakdown</div>

                <div className="flex justify-between">
                  <span className="text-ink-muted">Daily velocity (30d avg)</span>
                  <span className="font-mono">{ai.dailyVelocity.toFixed(1)} units/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">7-day velocity</span>
                  <span className="font-mono">
                    {ai.velocity7d.toFixed(1)} units/day
                    <span className="ml-1 text-xs" style={{ color: ai.trend > 10 ? '#B23A34' : ai.trend < -10 ? '#1F6E4C' : '#5B6B62' }}>
                      ({ai.trend > 0 ? '+' : ''}{ai.trend.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Reorder point</span>
                  <span className="font-mono">{ai.reorderPoint.toLocaleString('en-IN')} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Current available</span>
                  <span className="font-mono">{ai.availableStock.toLocaleString('en-IN')} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Lead time</span>
                  <span className="font-mono">{r.leadTimeDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Safety stock buffer</span>
                  <span className="font-mono">{r.safetyStockDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Landed cost / unit</span>
                  <span className="font-mono">₹{r.landedCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Contribution margin</span>
                  <span className="font-mono">{ai.margin.toFixed(1)}%</span>
                </div>

                <div className="col-span-2 mt-2 pt-2 border-t flex items-start gap-2"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-primary)' }}>💡 AI Recommendation:</span>
                  <span className="text-xs text-ink-muted">
                    {ai.urgency === 'Critical'
                      ? `Order ${ai.suggestedOrder.toLocaleString('en-IN')} units immediately — current stock will run out before replenishment arrives.`
                      : ai.urgency === 'Warning'
                      ? `Place order for ${ai.suggestedOrder.toLocaleString('en-IN')} units by ${r.orderDate} to maintain ${r.safetyStockDays} days safety buffer.`
                      : ai.urgency === 'Planned'
                      ? `Schedule ${ai.suggestedOrder.toLocaleString('en-IN')} units on ${r.orderDate}. Velocity trend: ${ai.trend > 5 ? 'rising ↑' : ai.trend < -5 ? 'declining ↓' : 'stable →'}.`
                      : `No reorder needed. Stock covers ${ai.daysCover} days — monitor and reassess in 2 weeks.`}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const MOCK_IN_TRANSIT = [
  { poId: 'PO-2026-0142', sku: 'GF-CAS-001', qty: 2500, vendor: 'Shreeji Plastics', shippedDate: '2026-08-15', eta: '2026-09-02', status: 'On Water' },
  { poId: 'PO-2026-0140', sku: 'GF-BWL-014', qty: 800, vendor: 'Komal Packaging Co.', shippedDate: '2026-08-10', eta: '2026-08-24', status: 'Customs' },
  { poId: 'PO-2026-0138', sku: 'GF-CAS-005', qty: 400, vendor: 'Anand Steelware', shippedDate: '2026-08-05', eta: '2026-08-20', status: 'At Warehouse' },
];

const MOCK_DEAD_STOCK = [
  {
    sku: 'GF-STG-009', name: 'Storage Container Set', category: 'Storage',
    stock: 420, lastSaleDaysAgo: 74, avgMonthlySales: 85,
    costPrice: 162, mrp: 699, sellingPrice: 499,
    holdingCostPctPerMonth: 2,
    reasons: ['Seasonal drop-off', 'New variant launched'],
  },
  {
    sku: 'GF-PET-006', name: 'Pet Feeder Large', category: 'Pet Accessories',
    stock: 210, lastSaleDaysAgo: 61, avgMonthlySales: 40,
    costPrice: 150, mrp: 449, sellingPrice: 349,
    holdingCostPctPerMonth: 2,
    reasons: ['Low reorder rate', 'Competitor pricing pressure'],
  },
  {
    sku: 'GF-CAS-003', name: 'Casserole Set (Discontinued)', category: 'Casserole',
    stock: 85, lastSaleDaysAgo: 120, avgMonthlySales: 5,
    costPrice: 500, mrp: 1199, sellingPrice: 999,
    holdingCostPctPerMonth: 2,
    reasons: ['Discontinued line', 'No reorders in 4 months'],
  },
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

/* ── AI scoring engine for dead/slow stock ── */
function computeDeadAI(r) {
  const monthsStagnant   = r.lastSaleDaysAgo / 30;
  const totalValue       = r.stock * r.costPrice;
  const holdingCostMonth = totalValue * (r.holdingCostPctPerMonth / 100);
  const holdingCostTotal = Math.round(holdingCostMonth * monthsStagnant);
  const monthsToSell     = r.avgMonthlySales > 0 ? r.stock / r.avgMonthlySales : 999;
  const marginPct        = r.sellingPrice > 0 ? ((r.sellingPrice - r.costPrice) / r.sellingPrice) * 100 : 0;
  const maxDiscountPct   = r.sellingPrice > r.costPrice
    ? Math.floor(((r.sellingPrice - r.costPrice) / r.sellingPrice) * 100) : 0;
  const clearancePrice   = Math.round(r.costPrice * 1.05);
  const clearanceDiscount = Math.round(((r.sellingPrice - clearancePrice) / r.sellingPrice) * 100);
  const recoveryValue    = r.stock * clearancePrice;

  let tier, tierColor, tierBg, tierLabel;
  if (r.lastSaleDaysAgo >= 90 || r.avgMonthlySales <= 5) {
    tier = 'dead';     tierColor = '#B23A34'; tierBg = '#FBEAE8'; tierLabel = '💀 Dead Stock';
  } else if (r.lastSaleDaysAgo >= 60) {
    tier = 'critical'; tierColor = '#B9791E'; tierBg = '#FBF1DF'; tierLabel = '🔴 Critical';
  } else if (r.lastSaleDaysAgo >= 30) {
    tier = 'slow';     tierColor = '#1F6E4C'; tierBg = '#E7F2EC'; tierLabel = '🟡 Slow-moving';
  } else {
    tier = 'watch';    tierColor = '#5B6B62'; tierBg = '#F0F3EF'; tierLabel = '👁 Watch';
  }

  let confidence = 55;
  if (r.avgMonthlySales < 10)  confidence += 15;
  if (r.lastSaleDaysAgo > 60)  confidence += 15;
  if (r.reasons.length > 1)    confidence += 10;
  if (monthsToSell > 6)        confidence += 5;
  confidence = Math.min(95, confidence);

  const stalenessBarPct   = Math.min(100, (r.lastSaleDaysAgo / 120) * 100);
  const stalenessBarColor = r.lastSaleDaysAgo >= 90 ? '#B23A34' : r.lastSaleDaysAgo >= 60 ? '#B9791E' : '#1F6E4C';

  return {
    monthsStagnant: monthsStagnant.toFixed(1), totalValue,
    holdingCostTotal, holdingCostMonth: Math.round(holdingCostMonth),
    monthsToSell: monthsToSell > 99 ? '∞' : monthsToSell.toFixed(1),
    marginPct, maxDiscountPct, clearancePrice, clearanceDiscount, recoveryValue,
    tier, tierColor, tierBg, tierLabel, confidence, stalenessBarPct, stalenessBarColor,
  };
}

/* ---------------- Dead Stock Report (AI) ---------------- */
function DeadStockReport({ rows }) {
  const [sortBy, setSortBy]         = useState('urgency');
  const [expandedSku, setExpandedSku] = useState(null);

  const enriched = rows.map(r => ({ ...r, ai: computeDeadAI(r) }));
  const tierOrder = { dead: 0, critical: 1, slow: 2, watch: 3 };
  const sorted = [...enriched].sort((a, b) => {
    if (sortBy === 'urgency') return tierOrder[a.ai.tier] - tierOrder[b.ai.tier];
    if (sortBy === 'value')   return b.ai.totalValue - a.ai.totalValue;
    if (sortBy === 'stale')   return b.lastSaleDaysAgo - a.lastSaleDaysAgo;
    return 0;
  });

  const deadCount     = enriched.filter(r => r.ai.tier === 'dead').length;
  const critCount     = enriched.filter(r => r.ai.tier === 'critical').length;
  const totalCapital  = enriched.reduce((s, r) => s + r.ai.totalValue, 0);
  const totalHolding  = enriched.reduce((s, r) => s + r.ai.holdingCostTotal, 0);
  const totalRecovery = enriched.reduce((s, r) => s + r.ai.recoveryValue, 0);

  return (
    <div className="flex flex-col gap-4 animate-enter">

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card">
          <span className="section-title">Dead SKUs</span>
          <span className="stat-figure" style={{ color: deadCount > 0 ? '#B23A34' : 'inherit' }}>{deadCount}</span>
          <span className="text-xs text-ink-muted">{critCount} critical</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Capital Tied Up</span>
          <span className="stat-figure text-lg">₹{(totalCapital / 1000).toFixed(1)}k</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Holding Cost (accrued)</span>
          <span className="stat-figure text-lg" style={{ color: '#B23A34' }}>₹{(totalHolding / 1000).toFixed(1)}k</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Recovery Potential</span>
          <span className="stat-figure text-lg" style={{ color: '#1F6E4C' }}>₹{(totalRecovery / 1000).toFixed(1)}k</span>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted font-medium uppercase tracking-wide mr-1">Sort by:</span>
        {[['urgency', 'Urgency'], ['value', 'Capital Tied Up'], ['stale', 'Most Stale']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={sortBy === key ? 'badge-ok cursor-pointer' : 'badge cursor-pointer'}
            style={sortBy !== key ? { background: 'var(--color-bg)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* AI Cards */}
      {sorted.map((r) => {
        const { ai } = r;
        const expanded = expandedSku === r.sku;
        return (
          <div key={r.sku} className="card p-0 overflow-hidden" style={{ borderLeft: `4px solid ${ai.tierColor}` }}>
            <div
              className="flex items-start justify-between gap-4 p-4 cursor-pointer select-none"
              onClick={() => setExpandedSku(expanded ? null : r.sku)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="badge shrink-0 mt-0.5 font-semibold text-xs" style={{ background: ai.tierBg, color: ai.tierColor }}>
                  {ai.tierLabel}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{r.name}</span>
                    <span className="font-mono text-xs text-ink-muted">{r.sku}</span>
                    <span className="badge text-xs" style={{ background: 'var(--color-bg)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)' }}>{r.category}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 max-w-[160px] h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${ai.stalenessBarPct}%`, background: ai.stalenessBarColor }} />
                    </div>
                    <span className="text-xs text-ink-muted whitespace-nowrap">Last sold {r.lastSaleDaysAgo}d ago · {r.stock.toLocaleString('en-IN')} units</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.reasons.map(reason => (
                      <span key={reason} className="text-xs px-2 py-0.5 rounded-full" style={{ background: ai.tierBg, color: ai.tierColor, opacity: 0.85 }}>{reason}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono font-bold text-xl">₹{(ai.totalValue / 1000).toFixed(1)}k</div>
                <div className="text-xs text-ink-muted">capital tied up</div>
                <div className="text-xs font-mono mt-0.5" style={{ color: '#B23A34' }}>₹{ai.holdingCostTotal.toLocaleString('en-IN')} holding cost</div>
                <div className="mt-2 flex items-center gap-1 justify-end">
                  <span className="text-xs text-ink-muted">AI confidence</span>
                  <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${ai.confidence}%`, background: 'var(--color-primary)' }} />
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-primary)' }}>{ai.confidence}%</span>
                </div>
                <div className="text-xs text-ink-muted mt-1">{expanded ? '▲ less' : '▼ details'}</div>
              </div>
            </div>

            {expanded && (
              <div className="border-t px-4 pb-4 pt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                <div className="col-span-2 font-semibold text-xs uppercase tracking-wide text-ink-muted mb-1">AI Analysis Breakdown</div>
                <div className="flex justify-between"><span className="text-ink-muted">Stock on hand</span><span className="font-mono">{r.stock.toLocaleString('en-IN')} units</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Avg monthly sales</span><span className="font-mono">{r.avgMonthlySales} units/month</span></div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Months to sell (at current rate)</span>
                  <span className="font-mono" style={{ color: parseFloat(ai.monthsToSell) > 6 ? '#B23A34' : 'inherit' }}>{ai.monthsToSell} months</span>
                </div>
                <div className="flex justify-between"><span className="text-ink-muted">Monthly holding cost</span><span className="font-mono" style={{ color: '#B23A34' }}>₹{ai.holdingCostMonth.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Cost price / unit</span><span className="font-mono">₹{r.costPrice.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Current selling price</span><span className="font-mono">₹{r.sellingPrice.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Max safe discount</span><span className="font-mono">{ai.maxDiscountPct}% (floor ₹{r.costPrice})</span></div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Clearance price (5% margin)</span>
                  <span className="font-mono" style={{ color: '#1F6E4C' }}>₹{ai.clearancePrice} ({ai.clearanceDiscount}% off)</span>
                </div>
                <div className="flex justify-between"><span className="text-ink-muted">Recovery value (if cleared)</span><span className="font-mono" style={{ color: '#1F6E4C' }}>₹{ai.recoveryValue.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Current margin</span><span className="font-mono">{ai.marginPct.toFixed(1)}%</span></div>
                <div className="col-span-2 mt-2 pt-2 border-t flex items-start gap-2" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-primary)' }}>💡 AI Recommendation:</span>
                  <span className="text-xs text-ink-muted">
                    {ai.tier === 'dead'
                      ? `Liquidate all ${r.stock} units at ₹${ai.clearancePrice}/unit (${ai.clearanceDiscount}% off). Holding costs ₹${ai.holdingCostMonth.toLocaleString('en-IN')}/month. Recover ₹${ai.recoveryValue.toLocaleString('en-IN')} now.`
                      : ai.tier === 'critical'
                      ? `Run a ${ai.clearanceDiscount}% clearance to clear ${r.stock} units. At ₹${ai.clearancePrice}/unit you still hold a 5% margin. Each month of inaction costs ₹${ai.holdingCostMonth.toLocaleString('en-IN')}.`
                      : ai.tier === 'slow'
                      ? `Bundle with a fast-moving SKU or run a ${Math.round(ai.maxDiscountPct * 0.6)}% offer. ${r.stock} units at current rate will take ${ai.monthsToSell} months to sell.`
                      : `Monitor for 2 more weeks. Sales velocity (${r.avgMonthlySales}/month) is still reasonable but trend is soft.`}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
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