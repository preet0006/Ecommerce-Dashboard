import React from 'react';
import { CheckCircle2, ShieldCheck, Truck, Clock, XCircle } from 'lucide-react';
import { FilePlus, ClipboardList, ListChecks, HandCoins } from 'lucide-react';

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
export function getDefaultDate(daysAhead = 14) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

/* ============================================================
   STATUS BADGE RENDERER
   ============================================================ */
export function statusBadge(status) {
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

/* ============================================================
   STATIC BACKUP / INITIAL DATA
   ============================================================ */
export const FALLBACK_POS = [
  { id: 1, poNumber: 'PO-2026-0142', vendorName: 'Shreeji Plastics', sku: 'GF-CAS-001', productName: 'Casserole Set A (3pc)', quantity: 2500, rate: '495.00', totalValue: '1237500.00', creditDays: 30, givenDays: 14, reminderDaysThreshold: 9, status: 'confirmed', expectedDelivery: getDefaultDate(14), notes: 'Standard packing', reminderSent: 'false' },
  { id: 2, poNumber: 'PO-2026-0139', vendorName: 'Anand Steelware', sku: 'GF-PET-002', productName: 'Pet Bowl Steel', quantity: 1200, rate: '118.00', totalValue: '141600.00', creditDays: 15, givenDays: 10, reminderDaysThreshold: 7, status: 'confirmed', expectedDelivery: getDefaultDate(10), notes: 'Stainless steel grade 304', reminderSent: 'true', reminderSentAt: '2026-08-20T10:00:00.000Z' },
  { id: 3, poNumber: 'PO-2026-0137', vendorName: 'Shreeji Plastics', sku: 'GF-CAS-005', productName: 'Casserole Set C (5pc)', quantity: 400, rate: '1085.00', totalValue: '434000.00', creditDays: 30, givenDays: 7, reminderDaysThreshold: 5, status: 'rejected', expectedDelivery: getDefaultDate(7), rejectionReason: 'Rate quoted higher than target', reminderSent: 'false' },
];

export const FALLBACK_APPROVAL_QUEUE = [
  {
    id: 101,
    poNumber: 'PO-2026-0151',
    vendorName: 'Shreeji Plastics',
    vendorEmail: 'orders@shreeji.com',
    sku: 'GF-CAS-001',
    productName: 'Casserole Set A (3pc)',
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
    productName: 'Casserole Set A (3pc)',
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
    productName: 'Casserole Set A (3pc)',
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

export const PURCHASE_TABS = [
  { id: 'create',      label: 'Create PO',            icon: FilePlus },
  { id: 'list',        label: 'PO List & Status',      icon: ClipboardList },
  { id: 'approval',    label: 'Approval Queue',        icon: ListChecks },
  { id: 'negotiation', label: 'Negotiation Assistant', icon: HandCoins },
];
