import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  CalendarRange,
  FlaskConical,
  ChevronRight,
  IndianRupee,
  Megaphone,
  Mail,
  Clock,
  ExternalLink,
  Send,
} from 'lucide-react';
import { computePushCandidates } from '../lib/pushRecommendationEngine';
import { UNIFIED_PRODUCTS } from '../lib/productsData';
import {
  generatePushRecommendations,
  resendPushRecommendationsEmail,
  getPushRecommendations,
  updatePushRecommendationStatus,
} from '../lib/api';

function formatDispatchTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

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
  { id: 'push', label: 'Sales Push', icon: Megaphone },
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

/* ---------------- Sales Push Recommendations ---------------- */
function SalesPushRecommendations() {
  const [items, setItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanMessage, setScanMessage] = useState(null);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await getPushRecommendations();
      const list = Array.isArray(data) ? data : data?.items || [];
      setItems(list);
    } catch (err) {
      console.error('[SalesPushRecommendations] load error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleScan() {
    setScanning(true);
    setScanMessage(null);
    try {
      const candidates = computePushCandidates(UNIFIED_PRODUCTS);
      if (candidates.length === 0) {
        setScanMessage({ type: 'info', text: 'No products currently meet the low-sales/high-cost thresholds.' });
        return;
      }
      const res = await generatePushRecommendations(candidates);
      if (res?.message) {
        setScanMessage({
          type: res.newlyEmailedCount > 0 ? 'success' : 'info',
          text: res.message,
        });
      }
      await loadItems();
    } catch (err) {
      console.error('[SalesPushRecommendations] scan error:', err);
      alert('Failed to generate recommendations: ' + (err.message || err));
    } finally {
      setScanning(false);
    }
  }

  async function handleResendEmail() {
    setResending(true);
    setScanMessage(null);
    try {
      const res = await resendPushRecommendationsEmail();
      if (res?.message) {
        setScanMessage({ type: 'success', text: res.message });
      }
      await loadItems();
    } catch (err) {
      console.error('[SalesPushRecommendations] resend error:', err);
      setScanMessage({ type: 'info', text: 'Failed to send fresh email: ' + (err.message || err) });
    } finally {
      setResending(false);
    }
  }

  async function handleStatus(id, status) {
    try {
      await updatePushRecommendationStatus(id, status);
      await loadItems();
    } catch (err) {
      console.error('[SalesPushRecommendations] update status error:', err);
    }
  }

  return (
    <div className="animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm text-ink-muted">
          Flags low sell-through / high cost-of-sale SKUs and recommends a channel to push with 1-click admin email approvals.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="btn-secondary text-xs flex items-center gap-1.5"
            onClick={handleResendEmail}
            disabled={resending || scanning || items.length === 0}
            title="Dispatch a fresh approval email template to admin for current recommendations"
          >
            <Send size={13} />
            {resending ? 'Sending…' : 'Send Fresh Email to Admin'}
          </button>
          <button className="btn-primary shrink-0" onClick={handleScan} disabled={scanning || resending}>
            {scanning ? 'Scanning…' : 'Scan for Recommendations'}
          </button>
        </div>
      </div>

      {scanMessage && (
        <div
          className={`p-3.5 mb-4 rounded-xl text-xs flex items-center justify-between border ${
            scanMessage.type === 'success'
              ? 'bg-primary-soft text-primary-strong border-primary/20'
              : 'bg-surface-raised text-ink-muted border-border'
          }`}
        >
          <span>{scanMessage.text}</span>
          <button
            onClick={() => setScanMessage(null)}
            className="text-ink-muted hover:text-ink font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card p-6 text-sm text-ink-muted">No recommendations yet — run a scan to generate some.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-ink-muted">{r.sku}</div>
                  <div className="font-semibold text-base text-ink">{r.productName}</div>
                  <span className="badge-ok mt-1 inline-block">Push on {r.recommendedChannel}</span>
                  <ul className="mt-2 text-xs text-ink-muted list-disc pl-4 space-y-0.5">
                    {(Array.isArray(r.reasonTags)
                      ? r.reasonTags
                      : typeof r.reasonTags === 'string'
                      ? JSON.parse(r.reasonTags || '[]')
                      : []
                    ).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <p className="text-xs italic text-ink-muted mt-2">{r.suggestedAction}</p>
                </div>
                <div className="flex flex-col items-end gap-2.5 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === 'actioned'
                          ? 'badge-ok'
                          : r.status === 'dismissed'
                          ? 'badge-danger'
                          : 'badge-warn'
                      }`}
                    >
                      {r.status === 'emailed' && <Mail size={12} className="text-amber-700 dark:text-amber-300" />}
                      <span className="capitalize">{r.status}</span>
                    </span>

                    {/* When the mail was directed / sent */}
                    {r.emailedAt ? (
                      <div
                        className="text-[11px] text-ink-muted flex items-center gap-1.5 bg-surface-raised px-2 py-0.5 rounded-md border border-border shadow-2xs mt-0.5"
                        title={`Quotation mail was directed on ${formatDispatchTime(r.emailedAt)}`}
                      >
                        <Clock size={11} className="text-primary shrink-0" />
                        <span>Directed: <strong className="text-ink font-mono font-medium">{formatDispatchTime(r.emailedAt)}</strong></span>
                      </div>
                    ) : r.createdAt ? (
                      <div className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="shrink-0" />
                        <span>Logged: {formatDispatchTime(r.createdAt)}</span>
                      </div>
                    ) : null}

                    {/* Decision Audit Trail */}
                    {r.decidedAt && (
                      <div className="text-[10px] text-ink-muted font-mono mt-0.5">
                        {r.status === 'actioned' ? '✓ Approved' : '✕ Dismissed'} via {r.decidedVia || 'system'} ({formatDispatchTime(r.decidedAt)})
                      </div>
                    )}

                    {/* Email preview link if available */}
                    {r.emailPreviewUrl && (
                      <a
                        href={r.emailPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-primary hover:text-primary-strong hover:underline flex items-center gap-1 mt-0.5 transition-colors"
                        title="Open sent email in a new browser tab"
                      >
                        <ExternalLink size={11} />
                        <span>View Sent Email</span>
                      </a>
                    )}
                  </div>

                  {r.status !== 'actioned' && r.status !== 'dismissed' && (
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs" onClick={() => handleStatus(r.id, 'dismissed')}>
                        Dismiss
                      </button>
                      <button className="btn-primary text-xs" onClick={() => handleStatus(r.id, 'actioned')}>
                        Mark Actioned
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function Forecasting() {
  const [activeTab, setActiveTab] = useState('demand');

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-bg transition-colors">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={13} /> <span className="text-ink font-medium">Demand Forecasting</span>
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-semibold mb-4 sm:mb-5">Demand Forecasting</h1>

      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap text-xs sm:text-sm ${
                active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'
              }`}
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
      {activeTab === 'push' && <SalesPushRecommendations />}
    </div>
  );
}