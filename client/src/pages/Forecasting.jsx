import React, { useState, useMemo } from 'react';
import { TrendingUp, CalendarRange, FlaskConical, ChevronRight, IndianRupee } from 'lucide-react';

/* ============================================================
   MOCK DATA — replace with API calls to your Forecast Engine
   endpoints (GET /api/forecast, POST /api/forecast/scenario, etc.)
   ============================================================ */

const MOCK_FORECAST = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', last30: 500, next30: 540, next60: 1120, next90: 1700, trend: 'up' },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', last30: 400, next30: 430, next60: 890, next90: 1350, trend: 'up' },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', last30: 300, next30: 280, next60: 560, next90: 830, trend: 'down' },
  { sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', last30: 180, next30: 210, next60: 440, next90: 680, trend: 'up' },
];

const MOCK_SEASONALITY = [
  { month: 'Apr', index: 85 }, { month: 'May', index: 90 }, { month: 'Jun', index: 95 },
  { month: 'Jul', index: 100 }, { month: 'Aug', index: 110 }, { month: 'Sep', index: 125 },
  { month: 'Oct', index: 160 }, { month: 'Nov', index: 190 }, { month: 'Dec', index: 145 },
  { month: 'Jan', index: 100 }, { month: 'Feb', index: 90 }, { month: 'Mar', index: 95 },
];

const TABS = [
  { id: 'demand', label: 'Demand Forecast', icon: TrendingUp },
  { id: 'seasonality', label: 'Seasonality View', icon: CalendarRange },
  { id: 'scenario', label: 'Scenario Planner', icon: FlaskConical },
];

/* ---------------- Demand Forecast ---------------- */
function DemandForecast({ rows }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th className="text-right">Last 30 Days</th>
            <th className="text-right">Next 30 Days</th>
            <th className="text-right">Next 60 Days</th>
            <th className="text-right">Next 90 Days</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sku}>
              <td className="font-mono text-xs text-ink-muted">{r.sku}</td>
              <td className="font-medium">{r.name}</td>
              <td className="text-right">{r.last30.toLocaleString('en-IN')}</td>
              <td className="text-right font-semibold">{r.next30.toLocaleString('en-IN')}</td>
              <td className="text-right">{r.next60.toLocaleString('en-IN')}</td>
              <td className="text-right">{r.next90.toLocaleString('en-IN')}</td>
              <td>
                {r.trend === 'up'
                  ? <span className="badge-ok">Rising</span>
                  : <span className="badge-warn">Softening</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Seasonality View ---------------- */
function SeasonalityView({ data }) {
  const max = Math.max(...data.map((d) => d.index));
  return (
    <div className="card p-6 animate-enter">
      <h3 className="font-display font-semibold text-lg mb-1">Seasonality Index</h3>
      <p className="text-sm text-ink-muted mb-6">Relative demand by month (100 = average month). Festive months carry the strongest lift.</p>

      <div className="flex items-end gap-3 h-56">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-mono text-ink-muted">{d.index}</span>
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(d.index / max) * 180}px`,
                background: d.index >= 140 ? 'var(--color-primary)' : d.index >= 100 ? 'var(--color-primary-soft)' : 'var(--color-border)',
              }}
            />
            <span className="text-xs text-ink-muted">{d.month}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t text-sm text-ink-muted" style={{ borderColor: 'var(--color-border)' }}>
        Oct–Nov (festive season) run 60–90% above baseline — plan purchase orders 8–10 weeks ahead to have stock landed in time.
      </div>
    </div>
  );
}

/* ---------------- Scenario Planner ---------------- */
function ScenarioPlanner() {
  const [inputs, setInputs] = useState({
    vendorDiscountPct: 0,
    marketplaceFeeChangePct: 0,
    customerDiscountPct: 15,
    adsPctOfSales: 10,
    monthlySales: 2000,
    avgSellingPrice: 750,
    avgLandedCost: 480,
  });
  const update = (key) => (e) => setInputs((f) => ({ ...f, [key]: Number(e.target.value) }));

  const result = useMemo(() => {
    const effectivePrice = inputs.avgSellingPrice * (1 - inputs.customerDiscountPct / 100);
    const effectiveCost = inputs.avgLandedCost * (1 - inputs.vendorDiscountPct / 100);
    const revenue = effectivePrice * inputs.monthlySales;
    const grossProfit = (effectivePrice - effectiveCost) * inputs.monthlySales;
    const marketplaceFees = revenue * (0.15 + inputs.marketplaceFeeChangePct / 100);
    const adsCost = revenue * (inputs.adsPctOfSales / 100);
    const contribution = grossProfit - marketplaceFees - adsCost;
    const cashRequired = effectiveCost * inputs.monthlySales * 1.5; // ~6 weeks of purchasing
    return { revenue, grossProfit, contribution, cashRequired, marketplaceFees, adsCost };
  }, [inputs]);

  const fields = [
    { key: 'vendorDiscountPct', label: 'Additional Vendor Discount %' },
    { key: 'marketplaceFeeChangePct', label: 'Marketplace Fee Change %' },
    { key: 'customerDiscountPct', label: 'Customer Discount %' },
    { key: 'adsPctOfSales', label: 'Ads Cost (% of Sales)' },
    { key: 'monthlySales', label: 'Monthly Sales (units)' },
    { key: 'avgSellingPrice', label: 'Avg Selling Price (₹)' },
    { key: 'avgLandedCost', label: 'Avg Landed Cost (₹)' },
  ];

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">What If?</h3>
        <div className="flex flex-col gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input className="input" type="number" value={inputs[f.key]} onChange={update(f.key)} />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 col-span-2">
        <h3 className="font-display font-semibold text-lg mb-1">Projected Outcome</h3>
        <p className="text-sm text-ink-muted mb-5">Connects cost negotiation, pricing, discounting and purchasing in one view.</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="kpi-card">
            <span className="section-title">Revenue</span>
            <span className="stat-figure">₹{(result.revenue / 100000).toFixed(2)}L</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Gross Profit</span>
            <span className="stat-figure">₹{(result.grossProfit / 100000).toFixed(2)}L</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Contribution</span>
            <span className="stat-figure">₹{(result.contribution / 100000).toFixed(2)}L</span>
          </div>
          <div className="kpi-card" style={{ borderColor: 'var(--color-primary)' }}>
            <span className="section-title flex items-center gap-1"><IndianRupee size={12} /> Cash Required</span>
            <span className="stat-figure" style={{ color: 'var(--color-primary-strong)' }}>₹{(result.cashRequired / 100000).toFixed(2)}L</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-ink-muted">
          <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <span>Marketplace fees</span><span className="font-mono">₹{result.marketplaceFees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>
            <span>Ads cost</span><span className="font-mono">₹{result.adsCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <button className="btn-primary mt-5">Save Scenario</button>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function Forecasting() {
  const [activeTab, setActiveTab] = useState('demand');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Forecasting</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Forecasting</h1>

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

      {activeTab === 'demand' && <DemandForecast rows={MOCK_FORECAST} />}
      {activeTab === 'seasonality' && <SeasonalityView data={MOCK_SEASONALITY} />}
      {activeTab === 'scenario' && <ScenarioPlanner />}
    </div>
  );
}