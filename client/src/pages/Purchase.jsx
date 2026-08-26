import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList, FilePlus, ListChecks, HandCoins, ChevronRight,
  Truck, CheckCircle2, XCircle, Clock, Target,
  Send, Users, X, Loader2, ChevronDown, ChevronUp, Mail, Phone, ExternalLink, AlertTriangle,
  Edit3, Check, Sparkles, ArrowRight, ShieldCheck, HelpCircle, AlertCircle, RefreshCw, BellRing, Calendar
} from 'lucide-react';
import { api } from '../lib/api';

/* ============================================================
   DATE & DYNAMIC TIMELINE CALCULATION HELPER
   – Matches expected delivery date against current date
   – Accurately calculates dynamic days allotted and follow-up day
   ============================================================ */

export function calculateDeliveryDays(deliveryDateStr) {
  if (!deliveryDateStr) {
    return { days: 15, isCalculated: false, autoCheckDay: 10, formattedNotice: '15 days default (Auto-check Day 10)' };
  }

  const target = new Date(deliveryDateStr);
  if (isNaN(target.getTime())) {
    return { days: 15, isCalculated: false, autoCheckDay: 10, formattedNotice: '15 days default (Auto-check Day 10)' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);

  const diffMs = targetDay.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const finalDays = Math.max(1, diffDays);
  const autoCheckDay = Math.max(1, Math.round(finalDays * 0.67));

  return {
    days: finalDays,
    isCalculated: true,
    autoCheckDay,
    formattedNotice: `${finalDays} days allotted (Auto follow-up on Day ${autoCheckDay} · Due in ${finalDays} days)`,
  };
}

// Generate a default date X days from today formatted as YYYY-MM-DD
function getDefaultDate(daysAhead = 14) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

/* ============================================================
   STATIC BACKUP / INITIAL DATA
   ============================================================ */

const MOCK_SKUS = ['GF-CAS-001', 'GF-BWL-014', 'GF-PET-002', 'GF-CAS-005'];

const FALLBACK_POS = [
  { id: 1, poNumber: 'PO-2026-0142', vendorName: 'Shreeji Plastics', sku: 'GF-CAS-001', quantity: 2500, rate: '495.00', totalValue: '1237500.00', creditDays: 30, givenDays: 14, reminderDaysThreshold: 9, status: 'confirmed', expectedDelivery: getDefaultDate(14), notes: 'Standard packing', reminderSent: 'false' },
  { id: 2, poNumber: 'PO-2026-0139', vendorName: 'Anand Steelware', sku: 'GF-PET-002', quantity: 1200, rate: '118.00', totalValue: '141600.00', creditDays: 15, givenDays: 10, reminderDaysThreshold: 7, status: 'confirmed', expectedDelivery: getDefaultDate(10), notes: 'Stainless steel grade 304', reminderSent: 'true', reminderSentAt: '2026-08-20T10:00:00.000Z' },
  { id: 3, poNumber: 'PO-2026-0137', vendorName: 'Shreeji Plastics', sku: 'GF-CAS-005', quantity: 400, rate: '1085.00', totalValue: '434000.00', creditDays: 30, givenDays: 7, reminderDaysThreshold: 5, status: 'rejected', expectedDelivery: getDefaultDate(7), rejectionReason: 'Rate quoted higher than target', reminderSent: 'false' },
];

const FALLBACK_APPROVAL_QUEUE = [
  {
    id: 101,
    poNumber: 'PO-2026-0151',
    vendorName: 'Shreeji Plastics',
    vendorEmail: 'orders@shreeji.com',
    sku: 'GF-CAS-001',
    quantity: 2500,
    rate: '495.00',
    totalValue: '1237500.00',
    creditDays: 30,
    givenDays: 14,
    reminderDaysThreshold: 9,
    expectedDelivery: getDefaultDate(14),
    notes: 'Standard export packaging requested',
    requestedBy: 'Purchase Team',
    status: 'pending',
    emailStatus: 'sent',
  },
  {
    id: 102,
    poNumber: 'PO-2026-0152',
    vendorName: 'Puneet Enterprises',
    vendorEmail: 'ps743298@gmail.com',
    sku: 'GF-CAS-001',
    quantity: 2500,
    rate: '495.00',
    totalValue: '1237500.00',
    creditDays: 42,
    givenDays: 18,
    reminderDaysThreshold: 12,
    expectedDelivery: getDefaultDate(18),
    notes: 'Direct factory delivery batch #1',
    requestedBy: 'Purchase Team',
    status: 'pending',
    emailStatus: 'sent',
  },
  {
    id: 103,
    poNumber: 'PO-2026-0153',
    vendorName: 'Komal Packaging Co.',
    vendorEmail: 'orders@komalpackaging.com',
    sku: 'GF-CAS-001',
    quantity: 2500,
    rate: '495.00',
    totalValue: '1237500.00',
    creditDays: 30,
    givenDays: 12,
    reminderDaysThreshold: 8,
    expectedDelivery: getDefaultDate(12),
    notes: 'Bulk inquiries sent via email broadcast',
    requestedBy: 'Purchase Team',
    status: 'pending',
    emailStatus: 'sent',
  },
];

const TABS = [
  { id: 'create',      label: 'Create PO',            icon: FilePlus },
  { id: 'list',        label: 'PO List & Status',      icon: ClipboardList },
  { id: 'approval',    label: 'Approval Queue',        icon: ListChecks },
  { id: 'negotiation', label: 'Negotiation Assistant', icon: HandCoins },
];

function statusBadge(status) {
  switch (status) {
    case 'Delivered':
    case 'delivered':        return <span className="badge-ok flex items-center gap-1"><CheckCircle2 size={12} /> Delivered</span>;
    case 'Approved':
    case 'confirmed':        return <span className="badge-ok flex items-center gap-1"><ShieldCheck size={12} /> Confirmed</span>;
    case 'In Transit':
    case 'in_transit':       return <span className="badge-warn flex items-center gap-1"><Truck size={12} /> In Transit</span>;
    case 'Pending Approval':
    case 'pending':          return <span className="badge-warn flex items-center gap-1"><Clock size={12} /> Pending Approval</span>;
    case 'Rejected':
    case 'rejected':         return <span className="badge-danger flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
    default:                 return <span className="badge">{status}</span>;
  }
}

/* ══════════════════════════════════════════════════════════════
   VENDOR SEND MODAL
   – Saves to purchase_orders schema in DB (status: 'pending')
   – Dispatches HTML PO email to vendor
══════════════════════════════════════════════════════════════ */
function VendorSendModal({ poDetails, onClose, onOrdersCreated }) {
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [sentMap, setSentMap]       = useState({});
  const [sendingMap, setSendingMap] = useState({});
  const [errorMap, setErrorMap]     = useState({});
  const [sendingAll, setSendingAll] = useState(false);
  const [globalNotice, setGlobalNotice] = useState(null);

  const timeline = calculateDeliveryDays(poDetails.delivery);

  useEffect(() => {
    setLoading(true);
    api.getVendors()
      .then((data) => {
        setVendors(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Send email to a single vendor & save in DB schema with dynamic days
  async function handleSend(vendor) {
    if (!vendor.email) {
      setErrorMap((prev) => ({
        ...prev,
        [vendor.id]: 'No email address found for this vendor. Update email in Vendor Master.',
      }));
      return;
    }

    setSendingMap((s) => ({ ...s, [vendor.id]: true }));
    setErrorMap((e) => ({ ...e, [vendor.id]: null }));

    try {
      const created = await api.createPurchaseOrder({
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        vendorContact: vendor.contact,
        sku: poDetails.sku || 'GF-CAS-001',
        quantity: Number(poDetails.qty) || 2500,
        rate: Number(poDetails.rate) || 495,
        creditDays: Number(poDetails.creditDays || vendor.creditDays || 30),
        givenDays: timeline.days,
        reminderDaysThreshold: timeline.autoCheckDay,
        expectedDelivery: poDetails.delivery || '',
        notes: poDetails.notes || '',
        sendEmail: true,
      });

      const newOrder = created.po || {
        id: Date.now(),
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        sku: poDetails.sku || 'GF-CAS-001',
        quantity: Number(poDetails.qty) || 2500,
        rate: String(poDetails.rate || 495),
        totalValue: String((Number(poDetails.qty) || 0) * (Number(poDetails.rate) || 0)),
        creditDays: Number(poDetails.creditDays || 30),
        givenDays: timeline.days,
        reminderDaysThreshold: timeline.autoCheckDay,
        expectedDelivery: poDetails.delivery || '',
        status: 'pending',
      };

      setSentMap((s) => ({
        ...s,
        [vendor.id]: {
          success: true,
          previewUrl: created.po?.emailPreviewUrl,
          message: created.message,
        },
      }));

      if (onOrdersCreated) {
        onOrdersCreated([newOrder]);
      }
    } catch (err) {
      setErrorMap((e) => ({
        ...e,
        [vendor.id]: err.message || 'Failed to create PO and send email',
      }));
    } finally {
      setSendingMap((s) => ({ ...s, [vendor.id]: false }));
    }
  }

  // Send to all vendors & save in DB schema with dynamic days
  async function handleSendAll() {
    setSendingAll(true);
    setGlobalNotice(null);

    const unsentVendors = vendors.filter((v) => !sentMap[v.id]);
    const createdOrders = [];
    const newSent = { ...sentMap };
    const newErrors = { ...errorMap };

    for (const v of unsentVendors) {
      if (!v.email) continue;
      try {
        const created = await api.createPurchaseOrder({
          vendorId: v.id,
          vendorName: v.name,
          vendorEmail: v.email,
          vendorContact: v.contact,
          sku: poDetails.sku || 'GF-CAS-001',
          quantity: Number(poDetails.qty) || 2500,
          rate: Number(poDetails.rate) || 495,
          creditDays: Number(poDetails.creditDays || v.creditDays || 30),
          givenDays: timeline.days,
          reminderDaysThreshold: timeline.autoCheckDay,
          expectedDelivery: poDetails.delivery || '',
          notes: poDetails.notes || '',
          sendEmail: true,
        });

        if (created.po) {
          createdOrders.push(created.po);
          newSent[v.id] = {
            success: true,
            previewUrl: created.po.emailPreviewUrl,
          };
          delete newErrors[v.id];
        }
      } catch (err) {
        newErrors[v.id] = err.message;
      }
    }

    setSentMap(newSent);
    setErrorMap(newErrors);
    setGlobalNotice(`Emails sent & saved to DB for ${createdOrders.length} vendors (${timeline.days} days allotted). Inquiries queued in Approval Queue!`);

    if (createdOrders.length > 0 && onOrdersCreated) {
      onOrdersCreated(createdOrders);
    }
    setSendingAll(false);
  }

  const allSent = vendors.length > 0 && vendors.every((v) => sentMap[v.id]);
  const sentCount = Object.keys(sentMap).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col animate-enter bg-surface"
        style={{
          border: '1px solid var(--color-border)',
          maxHeight: '88vh',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Mail size={20} style={{ color: 'var(--color-primary)' }} />
              Send Purchase Order via Email & Save to DB
            </h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Saved into database with <code className="text-xs bg-surface-raised px-1 py-0.5 rounded">status: pending</code>. Follow-up cron will check on Day {timeline.autoCheckDay} of {timeline.days}.
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2 ml-4 shrink-0" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Timeline Pill */}
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg flex flex-wrap gap-4 text-sm"
             style={{ background: 'var(--color-primary-soft)' }}>
          <span><span className="text-ink-muted">SKU:</span> <strong>{poDetails.sku || 'GF-CAS-001'}</strong></span>
          <span><span className="text-ink-muted">Qty:</span> <strong>{Number(poDetails.qty || 0).toLocaleString('en-IN')} units</strong></span>
          <span><span className="text-ink-muted">Rate:</span> <strong>₹{poDetails.rate || '0'}/unit</strong></span>
          <span><span className="text-ink-muted">Calculated Days:</span> <strong className="text-primary">{timeline.days} days</strong></span>
          <span><span className="text-ink-muted">Auto Follow-up:</span> <strong className="text-amber-800">Day {timeline.autoCheckDay}</strong></span>
        </div>

        {globalNotice && (
          <div className="mx-6 mt-3 p-3 rounded-lg text-sm border flex items-center gap-2"
               style={{ background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-strong)' }}>
            <CheckCircle2 size={16} />
            <span>{globalNotice}</span>
          </div>
        )}

        {/* Vendor list */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
          {loading && (
            <div className="flex items-center justify-center py-12 text-ink-muted gap-2">
              <Loader2 size={20} className="animate-spin" /> Loading vendors from database…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red bg-red-50">
              <XCircle size={16} /> {error}
            </div>
          )}

          {!loading && vendors.map((v) => {
            const isSent     = sentMap[v.id];
            const isSending  = sendingMap[v.id];
            const hasError   = errorMap[v.id];

            return (
              <div
                key={v.id}
                className="rounded-xl border transition-all"
                style={{
                  borderColor: isSent
                    ? 'var(--color-ok)'
                    : hasError
                      ? 'var(--color-red)'
                      : 'var(--color-border)',
                  background: isSent
                    ? 'color-mix(in srgb, var(--color-ok) 6%, var(--color-surface))'
                    : 'var(--color-surface)',
                }}
              >
                <div className="flex items-center gap-3 p-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm"
                    style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-strong)' }}
                  >
                    {(v.name || 'V').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{v.name}</span>
                      <span className="text-xs font-mono text-ink-muted">{v.vendorCode}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
                      {v.email ? (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Mail size={11} /> {v.email}
                        </span>
                      ) : (
                        <span className="text-red flex items-center gap-1">
                          <AlertTriangle size={11} /> No email configured
                        </span>
                      )}
                    </div>
                  </div>

                  {isSent ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="badge-ok flex items-center gap-1 text-xs">
                        <CheckCircle2 size={13} /> Queued in Approval
                      </span>
                      {isSent.previewUrl && (
                        <a
                          href={isSent.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost !px-2 !py-1 text-xs text-primary flex items-center gap-1"
                          title="View Sent Email Preview"
                        >
                          <ExternalLink size={12} /> Preview
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn-primary shrink-0 !py-1.5 !text-sm"
                      onClick={() => handleSend(v)}
                      disabled={isSending || sendingAll || !v.email}
                    >
                      {isSending
                        ? <><Loader2 size={13} className="animate-spin" /> Saving & Sending…</>
                        : <><Send size={13} /> Send Email</>}
                    </button>
                  )}
                </div>

                {hasError && (
                  <div className="px-4 pb-3 pt-0 text-xs text-red flex items-center gap-1.5">
                    <XCircle size={13} /> {hasError}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {!loading && vendors.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-sm text-ink-muted">
              {sentCount} of {vendors.length} vendors notified ({timeline.days} days allotted)
            </span>

            <div className="flex items-center gap-2">
              <button className="btn-outline" onClick={onClose}>
                {sentCount > 0 ? 'Go to Approval Queue' : 'Close'}
              </button>
              {!allSent && (
                <button
                  className="btn-primary"
                  onClick={handleSendAll}
                  disabled={sendingAll}
                >
                  {sendingAll
                    ? <><Loader2 size={14} className="animate-spin" /> Saving & Sending…</>
                    : <><Users size={14} /> Send Email to All</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SIDE-BY-SIDE VENDOR STATUS POP-UP MODAL
   – Shows: "You have 3 statuses to update"
   – Renders all pending vendors side-by-side
   – Dynamically matches expected delivery date with current date
══════════════════════════════════════════════════════════════ */
function SideBySideStatusModal({ queue, onClose, onConfirmApproval, onRejectOrder }) {
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

    try {
      const timeline = calculateDeliveryDays(vState.delivery);
      const payload = {
        quantity: Number(vState.qty) || Number(po.quantity),
        rate: Number(vState.rate) || Number(po.rate),
        creditDays: Number(vState.creditDays) || Number(po.creditDays || 30),
        expectedDelivery: vState.delivery || po.expectedDelivery || '',
        givenDays: timeline.days,
        notes: (vState.notes || '') + (vState.remarks ? ` [Approval Note: ${vState.remarks}]` : ''),
      };

      // Call backend API to confirm PO and set status: 'confirmed' in database
      const res = await api.confirmPurchaseOrder(po.id, payload);
      onConfirmApproval(res.po || { ...po, ...payload, status: 'confirmed' });
    } catch (err) {
      alert(`Failed to confirm order: ${err.message}`);
    } finally {
      updateVendorState(po.id, { loading: false });
    }
  }

  async function handleRejectSingleVendor(po) {
    const vState = vendorStates[po.id] || {};
    updateVendorState(po.id, { loading: true });

    try {
      const reason = vState.rejectReason || 'Vendor declined order';
      const res = await api.rejectPurchaseOrder(po.id, { rejectionReason: reason });
      onRejectOrder(po.id, reason, res.po);
    } catch (err) {
      alert(`Failed to reject order: ${err.message}`);
    } finally {
      updateVendorState(po.id, { loading: false });
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
        {/* Modal Top Header with "You have N statuses to update" */}
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
                      <div className="flex justify-between">
                        <span className="text-ink-muted">SKU:</span>
                        <strong className="font-mono text-ink">{po.sku}</strong>
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

                  {/* ── Sub-Form depending on status selection ── */}
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

                        <textarea
                          rows={3}
                          className="textarea !py-1.5 !px-2 text-xs"
                          placeholder="e.g. Target rate ₹495 not accepted; supplier demanded ₹540. Stock unavailable."
                          value={vState.rejectReason}
                          onChange={(e) => updateVendorState(po.id, { rejectReason: e.target.value })}
                          required
                        />

                        <button
                          type="button"
                          className="btn-primary !bg-red !border-red !py-2 !text-xs w-full justify-center font-bold"
                          onClick={() => handleRejectSingleVendor(po)}
                          disabled={!vState.rejectReason.trim() || vState.loading}
                        >
                          {vState.loading ? (
                            <><Loader2 size={13} className="animate-spin" /> Updating DB…</>
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

/* ══════════════════════════════════════════════════════════════
   CREATE PO TAB
   – Matches expected delivery date with current date
   – Dynamically calculates days allotted & displays live preview
══════════════════════════════════════════════════════════════ */
function CreatePO({ onOrdersCreated }) {
  const [form, setForm] = useState({
    vendor: '',
    sku: MOCK_SKUS[0],
    qty: '2500',
    rate: '495',
    creditDays: '30',
    notes: '',
    delivery: getDefaultDate(14), // Defaults to 14 days from today
  });
  const [showModal, setShowModal] = useState(false);
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const total = (Number(form.qty) || 0) * (Number(form.rate) || 0);

  // Dynamically calculate days by matching delivery date with current date
  const timeline = calculateDeliveryDays(form.delivery);

  function handleSubmit(e) {
    e.preventDefault();
    setShowModal(true);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-5 animate-enter">
        <div className="card p-6 col-span-2">
          <h3 className="font-display font-semibold text-lg mb-1">Create Purchase Order</h3>
          <p className="text-sm text-ink-muted mb-5">
            Select the Expected Delivery Date. The system matches it with today's date to calculate exact days allotted and sets the automated follow-up day.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Primary Vendor Reference</label>
                <input
                  className="input"
                  placeholder="e.g. Shreeji Plastics"
                  value={form.vendor}
                  onChange={update('vendor')}
                />
              </div>
              <div>
                <label className="label">SKU</label>
                <select className="select font-mono" value={form.sku} onChange={update('sku')}>
                  {MOCK_SKUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input className="input font-mono" type="number" placeholder="2500" value={form.qty} onChange={update('qty')} required min="1" />
              </div>
              <div>
                <label className="label">Target Rate (₹/unit)</label>
                <input className="input font-mono font-semibold" type="number" step="0.01" placeholder="495" value={form.rate} onChange={update('rate')} required min="0.01" />
              </div>
              <div>
                <label className="label">Credit Days</label>
                <input className="input font-mono" type="number" placeholder="30" value={form.creditDays} onChange={update('creditDays')} />
              </div>

              {/* Expected Delivery Date with live calculated timeline */}
              <div>
                <label className="label flex items-center justify-between">
                  <span>Expected Delivery Date</span>
                  <span className="text-[11px] text-primary font-mono font-bold">
                    {timeline.days} Days
                  </span>
                </label>
                <input
                  className="input font-mono"
                  type="date"
                  value={form.delivery}
                  onChange={update('delivery')}
                  required
                />
                <div className="mt-1.5 p-2 rounded-lg bg-surface-raised border text-[11px] text-ink-muted flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary shrink-0" />
                  <span>
                    Matched with today: <strong className="text-primary font-semibold">{timeline.days} days allotted</strong> (Auto follow-up will trigger on Day {timeline.autoCheckDay})
                  </span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="label">Notes & Specifications</label>
                <textarea
                  className="textarea" rows={3}
                  placeholder="Packaging specifications, delivery terms, inspection requirements..."
                  value={form.notes} onChange={update('notes')}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button type="submit" className="btn-primary">
                <Send size={15} /> Submit & Broadcast Email to Vendors
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="kpi-card">
            <span className="section-title">PO Total Value</span>
            <span className="stat-figure font-mono">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div className="kpi-card" style={{ borderColor: 'var(--color-primary)' }}>
            <span className="section-title flex items-center gap-1">
              <Calendar size={12} /> Dynamic Lead Time Match
            </span>
            <span className="stat-figure font-mono text-primary">{timeline.days} Days</span>
            <span className="text-xs text-ink-muted">
              Auto check on Day {timeline.autoCheckDay} · Due on {form.delivery}
            </span>
          </div>

          <div className="card p-5 text-sm text-ink-muted leading-relaxed flex flex-col gap-2">
            <div className="font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-primary" /> Dynamic Delivery Tracking
            </div>
            <p className="text-xs">
              • <strong>Custom Timeline</strong>: When you pick a date, the exact day difference from today is calculated dynamically.
            </p>
            <p className="text-xs">
              • <strong>Automated Follow-up</strong>: Cron awakens once daily and triggers a status inquiry at ~67% of the delivery timeline (e.g. Day {timeline.autoCheckDay} of {timeline.days}).
            </p>
            <p className="text-xs">
              • <strong>Arrival Check</strong>: On the delivery date, the dashboard pop-up asks if delivered On-Time or Late in days.
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Send Modal */}
      {showModal && (
        <VendorSendModal
          poDetails={form}
          onClose={() => setShowModal(false)}
          onOrdersCreated={(orders) => {
            if (onOrdersCreated) onOrdersCreated(orders);
          }}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPROVAL QUEUE TAB
══════════════════════════════════════════════════════════════ */
function ApprovalQueue({ queue, onApproveOrder, onRejectOrder, onGoToPOList }) {
  const [showSideBySideModal, setShowSideBySideModal] = useState(() => queue.length > 0);
  const [notification, setNotification]               = useState(null);

  useEffect(() => {
    if (queue.length > 0) {
      setShowSideBySideModal(true);
    }
  }, [queue.length]);

  function handleConfirmApproval(approvedPo) {
    if (onApproveOrder) {
      onApproveOrder(approvedPo);
    }
    setNotification({
      type: 'APPROVED',
      poNumber: approvedPo.poNumber || `PO-${approvedPo.id}`,
      vendor: approvedPo.vendorName,
      value: (Number(approvedPo.quantity) * Number(approvedPo.rate)).toLocaleString('en-IN'),
    });
  }

  function handleReject(poId, reason, rejectedPo) {
    if (onRejectOrder) {
      onRejectOrder(poId, reason, rejectedPo);
    }
    setNotification({
      type: 'REJECTED',
      poNumber: rejectedPo?.poNumber || `PO-${poId}`,
      reason,
    });
  }

  return (
    <div className="flex flex-col gap-4 animate-enter">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg">Purchase Order Approval Queue</h3>
          <p className="text-xs text-ink-muted">
            All database orders with <code className="bg-surface-raised px-1 py-0.5 rounded">status: pending</code> appear here.
          </p>
        </div>

        {queue.length > 0 ? (
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-transform active:scale-95 animate-pulse"
            onClick={() => setShowSideBySideModal(true)}
          >
            <AlertTriangle size={15} /> You have {queue.length} status{queue.length > 1 ? 'es' : ''} to update
          </button>
        ) : (
          <span className="badge-ok text-xs">All Pending Orders Processed</span>
        )}
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-enter ${
            notification.type === 'APPROVED' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'APPROVED' ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : (
              <XCircle size={18} className="text-red-600" />
            )}
            <span>
              {notification.type === 'APPROVED' ? (
                <>Order <strong>{notification.poNumber}</strong> verified & saved as <strong>Confirmed</strong> for <strong>{notification.vendor}</strong> (Value: ₹{notification.value})!</>
              ) : (
                <>Order <strong>{notification.poNumber}</strong> marked as <strong>Rejected</strong> in database. Reason: "{notification.reason}"</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {notification.type === 'APPROVED' && onGoToPOList && (
              <button className="btn-primary !py-1 !px-2.5 text-xs" onClick={onGoToPOList}>
                View in PO List <ArrowRight size={12} className="inline ml-1" />
              </button>
            )}
            <button onClick={() => setNotification(null)} className="btn-ghost !p-1 text-ink-muted">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main page list when modal is closed */}
      {queue.length === 0 && (
        <div className="card p-12 text-center text-ink-muted flex flex-col items-center justify-center gap-2">
          <CheckCircle2 size={36} className="text-primary opacity-60" />
          <p className="text-base font-medium text-ink">No Pending Orders Waiting for Approval</p>
          <p className="text-xs text-ink-muted">Create a PO to populate the approval queue with new vendor inquiries.</p>
        </div>
      )}

      {queue.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {queue.map((po, idx) => (
            <div
              key={po.id}
              className="card p-5 border-2 border-red-300 bg-red-50/30 flex flex-col justify-between gap-3 hover:border-red-500 transition-all cursor-pointer"
              onClick={() => setShowSideBySideModal(true)}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="badge-danger text-[10px] font-bold">Vendor {idx + 1}</span>
                  <span className="font-mono text-xs text-ink-muted">{po.poNumber || `PO-${po.id}`}</span>
                </div>
                <h4 className="font-display font-bold text-base text-ink">{po.vendorName}</h4>
                <div className="text-xs text-ink-muted font-mono mt-1">
                  {po.sku} · {Number(po.quantity).toLocaleString('en-IN')} units @ ₹{po.rate}
                </div>
                <div className="text-[11px] text-ink-muted mt-1">
                  Timeline: <strong className="text-primary font-mono">{po.givenDays || 14} days</strong> (ETA: {po.expectedDelivery || '—'})
                </div>
              </div>

              <button
                type="button"
                className="btn-primary !bg-red-600 !border-red-600 !py-1.5 !text-xs w-full justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSideBySideModal(true);
                }}
              >
                <Edit3 size={13} /> Update Status
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Directly Open Side-by-Side Modal */}
      {showSideBySideModal && queue.length > 0 && (
        <SideBySideStatusModal
          queue={queue}
          onClose={() => setShowSideBySideModal(false)}
          onConfirmApproval={handleConfirmApproval}
          onRejectOrder={handleReject}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PO LIST & STATUS TAB
══════════════════════════════════════════════════════════════ */
function POList({ pos, onTriggerCron, cronLoading, cronResult }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL'
    ? pos
    : pos.filter((p) => {
        if (filter === 'confirmed' || filter === 'Approved') {
          return p.status === 'confirmed' || p.status === 'Approved';
        }
        if (filter === 'pending' || filter === 'Pending Approval') {
          return p.status === 'pending' || p.status === 'Pending Approval';
        }
        return p.status === filter;
      });

  return (
    <div className="card p-5 animate-enter flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg">Purchase Orders & Status</h3>
          <p className="text-xs text-ink-muted">
            All orders confirmed and stored in database with dynamic delivery day matching.
          </p>
        </div>

        {/* Cron Trigger Button */}
        <div className="flex items-center gap-3">
          <button
            className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1.5 border-amber-300 bg-amber-50/50 hover:bg-amber-100/80 text-amber-900"
            onClick={onTriggerCron}
            disabled={cronLoading}
            title="Execute Dynamic Follow-Up Cron Job Manually"
          >
            {cronLoading ? (
              <><Loader2 size={13} className="animate-spin" /> Checking Cron…</>
            ) : (
              <><BellRing size={13} className="text-amber-600" /> Run Daily SLA Cron</>
            )}
          </button>

          {/* Filter buttons */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border text-xs">
            {['ALL', 'confirmed', 'pending', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-md transition-all ${filter === st ? 'bg-surface font-semibold text-primary shadow-sm' : 'text-ink-muted'}`}
              >
                {st === 'confirmed' ? 'Confirmed' : st === 'pending' ? 'Pending' : st === 'rejected' ? 'Rejected' : 'ALL'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {cronResult && (
        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-900 flex items-center justify-between animate-enter">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-amber-700" />
            <span>
              <strong>Daily Cron Result:</strong> {cronResult.message} ({cronResult.result?.checked || 0} orders checked, {cronResult.result?.sent || 0} reminder emails dispatched).
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor (Order Awarded)</th>
              <th>SKU</th>
              <th>Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Total Value</th>
              <th>Calculated Timeline</th>
              <th>Status</th>
              <th>Promised Delivery</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((po) => (
              <tr key={po.id}>
                <td className="font-mono text-xs font-semibold">{po.poNumber || `PO-${po.id}`}</td>
                <td className="font-medium text-ink">
                  <div>{po.vendorName}</div>
                  {po.vendorEmail && <span className="text-[11px] text-ink-muted font-normal">{po.vendorEmail}</span>}
                </td>
                <td><span className="badge font-mono text-xs">{po.sku}</span></td>
                <td>{Number(po.quantity).toLocaleString('en-IN')}</td>
                <td className="text-right font-mono font-semibold">₹{po.rate}</td>
                <td className="text-right font-mono font-bold text-primary">
                  ₹{(Number(po.quantity) * Number(po.rate)).toLocaleString('en-IN')}
                </td>
                <td>
                  <div className="flex flex-col text-xs font-mono">
                    <span className="font-bold text-primary">{po.givenDays || 14} days total</span>
                    {po.reminderSent === 'true' ? (
                      <span className="text-emerald-700 text-[10px] flex items-center gap-1 font-semibold">
                        <Check size={10} /> Auto-check Sent
                      </span>
                    ) : (
                      <span className="text-ink-muted text-[10px]">Follow-up on Day {po.reminderDaysThreshold || Math.round((po.givenDays || 14) * 0.67)}</span>
                    )}
                  </div>
                </td>
                <td>{statusBadge(po.status)}</td>
                <td className="text-ink-muted text-xs">{po.expectedDelivery || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-ink-muted text-sm">
                  No purchase orders found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NEGOTIATION ASSISTANT TAB
══════════════════════════════════════════════════════════════ */
function NegotiationAssistant({ pos }) {
  const [sku, setSku]               = useState(MOCK_SKUS[0]);
  const [qty, setQty]               = useState(2500);
  const [currentQuote, setCurrentQuote] = useState(525);

  const matchingPos = pos.filter((p) => p.sku === sku && (p.status === 'confirmed' || p.status === 'Approved'));
  const lastPO          = matchingPos.length > 0 ? Number(matchingPos[0].rate) : 510;
  const bestHistorical  = matchingPos.length > 0 ? Math.min(...matchingPos.map((p) => Number(p.rate))) : 485;
  const targetPrice     = Math.round(bestHistorical + (lastPO - bestHistorical) * 0.5);
  const increasePct     = ((currentQuote - lastPO) / lastPO) * 100;
  const savingAtTarget  = (currentQuote - targetPrice) * Number(qty || 0);

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Negotiation Inputs</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">SKU</label>
            <select className="select font-mono" value={sku} onChange={(e) => setSku(e.target.value)}>
              {MOCK_SKUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Planned Quantity</label>
            <input className="input font-mono" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <label className="label">Vendor's Current Quote (₹/unit)</label>
            <input className="input font-mono font-semibold" type="number" value={currentQuote} onChange={(e) => setCurrentQuote(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="card p-6 col-span-2">
        <h3 className="font-display font-semibold text-lg mb-1">Negotiation Target</h3>
        <p className="text-sm text-ink-muted mb-5">Calculates smart procurement benchmark based on confirmed PO history in DB.</p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="kpi-card">
            <span className="section-title">Last Confirmed PO Rate</span>
            <span className="stat-figure font-mono">₹{lastPO}</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Current Quote</span>
            <span className="stat-figure font-mono">₹{currentQuote}</span>
            <span className={increasePct > 0 ? 'text-red text-xs font-medium' : 'text-primary text-xs font-medium'}>
              {increasePct > 0 ? '+' : ''}{increasePct.toFixed(2)}% vs last PO
            </span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Best Historical Rate</span>
            <span className="stat-figure font-mono">₹{bestHistorical}</span>
          </div>
          <div className="kpi-card" style={{ borderColor: 'var(--color-primary)' }}>
            <span className="section-title flex items-center gap-1"><Target size={12} /> Suggested Target</span>
            <span className="stat-figure font-mono" style={{ color: 'var(--color-primary-strong)' }}>₹{targetPrice}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: 'var(--color-primary-soft)', borderColor: 'var(--color-border)' }}>
          <p className="text-sm">
            Negotiating from <span className="font-mono font-semibold">₹{currentQuote}</span> down to{' '}
            <span className="font-mono font-semibold text-primary">₹{targetPrice}</span> on{' '}
            <span className="font-mono font-semibold">{Number(qty).toLocaleString('en-IN')}</span> units saves{' '}
            <span className="font-mono font-bold text-primary">₹{savingAtTarget.toLocaleString('en-IN')}</span> on this order.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT (WITH DATABASE FETCH & CRON RUNNER)
══════════════════════════════════════════════════════════════ */
export default function PurchaseOrders() {
  const [activeTab, setActiveTab]         = useState('create');
  const [pos, setPos]                     = useState(FALLBACK_POS);
  const [approvalQueue, setApprovalQueue] = useState(FALLBACK_APPROVAL_QUEUE);
  const [cronLoading, setCronLoading]     = useState(false);
  const [cronResult, setCronResult]       = useState(null);

  // Load live POs and Approval Queue from DB
  const loadData = () => {
    api.getPurchaseOrders()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPos(data);
        }
      })
      .catch(() => {});

    api.getApprovalQueue()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setApprovalQueue(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // When email is sent to vendor(s), add them to approval queue & pos
  const handleOrdersCreated = (newOrders) => {
    setApprovalQueue((prev) => [...newOrders, ...prev]);
    setPos((prev) => [...newOrders, ...prev]);
  };

  // When user approves an order in Approval Queue pop-up
  const handleApproveOrder = (approvedPo) => {
    setApprovalQueue((prev) => prev.filter((p) => p.id !== approvedPo.id));
    setPos((prev) => {
      const exists = prev.some((p) => p.id === approvedPo.id);
      if (exists) {
        return prev.map((p) => p.id === approvedPo.id ? approvedPo : p);
      }
      return [approvedPo, ...prev];
    });
  };

  // When user rejects an order in Approval Queue
  const handleRejectOrder = (poId, reason, rejectedPo) => {
    setApprovalQueue((prev) => prev.filter((p) => p.id !== poId));
    setPos((prev) =>
      prev.map((p) =>
        p.id === poId
          ? { ...(rejectedPo || p), status: 'rejected', rejectionReason: reason }
          : p
      )
    );
  };

  // Trigger dynamic daily cron check manually from UI
  const handleTriggerCron = async () => {
    setCronLoading(true);
    setCronResult(null);
    try {
      const res = await api.runFollowUpCron();
      setCronResult(res);
      loadData();
    } catch (err) {
      setCronResult({ message: `Cron Error: ${err.message}` });
    } finally {
      setCronLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Purchase Orders</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Purchase Orders & Approvals</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          const isQueueTab = tab.id === 'approval';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active
                ? { borderBottom: '2px solid var(--color-primary)' }
                : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
              {isQueueTab && approvalQueue.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-xs">
                  {approvalQueue.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'create' && (
        <CreatePO
          onOrdersCreated={handleOrdersCreated}
        />
      )}
      {activeTab === 'list' && (
        <POList
          pos={pos}
          onTriggerCron={handleTriggerCron}
          cronLoading={cronLoading}
          cronResult={cronResult}
        />
      )}
      {activeTab === 'approval' && (
        <ApprovalQueue
          queue={approvalQueue}
          onApproveOrder={handleApproveOrder}
          onRejectOrder={handleRejectOrder}
          onGoToPOList={() => setActiveTab('list')}
        />
      )}
      {activeTab === 'negotiation' && (
        <NegotiationAssistant pos={pos} />
      )}
    </div>
  );
}