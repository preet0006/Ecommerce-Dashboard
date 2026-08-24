import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList, FilePlus, ListChecks, HandCoins, ChevronRight,
  Truck, CheckCircle2, XCircle, Clock, Target,
  Send, Users, X, Loader2, ChevronDown, ChevronUp, Mail, Phone, ExternalLink, AlertTriangle
} from 'lucide-react';
import { api } from '../lib/api';

/* ============================================================
   MOCK DATA — replace with API calls to your PO endpoints
   ============================================================ */

const MOCK_SKUS = ['GF-CAS-001', 'GF-BWL-014', 'GF-PET-002', 'GF-CAS-005'];

const MOCK_POS = [
  { id: 'PO-2026-0142', vendor: 'Shreeji Plastics', sku: 'GF-CAS-001', qty: 2500, rate: 495, status: 'In Transit', eta: '2026-09-02' },
  { id: 'PO-2026-0141', vendor: 'Komal Packaging Co.', sku: 'GF-BWL-014', qty: 800, rate: 132, status: 'Pending Approval', eta: '—' },
  { id: 'PO-2026-0139', vendor: 'Anand Steelware', sku: 'GF-PET-002', qty: 1200, rate: 118, status: 'Delivered', eta: '2026-08-10' },
  { id: 'PO-2026-0137', vendor: 'Shreeji Plastics', sku: 'GF-CAS-005', qty: 400, rate: 1085, status: 'Rejected', eta: '—' },
];

const MOCK_APPROVAL_QUEUE = MOCK_POS.filter((po) => po.status === 'Pending Approval').map((po) => ({
  ...po,
  requestedBy: 'Purchase Team',
  margin: 27.4,
}));

const TABS = [
  { id: 'create',      label: 'Create PO',            icon: FilePlus },
  { id: 'list',        label: 'PO List & Status',      icon: ClipboardList },
  { id: 'approval',    label: 'Approval Queue',        icon: ListChecks },
  { id: 'negotiation', label: 'Negotiation Assistant', icon: HandCoins },
];

function statusBadge(status) {
  switch (status) {
    case 'Delivered':        return <span className="badge-ok"><CheckCircle2 size={12} /> {status}</span>;
    case 'In Progress':      return <span className="badge-warn"><Truck size={12} /> {status}</span>;
    case 'Pending Approval': return <span className="badge-warn"><Clock size={12} /> {status}</span>;
    case 'Rejected':         return <span className="badge-danger"><XCircle size={12} /> {status}</span>;
    default:                 return <span className="badge">{status}</span>;
  }
}

/* ══════════════════════════════════════════════════════════════
   VENDOR SEND MODAL (NODEMAILER INTEGRATED)
   – Fetches vendors with live emails from DB
   – Calls real backend endpoint to send HTML purchase order emails
   – Supports single vendor and "Send to All"
══════════════════════════════════════════════════════════════ */
function VendorSendModal({ poDetails, onClose }) {
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [sentMap, setSentMap]       = useState({});      // { vendorId: { previewUrl, message } }
  const [sendingMap, setSendingMap] = useState({});   // { vendorId: true }
  const [errorMap, setErrorMap]     = useState({});     // { vendorId: 'error message' }
  const [sendingAll, setSendingAll] = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [globalNotice, setGlobalNotice] = useState(null);

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

  // Send email to a single vendor via Nodemailer
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
      const response = await api.sendPoToVendor({
        vendorId: vendor.id,
        vendorEmail: vendor.email,
        vendorName: vendor.name,
        poDetails,
      });

      setSentMap((s) => ({
        ...s,
        [vendor.id]: {
          success: true,
          previewUrl: response.previewUrl,
          message: response.message,
        },
      }));
    } catch (err) {
      setErrorMap((e) => ({
        ...e,
        [vendor.id]: err.message || 'Failed to send email',
      }));
    } finally {
      setSendingMap((s) => ({ ...s, [vendor.id]: false }));
    }
  }

  // Send email to all vendors via Nodemailer bulk API
  async function handleSendAll() {
    setSendingAll(true);
    setGlobalNotice(null);

    const unsentVendors = vendors.filter((v) => !sentMap[v.id]);
    const vendorIds = unsentVendors.map((v) => v.id);

    try {
      const res = await api.sendPoToAllVendors({
        vendorIds,
        poDetails,
      });

      // Update state for successful sends
      const newSent = { ...sentMap };
      const newErrors = { ...errorMap };

      if (Array.isArray(res.successful)) {
        res.successful.forEach((item) => {
          newSent[item.vendorId] = {
            success: true,
            previewUrl: item.previewUrl,
          };
          delete newErrors[item.vendorId];
        });
      }

      if (Array.isArray(res.failed)) {
        res.failed.forEach((item) => {
          newErrors[item.vendorId] = item.error;
        });
      }

      setSentMap(newSent);
      setErrorMap(newErrors);
      setGlobalNotice(`Processed: ${res.successCount} sent successfully, ${res.failCount} failed.`);
    } catch (err) {
      setGlobalNotice(`Bulk send error: ${err.message}`);
    } finally {
      setSendingAll(false);
    }
  }

  const allSent = vendors.length > 0 && vendors.every((v) => sentMap[v.id]);
  const sentCount = Object.keys(sentMap).length;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          maxHeight: '88vh',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between p-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Mail size={20} style={{ color: 'var(--color-primary)' }} />
              Send Purchase Order via Email
            </h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Send formal PO notification email with full order specifications to vendors.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost !px-2 !py-2 ml-4 shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── PO Summary pill ────────────────────────────────────── */}
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg flex flex-wrap gap-4 text-sm"
             style={{ background: 'var(--color-primary-soft)' }}>
          <span><span className="text-ink-muted">SKU:</span> <strong>{poDetails.sku || 'GF-CAS-001'}</strong></span>
          <span><span className="text-ink-muted">Qty:</span> <strong>{Number(poDetails.qty || 0).toLocaleString('en-IN')} units</strong></span>
          <span><span className="text-ink-muted">Rate:</span> <strong>₹{poDetails.rate || '0'}/unit</strong></span>
          <span><span className="text-ink-muted">Total Value:</span> <strong>₹{((Number(poDetails.qty) || 0) * (Number(poDetails.rate) || 0)).toLocaleString('en-IN')}</strong></span>
        </div>

        {globalNotice && (
          <div className="mx-6 mt-3 p-3 rounded-lg text-sm"
               style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-strong)' }}>
            {globalNotice}
          </div>
        )}

        {/* ── Vendor list ────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
          {loading && (
            <div className="flex items-center justify-center py-12 text-ink-muted gap-2">
              <Loader2 size={20} className="animate-spin" /> Loading vendors from database…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                 style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)', color: 'var(--color-red)' }}>
              <XCircle size={16} /> {error}
            </div>
          )}

          {!loading && !error && vendors.length === 0 && (
            <div className="text-center py-12 text-ink-muted text-sm">
              No vendors found in the database. Add vendors in the Vendor Master first.
            </div>
          )}

          {!loading && vendors.map((v) => {
            const isSent     = sentMap[v.id];
            const isSending  = sendingMap[v.id];
            const hasError   = errorMap[v.id];
            const isExpanded = expanded === v.id;

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
                {/* Vendor row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm"
                    style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-strong)' }}
                  >
                    {(v.name || 'V').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
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
                      {v.contact && <span className="flex items-center gap-1"><Phone size={10} />{v.contact}</span>}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    className="btn-ghost !px-2 !py-1.5 shrink-0"
                    onClick={() => setExpanded(isExpanded ? null : v.id)}
                    title={isExpanded ? 'Collapse' : 'View details'}
                  >
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {/* Send button */}
                  {isSent ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="badge-ok flex items-center gap-1">
                        <CheckCircle2 size={13} /> Email Sent
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
                      title={!v.email ? 'Vendor needs an email address' : 'Send PO to this vendor'}
                    >
                      {isSending
                        ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                        : <><Send size={13} /> Send Email</>}
                    </button>
                  )}
                </div>

                {hasError && (
                  <div className="px-4 pb-3 pt-0 text-xs text-red flex items-center gap-1.5">
                    <XCircle size={13} /> {hasError}
                  </div>
                )}

                {/* Expanded detail row */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 grid grid-cols-3 gap-3 text-xs border-t"
                       style={{ borderColor: 'var(--color-border)' }}>
                    <div className="pt-3">
                      <span className="text-ink-muted block mb-0.5">Lead Time</span>
                      <span className="font-mono font-semibold">{v.leadTimeDays ?? 7} days</span>
                    </div>
                    <div className="pt-3">
                      <span className="text-ink-muted block mb-0.5">Credit Days</span>
                      <span className="font-mono font-semibold">{v.creditDays ?? 30} days</span>
                    </div>
                    <div className="pt-3">
                      <span className="text-ink-muted block mb-0.5">Delivery Rate</span>
                      <span className="font-mono font-semibold">{v.deliveryPct ?? 100}%</span>
                    </div>
                    {v.gstin && (
                      <div className="col-span-3 pt-1">
                        <span className="text-ink-muted">GSTIN: </span>
                        <span className="font-mono">{v.gstin}</span>
                      </div>
                    )}
                    {v.address && (
                      <div className="col-span-3 pt-1">
                        <span className="text-ink-muted">Address: </span>
                        <span>{v.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        {!loading && vendors.length > 0 && (
          <div
            className="flex items-center justify-between gap-3 p-5 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-sm text-ink-muted">
              {allSent
                ? <span className="flex items-center gap-1.5" style={{ color: 'var(--color-ok)' }}>
                    <CheckCircle2 size={15} /> PO emailed to all {vendors.length} vendors
                  </span>
                : <>{sentCount} of {vendors.length} vendors notified</>}
            </span>

            <div className="flex items-center gap-2">
              <button className="btn-outline" onClick={onClose}>
                {allSent ? 'Done' : 'Close'}
              </button>
              {!allSent && (
                <button
                  className="btn-primary"
                  onClick={handleSendAll}
                  disabled={sendingAll}
                >
                  {sendingAll
                    ? <><Loader2 size={14} className="animate-spin" /> Sending to all…</>
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
   CREATE PO
══════════════════════════════════════════════════════════════ */
function CreatePO() {
  const [form, setForm] = useState({
    vendor: '', sku: MOCK_SKUS[0], qty: '2500', rate: '495', creditDays: '30', notes: '', delivery: '',
  });
  const [showModal, setShowModal] = useState(false);
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const total = (Number(form.qty) || 0) * (Number(form.rate) || 0);

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
            Submit a purchase order request to generate and dispatch email notifications to your suppliers.
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
                <select className="select" value={form.sku} onChange={update('sku')}>
                  {MOCK_SKUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input className="input" type="number" placeholder="2500" value={form.qty} onChange={update('qty')} required />
              </div>
              <div>
                <label className="label">Target Rate (₹/unit)</label>
                <input className="input" type="number" placeholder="495" value={form.rate} onChange={update('rate')} required />
              </div>
              <div>
                <label className="label">Credit Days</label>
                <input className="input" type="number" placeholder="30" value={form.creditDays} onChange={update('creditDays')} />
              </div>
              <div>
                <label className="label">Expected Delivery</label>
                <input className="input" type="date" value={form.delivery} onChange={update('delivery')} />
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

            <div className="flex items-center gap-2 mt-6">
              <button type="submit" className="btn-primary">
                <Send size={15} /> Submit & Choose Vendors to Email
              </button>
              <button type="button" className="btn-outline">Save as Draft</button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="kpi-card">
            <span className="section-title">PO Total Value</span>
            <span className="stat-figure">₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="card p-5 text-sm text-ink-muted leading-relaxed">
            Clicking <strong>"Submit & Choose Vendors to Email"</strong> opens the vendor dispatch dialog powered by <strong>Nodemailer</strong>. You can email a single vendor or broadcast the purchase order to all registered vendors in one click.
          </div>
        </div>
      </div>

      {/* Vendor Send Modal */}
      {showModal && (
        <VendorSendModal
          poDetails={form}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PO LIST & STATUS TRACKER
══════════════════════════════════════════════════════════════ */
function POList({ pos }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
        <thead>
          <tr>
            <th>PO Number</th><th>Vendor</th><th>SKU</th><th>Qty</th>
            <th className="text-right">Rate</th><th className="text-right">Value</th>
            <th>Status</th><th>ETA</th>
          </tr>
        </thead>
        <tbody>
          {pos.map((po) => (
            <tr key={po.id}>
              <td className="font-mono text-xs">{po.id}</td>
              <td className="font-medium">{po.vendor}</td>
              <td>{po.sku}</td>
              <td>{po.qty.toLocaleString('en-IN')}</td>
              <td className="text-right font-mono">₹{po.rate}</td>
              <td className="text-right font-mono">₹{(po.qty * po.rate).toLocaleString('en-IN')}</td>
              <td>{statusBadge(po.status)}</td>
              <td className="text-ink-muted">{po.eta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPROVAL QUEUE
══════════════════════════════════════════════════════════════ */
function ApprovalQueue({ queue }) {
  const [decisions, setDecisions] = useState({});
  const decide = (id, decision) => setDecisions((d) => ({ ...d, [id]: decision }));

  return (
    <div className="flex flex-col gap-4 animate-enter">
      {queue.length === 0 && (
        <div className="card p-8 text-center text-ink-muted">No purchase orders waiting for approval.</div>
      )}
      {queue.map((po) => (
        <div key={po.id} className="card p-5 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-ink-muted">{po.id}</span>
              <span className="font-medium">{po.vendor}</span>
              <span className="text-ink-muted">·</span>
              <span className="text-sm">{po.sku}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-muted">
              <span>{po.qty.toLocaleString('en-IN')} units @ ₹{po.rate}</span>
              <span>Value: ₹{(po.qty * po.rate).toLocaleString('en-IN')}</span>
              <span>Requested by: {po.requestedBy}</span>
              {po.margin >= 30
                ? <span className="badge-ok">{po.margin}% margin</span>
                : <span className="badge-warn">{po.margin}% margin</span>}
            </div>
          </div>

          {decisions[po.id] ? (
            <span className={decisions[po.id] === 'approved' ? 'badge-ok' : 'badge-danger'}>
              {decisions[po.id] === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button className="btn-outline" onClick={() => decide(po.id, 'rejected')}>
                <XCircle size={16} /> Reject
              </button>
              <button className="btn-primary" onClick={() => decide(po.id, 'approved')}>
                <CheckCircle2 size={16} /> Approve
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NEGOTIATION ASSISTANT
══════════════════════════════════════════════════════════════ */
function NegotiationAssistant() {
  const [sku, setSku]               = useState(MOCK_SKUS[0]);
  const [qty, setQty]               = useState(2500);
  const [currentQuote, setCurrentQuote] = useState(525);

  const lastPO          = 510;
  const bestHistorical  = 485;
  const targetPrice     = useMemo(() => Math.round(bestHistorical + (lastPO - bestHistorical) * 0.5), []);
  const increasePct     = ((currentQuote - lastPO) / lastPO) * 100;
  const savingAtTarget  = (currentQuote - targetPrice) * Number(qty || 0);

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Negotiation Inputs</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">SKU</label>
            <select className="select" value={sku} onChange={(e) => setSku(e.target.value)}>
              {MOCK_SKUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Planned Quantity</label>
            <input className="input" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <label className="label">Vendor's Current Quote (₹/unit)</label>
            <input className="input" type="number" value={currentQuote} onChange={(e) => setCurrentQuote(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="card p-6 col-span-2">
        <h3 className="font-display font-semibold text-lg mb-1">Negotiation Target</h3>
        <p className="text-sm text-ink-muted mb-5">Gives your buyer a target, not just the vendor's latest quotation.</p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="kpi-card">
            <span className="section-title">Last PO Rate</span>
            <span className="stat-figure">₹{lastPO}</span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Current Quote</span>
            <span className="stat-figure">₹{currentQuote}</span>
            <span className={increasePct > 0 ? 'text-red text-xs font-medium' : 'text-primary text-xs font-medium'}>
              {increasePct > 0 ? '+' : ''}{increasePct.toFixed(2)}% vs last PO
            </span>
          </div>
          <div className="kpi-card">
            <span className="section-title">Best Historical Rate</span>
            <span className="stat-figure">₹{bestHistorical}</span>
          </div>
          <div className="kpi-card" style={{ borderColor: 'var(--color-primary)' }}>
            <span className="section-title flex items-center gap-1"><Target size={12} /> Suggested Target</span>
            <span className="stat-figure" style={{ color: 'var(--color-primary-strong)' }}>₹{targetPrice}</span>
          </div>
        </div>

        <div className="p-4 rounded-md" style={{ background: 'var(--color-primary-soft)' }}>
          <p className="text-sm">
            Negotiating from <span className="font-mono font-semibold">₹{currentQuote}</span> down to{' '}
            <span className="font-mono font-semibold">₹{targetPrice}</span> on{' '}
            <span className="font-mono font-semibold">{Number(qty).toLocaleString('en-IN')}</span> units saves{' '}
            <span className="font-mono font-semibold">₹{savingAtTarget.toLocaleString('en-IN')}</span> on this order.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button className="btn-primary">Send Target to Buyer</button>
          <button className="btn-outline">View Quantity Slabs</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function PurchaseOrders() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={14} /> <span className="text-ink font-medium">Purchase Orders</span>
      </div>
      <h1 className="font-display text-2xl font-semibold mb-5">Purchase Orders</h1>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
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
            </button>
          );
        })}
      </div>

      {activeTab === 'create'      && <CreatePO />}
      {activeTab === 'list'        && <POList pos={MOCK_POS} />}
      {activeTab === 'approval'    && <ApprovalQueue queue={MOCK_APPROVAL_QUEUE} />}
      {activeTab === 'negotiation' && <NegotiationAssistant />}
    </div>
  );
}