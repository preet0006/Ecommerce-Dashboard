import React, { useState } from 'react';
import { computeDeadAI } from './utils';

export default function DeadStockReport({ rows }) {
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
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card"><span className="section-title">Dead SKUs</span><span className="stat-figure" style={{ color: deadCount > 0 ? '#B23A34' : 'inherit' }}>{deadCount}</span><span className="text-xs text-ink-muted">{critCount} critical</span></div>
        <div className="kpi-card"><span className="section-title">Capital Tied Up</span><span className="stat-figure text-lg">₹{(totalCapital / 1000).toFixed(1)}k</span></div>
        <div className="kpi-card"><span className="section-title">Holding Cost (accrued)</span><span className="stat-figure text-lg" style={{ color: '#B23A34' }}>₹{(totalHolding / 1000).toFixed(1)}k</span></div>
        <div className="kpi-card"><span className="section-title">Recovery Potential</span><span className="stat-figure text-lg" style={{ color: '#1F6E4C' }}>₹{(totalRecovery / 1000).toFixed(1)}k</span></div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted font-medium uppercase tracking-wide mr-1">Sort by:</span>
        {[['urgency', 'Urgency'], ['value', 'Capital Tied Up'], ['stale', 'Most Stale']].map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)}
            className={sortBy === key ? 'badge-ok cursor-pointer' : 'badge cursor-pointer'}
            style={sortBy !== key ? { background: 'var(--color-bg)', color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)' } : {}}
          >{label}</button>
        ))}
      </div>

      {sorted.map((r) => {
        const { ai } = r;
        const expanded = expandedSku === r.sku;
        return (
          <div key={r.sku} className="card p-0 overflow-hidden" style={{ borderLeft: `4px solid ${ai.tierColor}` }}>
            <div className="flex items-start justify-between gap-4 p-4 cursor-pointer select-none" onClick={() => setExpandedSku(expanded ? null : r.sku)}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="badge shrink-0 mt-0.5 font-semibold text-xs" style={{ background: ai.tierBg, color: ai.tierColor }}>{ai.tierLabel}</span>
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
                <div className="flex justify-between"><span className="text-ink-muted">Months to sell</span><span className="font-mono" style={{ color: parseFloat(ai.monthsToSell) > 6 ? '#B23A34' : 'inherit' }}>{ai.monthsToSell} months</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Monthly holding cost</span><span className="font-mono" style={{ color: '#B23A34' }}>₹{ai.holdingCostMonth.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Cost price / unit</span><span className="font-mono">₹{r.costPrice.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Current selling price</span><span className="font-mono">₹{r.sellingPrice.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Max safe discount</span><span className="font-mono">{ai.maxDiscountPct}% (floor ₹{r.costPrice})</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Clearance price (5% margin)</span><span className="font-mono" style={{ color: '#1F6E4C' }}>₹{ai.clearancePrice} ({ai.clearanceDiscount}% off)</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Recovery value (if cleared)</span><span className="font-mono" style={{ color: '#1F6E4C' }}>₹{ai.recoveryValue.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Current margin</span><span className="font-mono">{ai.marginPct.toFixed(1)}%</span></div>
                <div className="col-span-2 mt-2 pt-2 border-t flex items-start gap-2" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-primary)' }}>💡 AI Recommendation:</span>
                  <span className="text-xs text-ink-muted">
                    {ai.tier === 'dead'
                      ? `Liquidate all ${r.stock} units at ₹${ai.clearancePrice}/unit (${ai.clearanceDiscount}% off). Holding costs ₹${ai.holdingCostMonth.toLocaleString('en-IN')}/month. Recover ₹${ai.recoveryValue.toLocaleString('en-IN')} now.`
                      : ai.tier === 'critical'
                      ? `Run a ${ai.clearanceDiscount}% clearance to clear ${r.stock} units. At ₹${ai.clearancePrice}/unit you still hold a 5% margin.`
                      : ai.tier === 'slow'
                      ? `Bundle with a fast-moving SKU or run a ${Math.round(ai.maxDiscountPct * 0.6)}% offer. ${r.stock} units will take ${ai.monthsToSell} months at current rate.`
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
