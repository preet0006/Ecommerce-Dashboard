import React, { useState } from 'react';
import { computeAI } from './utils';

export default function ReorderRecommendations({ rows }) {
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
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card">
          <span className="section-title">Critical SKUs</span>
          <span className="stat-figure" style={{ color: criticalCount > 0 ? '#B23A34' : 'inherit' }}>{criticalCount}</span>
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

      {sorted.map((r) => {
        const { ai } = r;
        const expanded = expandedSku === r.sku;
        return (
          <div key={r.sku} className="card p-0 overflow-hidden" style={{ borderLeft: `4px solid ${ai.urgencyColor}` }}>
            <div
              className="flex items-start justify-between gap-4 p-4 cursor-pointer select-none"
              onClick={() => setExpandedSku(expanded ? null : r.sku)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="badge shrink-0 mt-0.5 font-semibold text-xs" style={{ background: ai.urgencyBg, color: ai.urgencyColor }}>
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
                    <span className="badge text-xs" style={{ background: 'var(--color-bg)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)' }}>{r.category}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 max-w-[160px] h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${ai.coverBarPct}%`, background: ai.coverBarColor }} />
                    </div>
                    <span className="text-xs text-ink-muted whitespace-nowrap">{ai.daysCover}d cover · {ai.availableStock.toLocaleString('en-IN')} avail</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.riskReasons.map(reason => (
                      <span key={reason} className="text-xs px-2 py-0.5 rounded-full" style={{ background: ai.urgencyBg, color: ai.urgencyColor, opacity: 0.85 }}>{reason}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="font-mono font-bold text-xl" style={{ color: ai.suggestedOrder > 0 ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                  {ai.suggestedOrder > 0 ? ai.suggestedOrder.toLocaleString('en-IN') : '—'}
                </div>
                <div className="text-xs text-ink-muted">units suggested</div>
                {ai.suggestedOrder > 0 && <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-primary)' }}>₹{(ai.orderValue / 1000).toFixed(1)}k est. cost</div>}
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
                <div className="flex justify-between"><span className="text-ink-muted">Daily velocity (30d avg)</span><span className="font-mono">{ai.dailyVelocity.toFixed(1)} units/day</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">7-day velocity</span><span className="font-mono">{ai.velocity7d.toFixed(1)} units/day <span className="ml-1 text-xs" style={{ color: ai.trend > 10 ? '#B23A34' : ai.trend < -10 ? '#1F6E4C' : '#5B6B62' }}>({ai.trend > 0 ? '+' : ''}{ai.trend.toFixed(0)}%)</span></span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Reorder point</span><span className="font-mono">{ai.reorderPoint.toLocaleString('en-IN')} units</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Current available</span><span className="font-mono">{ai.availableStock.toLocaleString('en-IN')} units</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Lead time</span><span className="font-mono">{r.leadTimeDays} days</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Safety stock buffer</span><span className="font-mono">{r.safetyStockDays} days</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Landed cost / unit</span><span className="font-mono">₹{r.landedCost.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Contribution margin</span><span className="font-mono">{ai.margin.toFixed(1)}%</span></div>
                <div className="col-span-2 mt-2 pt-2 border-t flex items-start gap-2" style={{ borderColor: 'var(--color-border)' }}>
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
