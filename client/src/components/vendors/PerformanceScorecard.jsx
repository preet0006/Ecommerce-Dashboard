import React, { useState, useEffect } from 'react';
import { Loader2, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { ErrorBanner } from './utils';

/* ══════════════════════════════════════════════════════════════
   PERFORMANCE SCORECARD (WITH SKU PRICE & DELIVERY BENCHMARKING)
══════════════════════════════════════════════════════════════ */
export default function PerformanceScorecard() {
  const [vendors, setVendors] = useState([]);
  const [skuData, setSkuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getVendors(),
      api.getVendorPerformanceScoreboard().catch(() => ({ skuComparisons: [] })),
    ])
      .then(([vList, sbData]) => {
        setVendors(Array.isArray(vList) ? vList : []);
        setSkuData(Array.isArray(sbData?.skuComparisons) ? sbData.skuComparisons : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16 text-ink-muted">
      <Loader2 size={24} className="animate-spin mr-2" />Loading scorecards & delivery metrics…
    </div>
  );
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      {/* Top Summary Vendor Scorecards */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-1">Vendor Reliability Scorecard</h3>
        <p className="text-xs text-ink-muted mb-4">
          Real-time on-time delivery percentages and delay days recorded from completed PO delivery checks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {vendors.map((v) => (
            <div key={v.id} className="card p-5 flex flex-col justify-between gap-4 border hover:border-primary transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-display font-bold text-base text-ink">{v.name}</h4>
                    <span className="font-mono text-xs text-ink-muted">{v.vendorCode}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm font-bold text-amber-900">{(5 - Number(v.rejectionPct || 0) / 2).toFixed(1)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-raised border">
                    <span className="section-title block mb-0.5">On-Time %</span>
                    <span className="font-mono text-lg font-bold" style={{ color: Number(v.deliveryPct) >= 90 ? 'var(--color-ok)' : 'var(--color-red)' }}>
                      {v.deliveryPct || 100}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-raised border">
                    <span className="section-title block mb-0.5">Lead Time</span>
                    <span className="font-mono text-lg font-bold">{v.leadTimeDays || 7}d</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-raised border">
                    <span className="section-title block mb-0.5">Rejection %</span>
                    <span className="font-mono text-lg font-bold">{v.rejectionPct || 0}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-raised border">
                    <span className="section-title block mb-0.5">Credit Terms</span>
                    <span className="font-mono text-lg font-bold">{v.creditDays || 30}d</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--color-border)' }}>
                {Number(v.deliveryPct || 100) >= 95 && Number(v.rejectionPct || 0) < 2 ? (
                  <span className="badge-ok font-semibold">🌟 Preferred Vendor</span>
                ) : Number(v.deliveryPct || 100) >= 80 ? (
                  <span className="badge-warn font-semibold">⚠️ Moderate Timeliness</span>
                ) : (
                  <span className="badge-danger font-semibold">🔴 Needs Review</span>
                )}
                <span className="text-[11px] text-ink-muted">{v.email || 'No email'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Vendor Product & Price vs Delivery Comparison Table */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-lg mb-1">
          SKU Price vs. Delivery Timeliness Benchmark
        </h3>
        <p className="text-xs text-ink-muted mb-4">
          Compare different vendors supplying the same product/SKU by matching their unit rate, on-time delivery %, and average delay in days.
        </p>

        {skuData.length > 0 ? (
          <div className="flex flex-col gap-6">
            {skuData.map((group) => (
              <div key={group.sku} className="rounded-xl border overflow-hidden">
                <div className="bg-surface-raised px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="badge font-mono text-xs">{group.sku}</span>
                    <span className="text-ink">Product Vendor Benchmark</span>
                  </div>
                  <span className="text-ink-muted">{group.vendors.length} competing vendor(s)</span>
                </div>

                <table className="table-clean text-xs">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th className="text-right">Latest Rate</th>
                      <th className="text-right">Average Rate</th>
                      <th>On-Time Delivery %</th>
                      <th>Avg Delay (Days)</th>
                      <th>Total Value Awarded</th>
                      <th>Performance Insight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.vendors.map((v, i) => {
                      const isBestPrice = Number(v.latestRate) === Math.min(...group.vendors.map(x => Number(x.latestRate)));
                      const isBestDelivery = v.onTimePct === Math.max(...group.vendors.map(x => x.onTimePct));

                      return (
                        <tr key={i}>
                          <td className="font-semibold text-ink">
                            <div>{v.vendorName}</div>
                            {v.vendorEmail && <span className="text-[10px] text-ink-muted font-normal">{v.vendorEmail}</span>}
                          </td>
                          <td className="text-right font-mono font-bold text-primary">₹{v.latestRate}</td>
                          <td className="text-right font-mono text-ink-muted">₹{v.avgRate}</td>
                          <td>
                            <span className={v.onTimePct >= 90 ? 'badge-ok font-semibold' : 'badge-warn font-semibold'}>
                              {v.onTimePct}% on-time
                            </span>
                          </td>
                          <td className="font-mono">
                            {Number(v.avgDelayDays) > 0 ? (
                              <span className="text-red font-semibold">+{v.avgDelayDays}d late</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">0d (Punctual)</span>
                            )}
                          </td>
                          <td className="font-mono text-ink">₹{Number(v.totalValue || 0).toLocaleString('en-IN')}</td>
                          <td>
                            {isBestPrice && isBestDelivery ? (
                              <span className="badge-ok font-bold text-[10px]">🏆 Best Price & 100% On-Time</span>
                            ) : isBestPrice ? (
                              <span className="badge-warn font-medium text-[10px]">💰 Lowest Rate</span>
                            ) : isBestDelivery ? (
                              <span className="badge-ok font-medium text-[10px]">⚡ Most Punctual Delivery</span>
                            ) : (
                              <span className="badge text-[10px]">Standard Supplier</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-ink-muted text-xs">
            Complete PO delivery checks to generate automated SKU price vs delivery benchmarking comparisons.
          </div>
        )}
      </div>
    </div>
  );
}
