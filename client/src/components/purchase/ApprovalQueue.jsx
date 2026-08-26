import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Edit3, X, ArrowRight
} from 'lucide-react';
import SideBySideStatusModal from './SideBySideStatusModal';

/* ══════════════════════════════════════════════════════════════
   APPROVAL QUEUE TAB
══════════════════════════════════════════════════════════════ */
export default function ApprovalQueue({ queue, onApproveOrder, onRejectOrder, onGoToPOList }) {
  const [showSideBySideModal, setShowSideBySideModal] = useState(() => queue.length > 0);
  const [notification, setNotification]               = useState(null);

  useEffect(() => {
    if (queue.length > 0) {
      setShowSideBySideModal(true);
    } else {
      setShowSideBySideModal(false);
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
                <div className="text-xs text-ink-muted mt-1.5 flex flex-col gap-0.5">
                  <div className="font-semibold text-ink text-sm truncate" title={po.productName || po.sku}>{po.productName || po.sku}</div>
                  <div className="font-mono text-xs text-ink-muted flex items-center gap-1.5">
                    <span className="badge font-mono text-[10px]">{po.sku}</span>
                    <span>{Number(po.quantity).toLocaleString('en-IN')} units @ ₹{po.rate}</span>
                  </div>
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
