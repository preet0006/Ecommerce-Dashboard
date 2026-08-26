import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   QUOTATION HISTORY
══════════════════════════════════════════════════════════════ */
export default function QuotationHistory({ quotes }) {
  const sorted = [...quotes].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const best = [...quotes].sort((a, b) => a.rate - b.rate)[0];

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-5 col-span-2">
        <h3 className="font-display font-semibold mb-1">Quotation History — GF-CAS-001</h3>
        <p className="text-sm text-ink-muted mb-4">Shreeji Plastics · every quote kept, never overwritten</p>
        <table className="table-clean">
          <thead>
            <tr>
              <th>Date</th><th>Qty</th><th className="text-right">Rate</th>
              <th>MOQ</th><th>Freight</th><th>Credit Days</th><th>Lead Time</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((q, i) => (
              <tr key={i}>
                <td>{q.date}</td>
                <td>{q.qty.toLocaleString('en-IN')}</td>
                <td className="text-right font-mono">₹{q.rate}</td>
                <td>{q.moq}</td>
                <td>₹{q.freight}</td>
                <td>{q.creditDays} days</td>
                <td>{q.leadTime} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4">
        <div className="kpi-card">
          <span className="section-title">Latest Quote</span>
          <span className="stat-figure">₹{latest.rate}</span>
          <span className="text-xs text-ink-muted">{latest.date}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Best Historical Rate</span>
          <span className="stat-figure">₹{best.rate}</span>
          <span className="text-xs text-ink-muted">{best.date}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Change vs Best</span>
          <div className="flex items-center gap-1">
            {latest.rate > best.rate
              ? <TrendingUp size={16} className="text-red" />
              : <TrendingDown size={16} className="text-primary" />}
            <span className="stat-figure">
              {(((latest.rate - best.rate) / best.rate) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
