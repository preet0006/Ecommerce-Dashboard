import React from 'react';
import { Truck, Plus, History, BarChart3, Loader2 } from 'lucide-react';

export const MOCK_QUOTES = [
  { date: '2026-08-02', sku: 'GF-CAS-001', qty: 2500, rate: 495, moq: 500, freight: 12, creditDays: 30, leadTime: 10 },
  { date: '2026-06-14', sku: 'GF-CAS-001', qty: 2000, rate: 510, moq: 500, freight: 12, creditDays: 30, leadTime: 12 },
  { date: '2026-04-01', sku: 'GF-CAS-001', qty: 1500, rate: 522, moq: 500, freight: 15, creditDays: 15, leadTime: 12 },
  { date: '2026-01-19', sku: 'GF-CAS-001', qty: 1000, rate: 540, moq: 500, freight: 15, creditDays: 15, leadTime: 14 },
];

export const VENDOR_TABS = [
  { id: 'list',      label: 'Vendor List',        icon: Truck },
  { id: 'edit',      label: 'Add / Edit Vendor',  icon: Plus },
  { id: 'history',   label: 'Quotation History',  icon: History },
  { id: 'scorecard', label: 'Performance Scorecard', icon: BarChart3 },
];

export const EMPTY_FORM = {
  vendorCode: '', name: '', contact: '', email: '',
  gstin: '', leadTimeDays: '', creditDays: '', address: '',
};

export function scoreBadge(pct, goodAbove) {
  if (pct >= goodAbove) return <span className="badge-ok">{pct}%</span>;
  if (pct >= goodAbove - 10) return <span className="badge-warn">{pct}%</span>;
  return <span className="badge-danger">{pct}%</span>;
}

export function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-8 text-ink-muted">
        <Loader2 size={20} className="inline animate-spin mr-2" />Loading…
      </td>
    </tr>
  );
}

export function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg text-sm"
      style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)', color: 'var(--color-red)' }}>
      <span>{message}</span>
    </div>
  );
}
