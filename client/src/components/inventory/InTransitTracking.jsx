import React from 'react';
import { PackageCheck } from 'lucide-react';

export default function InTransitTracking({ rows }) {
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
