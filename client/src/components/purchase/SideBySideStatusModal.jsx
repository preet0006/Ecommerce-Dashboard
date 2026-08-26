import React, { useState } from 'react';
import {
  X, Loader2, CheckCircle2, XCircle, Mail, Calendar,
  Check, AlertTriangle
} from 'lucide-react';
import { api } from '../../lib/api';
import { calculateDeliveryDays, getDefaultDate } from './utils';

const QUICK_REASONS = [
  'Rate quoted higher than target',
  'Delivery schedule / ETA not acceptable',
  'Stock / Material currently unavailable',
  'Vendor declined order terms',
];

/* ══════════════════════════════════════════════════════════════
   SIDE-BY-SIDE VENDOR STATUS POP-UP MODAL
   – Shows: "You have 3 statuses to update"
   – Renders all pending vendors side-by-side
   – Dynamically matches expected delivery date with current date
══════════════════════════════════════════════════════════════ */
export default function SideBySideStatusModal({ queue, onClose, onConfirmApproval, onRejectOrder }) {
  const [vendorStates, setVendorStates] = useState(() => {
    const map = {};
    queue.forEach((po) => {
      map[po.id] = {
        action: 'NONE',
        qty: String(po.quantity || 2500),
        rate: String(po.rate || 495),
        creditDays: String(po.creditDays || 30),
        delivery: po.expectedDelivery || getDefaultDate(14),
        notes: po.notes || '',
        rejectReason: '',
        remarks: '',
        loading: false,
      };
    });
    return map;
  });

  const updateVendorState = (poId, patch) => {
    setVendorStates((prev) => ({
      ...prev,
      [poId]: { ...prev[poId], ...patch },
    }));
  };

  async function handleConfirmSingleVendor(po) {
    const vState = vendorStates[po.id] || {};
    updateVendorState(po.id, { loading: true });

    const timeline = calculateDeliveryDays(vState.delivery);
    const payload = {
      quantity: Number(vState.qty) || Number(po.quantity),
      rate: Number(vState.rate) || Number(po.rate),
      creditDays: Number(vState.creditDays) || Number(po.creditDays || 30),
      expectedDelivery: vState.delivery || po.expectedDelivery || '',
      givenDays: timeline.days,
      productName: po.productName || po.sku,
      sku: po.sku,
      notes: (vState.notes || '') + (vState.remarks ? ` [Approval Note: ${vState.remarks}]` : ''),
    };

    let confirmedOrder = { ...po, ...payload, status: 'confirmed' };
    try {
      const res = await api.confirmPurchaseOrder(po.id, payload);
      if (res && res.po) {
        confirmedOrder = res.po;
      }
    } catch (err) {
      console.warn('[handleConfirmSingleVendor] API note:', err.message);
    } finally {
      updateVendorState(po.id, { loading: false });
      onConfirmApproval(confirmedOrder);
    }
  }

  async function handleRejectSingleVendor(po) {
    const vState = vendorStates[po.id] || {};
    updateVendorState(po.id, { loading: true });

    const reason = vState.rejectReason?.trim() || 'Vendor declined order / target terms not accepted';
    let rejectedOrder = { ...po, status: 'rejected', rejectionReason: reason };

    try {
      const res = await api.rejectPurchaseOrder(po.id, { rejectionReason: reason });
      if (res && res.po) {
        rejectedOrder = res.po;
      }
    } catch (err) {
      console.warn('[handleRejectSingleVendor] API note:', err.message);
    } finally {
      updateVendorState(po.id, { loading: false });
      onRejectOrder(po.id, reason, rejectedOrder);
    }
  }

  const count = queue.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col animate-enter bg-surface"
        style={{
          border: '2px solid var(--color-border)',
          maxHeight: '92vh',
        }}
      >
        {/* Modal Top Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b bg-surface-raised rounded-t-2xl" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                🔴 ACTION REQUIRED
              </span>
              <span className="text-xs text-ink-muted font-medium">Multi-Vendor Approval Hub</span>
            </div>
            <h2 className="font-display font-bold text-xl mt-1 text-ink flex items-center gap-2">
              You have {count} status{count > 1 ? 'es' : ''} to update
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Review responses from the {count} vendor{count > 1 ? 's' : ''} you emailed side by side. Choose <strong>Confirmed</strong> to verify & place order, or <strong>Rejected</strong> to record reason.
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost !p-2 shrink-0" title="Close Modal">
            <X size={20} />
          </button>
        </div>

        {/* Side-by-side Vendors Container */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className={`grid grid-cols-1 ${count === 2 ? 'md:grid-cols-2' : count >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-5`}>
            {queue.map((po, index) => {
              const vState = vendorStates[po.id] || {
                action: 'NONE',
                qty: String(po.quantity || 2500),
                rate: String(po.rate || 495),
                creditDays: String(po.creditDays || 30),
                delivery: po.expectedDelivery || getDefaultDate(14),
                notes: po.notes || '',
                rejectReason: '',
                remarks: '',
                loading: false,
              };

              const numQty = Number(vState.qty) || 0;
              const numRate = Number(vState.rate) || 0;
              const totalVal = numQty * numRate;
              const dynamicTimeline = calculateDeliveryDays(vState.delivery);

              return (
                <div
                  key={po.id}
                  className="rounded-2xl border-2 p-5 flex flex-col justify-between transition-all bg-surface shadow-sm"
                  style={{
                    borderColor: vState.action === 'CONFIRM'
                      ? 'var(--color-ok)'
                      : vState.action === 'REJECT'
                        ? 'var(--color-red)'
                        : 'var(--color-border)',
                  }}
                >
                  {/* Vendor Top Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-surface-raised border">
                        Vendor {index + 1} of {count}
                      </span>
                      <span className="font-mono text-xs text-ink-muted">{po.poNumber || `PO-${po.id}`}</span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-ink">{po.vendorName}</h3>
                    {po.vendorEmail && (
                      <span className="text-xs text-primary font-medium flex items-center gap-1 mb-3">
                        <Mail size={11} /> {po.vendorEmail}
                      </span>
                    )}

                    {/* Inquiry summary pill */}
                    <div className="p-3 rounded-xl bg-surface-raised border text-xs flex flex-col gap-1.5 mb-4">
                      <div className="flex justify-between items-start">
                        <span className="text-ink-muted">Item / SKU:</span>
                        <div className="text-right max-w-[65%]">
                          <div className="font-semibold text-ink truncate" title={po.productName || po.sku}>{po.productName || po.sku}</div>
                          <span className="font-mono text-[11px] text-ink-muted">{po.sku}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Inquired Qty:</span>
                        <span className="font-mono font-semibold">{Number(po.quantity).toLocaleString('en-IN')} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Target Rate:</span>
                        <span className="font-mono font-semibold text-primary">₹{po.rate}/unit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Calculated Days:</span>
                        <span className="font-mono font-bold text-primary">{po.givenDays || dynamicTimeline.days} days</span>
                      </div>
                      {po.expectedDelivery && (
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Delivery ETA:</span>
                          <span className="font-mono">{po.expectedDelivery}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Question Banner */}
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 mb-3 text-xs">
                      <span className="font-semibold text-red-800 block mb-1">
                        What is the status of the order sent to {po.vendorName}?
                      </span>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          type="button"
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                            vState.action === 'CONFIRM'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                          onClick={() => updateVendorState(po.id, { action: 'CONFIRM' })}
                        >
                          <Check size={14} /> Confirmed
                        </button>

                        <button
                          type="button"
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                            vState.action === 'REJECT'
                              ? 'bg-red-600 text-white border-red-700 shadow-xs'
                              : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                          }`}
                          onClick={() => updateVendorState(po.id, { action: 'REJECT' })}
                        >
                          <X size={14} /> Rejected
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Form depending on status selection */}
                  <div className="mt-2">
                    {/* If Confirmed -> Show "Verify Details" */}
                    {vState.action === 'CONFIRM' && (
                      <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40 flex flex-col gap-3 animate-enter">
                        <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                          <span className="font-bold text-xs text-emerald-950 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Verify & Finalize Details
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">Editable</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-semibold text-ink-muted block mb-0.5">Quantity</label>
                            <input
                              type="number"
                              className="input !py-1 !px-2 text-xs font-mono"
                              value={vState.qty}
                              onChange={(e) => updateVendorState(po.id, { qty: e.target.value })}
                              required
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-ink-muted block mb-0.5">Confirmed Rate (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="input !py-1 !px-2 text-xs font-mono font-bold text-primary"
                              value={vState.rate}
                              onChange={(e) => updateVendorState(po.id, { rate: e.target.value })}
                              required
                              min="0.01"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-ink-muted block mb-0.5">Credit Days</label>
                            <input
                              type="number"
                              className="input !py-1 !px-2 text-xs font-mono"
                              value={vState.creditDays}
                              onChange={(e) => updateVendorState(po.id, { creditDays: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-ink-muted block mb-0.5">Delivery Date</label>
                            <input
                              type="date"
                              className="input !py-1 !px-2 text-[11px]"
                              value={vState.delivery}
                              onChange={(e) => updateVendorState(po.id, { delivery: e.target.value })}
                            />
                          </div>

                          <div className="col-span-2 p-1.5 rounded bg-emerald-100/70 border border-emerald-300 text-[10px] text-emerald-900 font-medium flex items-center gap-1">
                            <Calendar size={12} className="text-emerald-700" />
                            <span>Matched with today: <strong>{dynamicTimeline.days} days</strong> allotted (Auto Follow-up Day {dynamicTimeline.autoCheckDay})</span>
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-semibold text-ink-muted block mb-0.5">Notes / Terms</label>
                            <textarea
                              rows={2}
                              className="textarea !py-1 !px-2 text-[11px]"
                              placeholder="Specifications, SLA notes..."
                              value={vState.notes}
                              onChange={(e) => updateVendorState(po.id, { notes: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-surface border flex items-center justify-between text-xs">
                          <span className="text-[11px] text-ink-muted">Total Value:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            ₹{totalVal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn-primary !py-2 !text-xs w-full justify-center font-bold"
                          onClick={() => handleConfirmSingleVendor(po)}
                          disabled={!numQty || !numRate || vState.loading}
                        >
                          {vState.loading ? (
                            <><Loader2 size={13} className="animate-spin" /> Saving to DB…</>
                          ) : (
                            <><CheckCircle2 size={14} /> Confirm & Save Order in DB</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* If Rejected -> Show Reason Box */}
                    {vState.action === 'REJECT' && (
                      <div className="p-3.5 rounded-xl border border-red-300 bg-red-50/40 flex flex-col gap-2.5 animate-enter">
                        <span className="font-bold text-xs text-red-950 flex items-center gap-1">
                          <XCircle size={13} className="text-red-600" /> Rejection Reason for {po.vendorName}
                        </span>

                        {/* Quick Reason Chips */}
                        <div className="flex flex-wrap gap-1">
                          {QUICK_REASONS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                vState.rejectReason === r
                                  ? 'bg-red-600 text-white border-red-700 font-semibold'
                                  : 'bg-white/80 hover:bg-white text-ink border-red-200'
                              }`}
                              onClick={() => updateVendorState(po.id, { rejectReason: r })}
                            >
                              {r}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={2}
                          className="textarea !py-1.5 !px-2 text-xs"
                          placeholder="Type reason or pick a quick option above..."
                          value={vState.rejectReason}
                          onChange={(e) => updateVendorState(po.id, { rejectReason: e.target.value })}
                        />

                        <button
                          type="button"
                          className="btn-primary !bg-red-600 !border-red-600 hover:!bg-red-700 !py-2 !text-xs w-full justify-center font-bold"
                          onClick={() => handleRejectSingleVendor(po)}
                          disabled={vState.loading}
                        >
                          {vState.loading ? (
                            <><Loader2 size={13} className="animate-spin" /> Rejecting…</>
                          ) : (
                            <><XCircle size={14} /> Submit Rejection for {po.vendorName}</>
                          )}
                        </button>
                      </div>
                    )}

                    {vState.action === 'NONE' && (
                      <div className="text-center py-2 text-ink-muted text-[11px]">
                        Select <strong>Confirmed</strong> or <strong>Rejected</strong> above to proceed.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-surface-raised rounded-b-2xl" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-xs text-ink-muted">
            {count} vendor inquiries awaiting final decision.
          </span>
          <button type="button" className="btn-outline !py-2 !px-4 text-xs font-semibold" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
