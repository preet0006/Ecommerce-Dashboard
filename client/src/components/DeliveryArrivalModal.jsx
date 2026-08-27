import React, { useState, useEffect } from 'react';
import {
  PackageCheck, CheckCircle2, XCircle, Clock, AlertTriangle,
  X, Truck, Loader2, ArrowRight, ShieldCheck, HelpCircle, Calendar, Sparkles, BellRing
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

  // Load pending delivery checks only when Day threshold is reached and not snoozed
  const fetchPendingChecks = (forceOpen = false) => {
    if (!forceOpen) {
      const snoozedUntil = localStorage.getItem('delivery_modal_snoozed_until');
      if (snoozedUntil && Date.now() < Number(snoozedUntil)) {
        return;
      }
    }

    api.getPendingDeliveries()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPendingOrders(data);
          setCurrentIndex(0);
          setIsOpen(true);
        } else {
          setPendingOrders([]);
          setIsOpen(false);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Listen for manual trigger from Topbar or Purchase page
    const handleOpenEvent = () => fetchPendingChecks(true);
    window.addEventListener('open-delivery-modal', handleOpenEvent);

    return () => {
      window.removeEventListener('open-delivery-modal', handleOpenEvent);
    };
  }, []);

  const currentPo = pendingOrders[currentIndex];

  if (!isOpen || !currentPo) return null;

  async function handleOnTime() {
    setSubmitting(true);
    try {
      await api.recordDeliveryArrival(currentPo.id, {
        timeliness: 'on_time',
        delayDays: 0,
        feedback: 'Delivered on schedule (0 delay)',
      });

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
      // Clear snoozed since all were reviewed
      localStorage.removeItem('delivery_modal_snoozed_until');
    }
  }

  // Snooze reminder for specific duration
  function handleSnooze(days = 1) {
    const snoozeMs = days * 24 * 60 * 60 * 1000;
    localStorage.setItem('delivery_modal_snoozed_until', String(Date.now() + snoozeMs));
    setIsOpen(false);
  }

  const givenTimeline = Number(currentPo.givenDays) || 15;
  const createdTime = new Date(currentPo.createdAt).getTime();
  const elapsedDays = Math.max(1, Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-enter bg-surface border border-border"
        style={{ maxHeight: '90vh' }}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-border bg-surface-raised rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock size={12} /> DAY {Math.min(elapsedDays, givenTimeline)} OF {givenTimeline} DELIVERY DUE ({currentIndex + 1} of {pendingOrders.length})
              </span>
              <span className="text-xs text-ink-muted font-mono">{currentPo.poNumber}</span>
            </div>
            <h2 className="font-display font-bold text-base sm:text-lg mt-1.5 text-ink flex items-center gap-2">
              <PackageCheck size={20} className="text-primary" />
              Has this Purchase Order arrived?
            </h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              14th–15th day delivery due milestone reached for {currentPo.vendorName}.
            </p>
          </div>
          <button
            onClick={() => handleSnooze(1)}
            className="btn-ghost !p-2 shrink-0 text-ink-muted hover:text-ink"
            title="Snooze for 24 hours"
          >
            <X size={18} />
          </button>
        </div>

        {/* PO Details Card */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="p-4 rounded-xl border border-primary/20 bg-primary-soft/50 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] text-ink-muted block">Vendor Partner</span>
                <strong className="text-sm text-ink font-semibold">{currentPo.vendorName}</strong>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-ink-muted block">Product / SKU</span>
                <strong className="font-mono text-primary font-bold">{currentPo.sku}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 mt-1 border-t border-primary/10 text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">Quantity</span>
                <span className="font-mono font-semibold">{Number(currentPo.quantity).toLocaleString('en-IN')} units</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Agreed Rate</span>
                <span className="font-mono font-semibold">₹{currentPo.rate}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Expected Due</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {currentPo.expectedDelivery || `${givenTimeline} days`}
                </span>
              </div>
            </div>
          </div>

          {/* Question / Status Choices */}
          {statusChoice === 'NONE' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Select Current Delivery State:
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* On Time Button */}
                <button
                  type="button"
                  className="p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/30 hover:border-emerald-500 hover:bg-emerald-100/70 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  onClick={handleOnTime}
                  disabled={submitting}
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="font-display font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-300">
                    Delivered On Time
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 text-center">
                    Arrived on schedule (0 delay)
                  </span>
                </button>

                {/* Late Button */}
                <button
                  type="button"
                  className="p-4 rounded-xl border-2 border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/30 hover:border-amber-500 hover:bg-amber-100/70 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  onClick={() => setStatusChoice('LATE')}
                  disabled={submitting}
                >
                  <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangle size={18} />
                  </div>
                  <span className="font-display font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-300">
                    Delivered Late
                  </span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-400 text-center">
                    Arrived with delay in days
                  </span>
                </button>
              </div>

              {/* Snooze & Dismiss options */}
              <div className="mt-3 p-3 rounded-xl bg-surface-raised border border-border flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-ink-muted">
                  Not delivered yet? Snooze reminder:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn-outline !text-[11px] !py-1 !px-2.5"
                    onClick={() => handleSnooze(1)}
                  >
                    ⏰ Remind in 1 Day
                  </button>
                  <button
                    type="button"
                    className="btn-outline !text-[11px] !py-1 !px-2.5"
                    onClick={() => handleSnooze(3)}
                  >
                    ⏰ Remind in 3 Days
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !text-[11px] !py-1 !px-2 text-ink-muted hover:text-ink"
                    onClick={() => handleSnooze(7)}
                  >
                    Snooze 7 Days
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Late Input Sub-Form */}
          {statusChoice === 'LATE' && (
            <form onSubmit={handleLateSubmit} className="p-4 rounded-xl border border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col gap-3 animate-enter">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-1.5">
                <span className="font-bold text-xs text-amber-950 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle size={14} className="text-amber-600" /> Specify Late Delivery Details
                </span>
                <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold">{currentPo.vendorName}</span>
              </div>

              <div>
                <label className="label text-xs font-semibold">
                  How many days was the delivery late? <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    className="input font-mono font-bold text-sm w-24"
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
                  placeholder="e.g. Dispatched late due to raw material delay"
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
        <div className="flex items-center justify-between p-4 border-t border-border bg-surface-raised rounded-b-2xl text-xs text-ink-muted">
          <span>
            {pendingOrders.length - currentIndex} pending order verification(s) remaining.
          </span>
          <button
            type="button"
            className="btn-outline !py-1.5 !px-3 text-xs"
            onClick={() => handleSnooze(1)}
          >
            Remind Me Tomorrow
          </button>
        </div>
      </div>
    </div>
  );
}
