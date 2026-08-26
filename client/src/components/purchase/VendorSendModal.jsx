import React, { useState, useEffect } from 'react';
import {
  Mail, X, Loader2, CheckCircle2, XCircle, Send, Users,
  AlertTriangle, ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api';
import { calculateDeliveryDays } from './utils';

/* ══════════════════════════════════════════════════════════════
   VENDOR SEND MODAL
   – Saves to purchase_orders schema in DB (status: 'pending')
   – Dispatches HTML PO email to vendor
══════════════════════════════════════════════════════════════ */
export default function VendorSendModal({ poDetails, onClose, onOrdersCreated }) {
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
        productName: poDetails.productName || poDetails.sku || 'GF-CAS-001',
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
        productName: poDetails.productName || poDetails.sku || 'GF-CAS-001',
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
          productName: poDetails.productName || poDetails.sku || 'GF-CAS-001',
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
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg flex flex-wrap items-center gap-4 text-sm"
             style={{ background: 'var(--color-primary-soft)' }}>
          <span><span className="text-ink-muted">Item:</span> <strong>{poDetails.productName || poDetails.sku || 'GF-CAS-001'}</strong> <span className="font-mono text-xs text-ink-muted">({poDetails.sku})</span></span>
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
