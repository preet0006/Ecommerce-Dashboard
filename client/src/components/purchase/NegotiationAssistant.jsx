import React, { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles, Package, Target, ShieldCheck } from 'lucide-react';
import { getProductsCatalog, fetchAndSyncProductsCatalog } from '../../lib/productsCatalog';

/* ══════════════════════════════════════════════════════════════
   NEGOTIATION ASSISTANT TAB
   – Retrieves product baseline & target price stored during PO creation
   – Computes smart benchmark based on PO creation rate and historical DB records
══════════════════════════════════════════════════════════════ */
export default function NegotiationAssistant({ pos }) {
  const [catalog, setCatalog]       = useState(() => getProductsCatalog());
  const [sku, setSku]               = useState(() => catalog[0]?.sku || 'GF-CAS-001');
  const [qty, setQty]               = useState(2500);
  const [currentQuote, setCurrentQuote] = useState(525);

  // Refresh catalog on mount/tab activation
  useEffect(() => {
    fetchAndSyncProductsCatalog().then((updated) => {
      if (Array.isArray(updated) && updated.length > 0) {
        setCatalog(updated);
      }
    });
  }, []);

  const selectedProduct = catalog.find((p) => p.sku.toUpperCase() === sku.toUpperCase()) || catalog[0];

  // Price added / configured during PO creation or in catalog
  const poCreationRate = Number(selectedProduct?.defaultRate) || 0;

  // Matching POs from database
  const matchingPos = pos.filter((p) => p.sku?.toUpperCase() === sku.toUpperCase());
  const confirmedPos = matchingPos.filter((p) => p.status === 'confirmed' || p.status === 'Approved');

  // Baseline rate: priority to PO creation rate, then recent PO, then fallback
  const baseRate = poCreationRate > 0
    ? poCreationRate
    : matchingPos.length > 0
    ? Number(matchingPos[0].rate)
    : 495;

  const lastConfirmedRate = confirmedPos.length > 0
    ? Number(confirmedPos[0].rate)
    : (matchingPos.length > 0 ? Number(matchingPos[0].rate) : baseRate);

  const bestHistorical = matchingPos.length > 0
    ? Math.min(...matchingPos.map((p) => Number(p.rate)))
    : Math.round(baseRate * 0.95);

  const targetPrice = Math.round(bestHistorical + (baseRate - bestHistorical) * 0.5);
  const increasePct = baseRate > 0 ? ((currentQuote - baseRate) / baseRate) * 100 : 0;
  const savingAtTarget = (currentQuote - targetPrice) * Number(qty || 0);
  const savingAtBase = (currentQuote - baseRate) * Number(qty || 0);

  // When SKU changes, auto-suggest a quote slightly above base rate
  function handleProductChange(newSku) {
    setSku(newSku);
    const prod = catalog.find((p) => p.sku.toUpperCase() === newSku.toUpperCase());
    const rate = Number(prod?.defaultRate) || 495;
    setCurrentQuote(Math.round(rate * 1.06));
  }

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-6 flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold text-lg mb-1">Negotiation Inputs</h3>
          <p className="text-xs text-ink-muted mb-4">
            Select product to view the price stored during PO creation and compute negotiation leverage.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Product / SKU</label>
              <select
                className="select font-mono text-xs"
                value={sku}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                {catalog.map((s) => (
                  <option key={s.sku} value={s.sku}>
                    {s.sku} — {s.name} (₹{s.defaultRate || 495})
                  </option>
                ))}
              </select>
            </div>

            {/* Stored Product & PO Creation Price Details Card */}
            <div className="p-3 rounded-xl bg-surface-raised border flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center text-ink-muted">
                <span>Product Name:</span>
                <span className="font-semibold text-ink truncate max-w-[140px]" title={selectedProduct?.name}>
                  {selectedProduct?.name || 'Selected Item'}
                </span>
              </div>
              <div className="flex justify-between items-center text-ink-muted">
                <span>PO Creation Target Rate:</span>
                <span className="font-mono font-bold text-primary text-sm">₹{baseRate}/unit</span>
              </div>
              <div className="text-[10px] text-ink-muted flex items-center gap-1 pt-1 border-t">
                <CheckCircle2 size={12} className="text-primary shrink-0" />
                <span>Stored when creating PO / adding product</span>
              </div>
            </div>

            <div>
              <label className="label">Planned Quantity (Units)</label>
              <input
                className="input font-mono"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label className="label">Vendor's Current Quote (₹/unit)</label>
              <input
                className="input font-mono font-semibold text-primary"
                type="number"
                value={currentQuote}
                onChange={(e) => setCurrentQuote(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] text-ink-muted pt-2 border-t flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary shrink-0" />
          <span>Auto-calculates savings against PO creation price</span>
        </div>
      </div>

      <div className="card p-6 col-span-2 flex flex-col justify-between gap-5">
        <div>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-display font-semibold text-lg">Negotiation Benchmark & Strategy</h3>
              <p className="text-xs text-ink-muted">
                Compares vendor quote with stored PO creation price and confirmed procurement benchmarks.
              </p>
            </div>
            <span className="badge bg-primary-soft text-primary font-mono text-xs font-semibold px-2.5 py-1">
              SKU: {sku}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            {/* 1. PO Creation Price */}
            <div className="kpi-card !p-3.5 border-primary/40 bg-primary-soft/10">
              <span className="section-title !text-[11px] flex items-center gap-1 text-primary">
                <Package size={11} /> PO Target Rate
              </span>
              <span className="stat-figure font-mono !text-xl text-primary font-bold">₹{baseRate}</span>
              <span className="text-[10px] text-ink-muted">Stored in PO creation</span>
            </div>

            {/* 2. Last Confirmed PO Rate */}
            <div className="kpi-card !p-3.5">
              <span className="section-title !text-[11px]">Last Confirmed PO</span>
              <span className="stat-figure font-mono !text-xl">₹{lastConfirmedRate}</span>
              <span className="text-[10px] text-ink-muted">From DB history</span>
            </div>

            {/* 3. Current Quote */}
            <div className="kpi-card !p-3.5">
              <span className="section-title !text-[11px]">Current Quote</span>
              <span className="stat-figure font-mono !text-xl">₹{currentQuote}</span>
              <span className={increasePct > 0 ? 'text-red text-[10px] font-medium' : 'text-primary text-[10px] font-medium'}>
                {increasePct > 0 ? '+' : ''}{increasePct.toFixed(1)}% vs Target Rate
              </span>
            </div>

            {/* 4. Suggested Target */}
            <div className="kpi-card !p-3.5 border-2" style={{ borderColor: 'var(--color-primary)' }}>
              <span className="section-title !text-[11px] flex items-center gap-1 text-primary font-bold">
                <Target size={11} /> Suggested Target
              </span>
              <span className="stat-figure font-mono !text-xl" style={{ color: 'var(--color-primary-strong)' }}>
                ₹{targetPrice}
              </span>
              <span className="text-[10px] text-primary font-medium">Optimal benchmark</span>
            </div>
          </div>

          {/* Detailed Negotiation Strategy Card */}
          <div className="p-4 rounded-xl border flex flex-col gap-3" style={{ background: 'var(--color-primary-soft)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-ink flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-primary" /> Cost Savings Breakdown
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                Volume: {Number(qty).toLocaleString('en-IN')} units
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface border flex flex-col gap-0.5">
                <span className="text-[11px] text-ink-muted">Savings at PO Target Rate (₹{baseRate}):</span>
                <strong className="font-mono text-sm text-primary">
                  {savingAtBase >= 0 ? `₹${savingAtBase.toLocaleString('en-IN')}` : `₹0 (Within budget)`}
                </strong>
                <span className="text-[10px] text-ink-muted">
                  Difference: ₹{(currentQuote - baseRate).toFixed(2)}/unit
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface border flex flex-col gap-0.5">
                <span className="text-[11px] text-ink-muted">Savings at Suggested Target (₹{targetPrice}):</span>
                <strong className="font-mono text-sm text-emerald-700">
                  {savingAtTarget >= 0 ? `₹${savingAtTarget.toLocaleString('en-IN')}` : `₹0`}
                </strong>
                <span className="text-[10px] text-ink-muted">
                  Difference: ₹{(currentQuote - targetPrice).toFixed(2)}/unit
                </span>
              </div>
            </div>

            <p className="text-xs text-ink leading-relaxed">
              💡 <strong>Negotiation Tip:</strong> Your stored PO target of <strong className="font-mono">₹{baseRate}</strong> provides <strong className="font-mono">₹{(currentQuote - baseRate).toFixed(2)}/unit</strong> in negotiation room. Counter with <strong className="font-mono text-primary">₹{targetPrice}</strong> for an order of <strong className="font-mono">{Number(qty).toLocaleString('en-IN')} units</strong> to save <strong className="font-mono font-bold text-primary">₹{savingAtTarget.toLocaleString('en-IN')}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
