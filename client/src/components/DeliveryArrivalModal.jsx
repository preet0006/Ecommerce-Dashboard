import React, { useState, useEffect } from 'react';
import {
  PackageCheck, CheckCircle2, XCircle, Clock, AlertTriangle,
  X, Truck, Loader2, ArrowRight, ShieldCheck, HelpCircle, Calendar, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';

export default function DeliveryArrivalModal() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [statusChoice, setStatusChoice]   = useState('NONE'); // 'NONE' | 'LATE'
  const [delayDays, setDelayDays]         = useState('2');
  const [feedback, setFeedback]           = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [toastMessage, setToastMessage]   = useState(null);

  // Load pending delivery checks only when Day 9-10 or due date is reached
  const fetchPendingChecks = () => {
    // Check if dismissed in this session
    const isDismissedSession = sessionStorage.getItem('delivery_modal_dismissed_until');
    if (isDismissedSession && Date.now() < Number(isDismissedSession)) {
      return;
    }

    api.getPendingDeliveries()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPendingOrders(data);
          setIsOpen(true);
        } else {
          setPendingOrders([]);
          setIsOpen(false);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Check on startup after dashboard initial load
    const timer = setTimeout(fetchPendingChecks, 1500);
    return () => clearTimeout(timer);
  }, []);

  const currentPo = pendingOrders[currentIndex];

  if (!isOpen || !currentPo) return null;

  async function handleOnTime() {
    setSubmitting(true);
    try {
      await api.recordDeliveryArrival(currentPo.id, {
        timeliness: 'on_time',
        delayDays: 0,
        feedback: 'Delivered exactly on promised schedule',
      });

      setToastMessage(`✅ PO ${currentPo.poNumber} recorded as Delivered On Time!`);
      advanceToNext();
    } catch (err) {
      alert(`Failed to record delivery: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const days = Math.max(1, Number(delayDays) || 1);
      await api.recordDeliveryArrival(currentPo.id, {
        timeliness: 'late',
        delayDays: days,
        feedback: feedback || `Delayed by ${days} days past promised delivery date`,
      });

      setToastMessage(`⚠️ PO ${currentPo.poNumber} recorded as Delivered (${days} days late). Vendor delivery score updated.`);
      advanceToNext();
    } catch (err) {
      alert(`Failed to record delivery: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  function advanceToNext() {
    setStatusChoice('NONE');
    setDelayDays('2');
    setFeedback('');
    if (currentIndex + 1 < pendingOrders.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsOpen(false);
      setPendingOrders([]);
    }
  }

  function handlePostpone() {
    // Postpone for the next 15 minutes / tab session so user isn't interrupted on every link click
    sessionStorage.setItem('delivery_modal_dismissed_until', String(Date.now() + 15 * 60 * 1000));
    setIsOpen(false);
  }

  const givenTimeline = currentPo.givenDays || 15;
  const autoCheckThreshold = currentPo.reminderDaysThreshold || Math.max(1, Math.round(givenTimeline * 0.67));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-enter bg-surface"
        style={{
          border: '2px solid var(--color-primary)',
          maxHeight: '90vh',
        }}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b bg-surface-raised rounded-t-2xl" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Clock size={12} /> DAY {autoCheckThreshold} OF {givenTimeline} REACHED ({currentIndex + 1} of {pendingOrders.length})
              </span>
              <span className="text-xs text-ink-muted font-mono">{currentPo.poNumber}</span>
            </div>
            <h2 className="font-display font-bold text-lg mt-1.5 text-ink flex items-center gap-2">
              <PackageCheck size={20} style={{ color: 'var(--color-primary)' }} />
              Has the delivery arrived for this Purchase Order?
            </h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Day {autoCheckThreshold} follow-up milestone reached for {givenTimeline}-day delivery timeline.
            </p>
          </div>
          <button
            onClick={handlePostpone}
            className="btn-ghost !p-2 shrink-0 text-ink-muted hover:text-ink"
            title="Postpone check (will ask again on next session)"
          >
            <X size={18} />
          </button>
        </div>

        {/* PO Details Pill */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="p-4 rounded-xl border border-primary/30 bg-primary-soft flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] text-ink-muted block">Vendor</span>
                <strong className="text-base text-ink font-semibold">{currentPo.vendorName}</strong>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-ink-muted block">SKU</span>
                <strong className="font-mono text-primary font-bold">{currentPo.sku}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 mt-1 border-t border-primary/20 text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">Quantity</span>
                <span className="font-mono font-semibold">{Number(currentPo.quantity).toLocaleString('en-IN')} units</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Agreed Rate</span>
                <span className="font-mono font-semibold">₹{currentPo.rate}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Promised ETA</span>
                <span className="font-mono font-bold text-amber-800">{currentPo.expectedDelivery || `${givenTimeline} days`}</span>
              </div>
            </div>
          </div>

          {/* Question / Choices */}
          {statusChoice === 'NONE' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Select Delivery Status:
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* On Time Button */}
                <button
                  type="button"
                  className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  onClick={handleOnTime}
                  disabled={submitting}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="font-display font-bold text-sm text-emerald-950">
                    Delivered On Time
                  </span>
                  <span className="text-[10px] text-emerald-700 text-center">
                    Arrived on schedule (0 days delay)
                  </span>
                </button>

                {/* Late Button */}
                <button
                  type="button"
                  className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/70 hover:bg-amber-100 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  onClick={() => setStatusChoice('LATE')}
                  disabled={submitting}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="font-display font-bold text-sm text-amber-950">
                    Delivered Late
                  </span>
                  <span className="text-[10px] text-amber-800 text-center">
                    Arrived with delay in days
                  </span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-xs text-ink-muted underline hover:text-ink cursor-pointer"
                  onClick={handlePostpone}
                >
                  Delivery not arrived yet (remind me later)
                </button>
              </div>
            </div>
          )}

          {/* Late Input Sub-Form */}
          {statusChoice === 'LATE' && (
            <form onSubmit={handleLateSubmit} className="p-4 rounded-xl border border-amber-300 bg-amber-50/60 flex flex-col gap-3 animate-enter">
              <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1">
                  <AlertTriangle size={14} className="text-amber-600" /> Specify Late Delivery Details
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">{currentPo.vendorName}</span>
              </div>

              <div>
                <label className="label text-xs font-semibold">
                  How many days was the delivery late? <span className="text-red">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    className="input font-mono font-bold text-base w-28"
                    value={delayDays}
                    onChange={(e) => setDelayDays(e.target.value)}
                  />
                  <span className="text-xs text-ink-muted">days past promised deadline</span>
                </div>
              </div>

              <div>
                <label className="label text-xs font-semibold">
                  Vendor Performance Feedback / Notes (Optional)
                </label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Dispatched 3 days late; material passed quality check"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="btn-outline !py-1 !px-3 text-xs"
                  onClick={() => setStatusChoice('NONE')}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-primary !bg-amber-600 !border-amber-600 !py-1.5 !px-4 text-xs font-bold"
                  disabled={submitting || !delayDays}
                >
                  {submitting ? (
                    <><Loader2 size={13} className="animate-spin" /> Recording…</>
                  ) : (
                    <><CheckCircle2 size={14} /> Record {delayDays} Days Delay</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-surface-raised rounded-b-2xl text-xs text-ink-muted" style={{ borderColor: 'var(--color-border)' }}>
          <span>
            {pendingOrders.length - currentIndex} pending order verification(s) remaining.
          </span>
          <button
            type="button"
            className="btn-outline !py-1.5 !px-3 text-xs"
            onClick={handlePostpone}
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}
