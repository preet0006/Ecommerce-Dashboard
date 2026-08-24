import { useState } from 'react';
import { useWhatIf } from '../../hooks/useDashboardData';
import { formatValue } from '../../utils/format';

export default function WhatIfSimulator() {
  const [discountPct, setDiscountPct] = useState(10);
  const [costChangePct, setCostChangePct] = useState(0);
  const [volume, setVolume] = useState(500);
  const { mutate, data, isPending, isError } = useWhatIf();

  function handleCalculate(e) {
    e.preventDefault();
    mutate({ discountPct, costChangePct, volume });
  }

  return (
    <div className="card p-5">
      <h2 className="section-title mb-1">What-if simulator</h2>
      <p className="text-xs text-ink-muted mb-4">Test a discount, vendor cost, or volume change before it goes live.</p>

      <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <label>
          <span className="label">Discount %</span>
          <input type="number" className="input" min={0} max={80}
            value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} />
        </label>
        <label>
          <span className="label">Vendor cost change %</span>
          <input type="number" className="input" min={-50} max={100}
            value={costChangePct} onChange={(e) => setCostChangePct(Number(e.target.value))} />
        </label>
        <label>
          <span className="label">Expected volume (units)</span>
          <input type="number" className="input" min={0}
            value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </label>
        <div className="sm:col-span-3">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Calculating…' : 'Calculate impact'}
          </button>
        </div>
      </form>

      {isError && <p className="text-sm text-red">Couldn't calculate. Try again.</p>}

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border pt-4 animate-enter">
          <Metric label="New price" value={formatValue(data.newPrice, 'currency')} />
          <Metric label="Margin / unit" value={formatValue(data.marginPerUnit, 'currency')} tone={data.marginPerUnit < 0 ? 'danger' : 'ok'} />
          <Metric label="Margin %" value={`${data.marginPct}%`} tone={data.marginPct < 20 ? 'warn' : 'ok'} />
          <Metric label="Monthly profit" value={formatValue(data.monthlyProfit, 'currency')} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = 'ok' }) {
  const color = tone === 'danger' ? 'text-red' : tone === 'warn' ? 'text-amber' : 'text-primary-strong';
  return (
    <div>
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className={`font-mono text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
