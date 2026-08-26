import React, { useState } from 'react';
import { Loader2, CheckCircle2, BellRing, Check } from 'lucide-react';
import { statusBadge } from './utils';

/* ══════════════════════════════════════════════════════════════
   PO LIST & STATUS TAB
══════════════════════════════════════════════════════════════ */
export default function POList({ pos, onTriggerCron, cronLoading, cronResult }) {
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
              <th>Item & SKU</th>
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
                <td>
                  <div className="font-medium text-ink text-xs">{po.productName || po.sku}</div>
                  <span className="badge font-mono text-[10px] mt-0.5">{po.sku}</span>
                </td>
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
                <td>
                  <div>{statusBadge(po.status)}</div>
                  {(po.status === 'rejected' || po.status === 'Rejected') && po.rejectionReason && (
                    <div className="text-[10px] text-red-700 mt-1 max-w-[180px] leading-tight italic">
                      "{po.rejectionReason}"
                    </div>
                  )}
                </td>
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
