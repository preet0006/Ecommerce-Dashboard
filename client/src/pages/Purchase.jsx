import React, { useState, useMemo } from 'react';
import {
  ClipboardList, FilePlus, ListChecks, HandCoins, ChevronRight,
  Truck, CheckCircle2, XCircle, Clock, Target
} from 'lucide-react';

/* ============================================================
   MOCK DATA — replace with API calls to your PO endpoints
   (GET /api/pos, POST /api/pos, PATCH /api/pos/:id/approve, etc.)
   ============================================================ */

const MOCK_VENDORS = ['Shreeji Plastics', 'Anand Steelware', 'Komal Packaging Co.'];
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
  { id: 'create', label: 'Create PO', icon: FilePlus },
  { id: 'list', label: 'PO List & Status', icon: ClipboardList },
  { id: 'approval', label: 'Approval Queue', icon: ListChecks },
  { id: 'negotiation', label: 'Negotiation Assistant', icon: HandCoins },
];

function statusBadge(status) {
  switch (status) {
    case 'Delivered': return <span className="badge-ok"><CheckCircle2 size={12} /> {status}</span>;
    case 'In Progress': return <span className="badge-warn"><Truck size={12} /> {status}</span>;
    case 'Pending Approval': return <span className="badge-warn"><Clock size={12} /> {status}</span>;
    case 'Rejected': return <span className="badge-danger"><XCircle size={12} /> {status}</span>;
    default: return <span className="badge">{status}</span>;
  }
}

/* ---------------- Create PO ---------------- */
function CreatePO() {
  const [form, setForm] = useState({ vendor: MOCK_VENDORS[0], sku: MOCK_SKUS[0], qty: '', rate: '', creditDays: '', notes: '' });
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const total = (Number(form.qty) || 0) * (Number(form.rate) || 0);

  return (
    <div className="grid grid-cols-3 gap-5 animate-enter">
      <div className="card p-6 col-span-2">
        <h3 className="font-display font-semibold text-lg mb-1">Create Purchase Order</h3>
        <p className="text-sm text-ink-muted mb-5">Submitted POs enter the Approval Queue before being sent to the vendor.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vendor</label>
            <select className="select" value={form.vendor} onChange={update('vendor')}>
              {MOCK_VENDORS.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">SKU</label>
            <select className="select" value={form.sku} onChange={update('sku')}>
              {MOCK_SKUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input className="input" type="number" placeholder="2500" value={form.qty} onChange={update('qty')} />
          </div>
          <div>
            <label className="label">Rate (₹/unit)</label>
            <input className="input" type="number" placeholder="495" value={form.rate} onChange={update('rate')} />
          </div>
          <div>
            <label className="label">Credit Days</label>
            <input className="input" type="number" placeholder="30" value={form.creditDays} onChange={update('creditDays')} />
          </div>
          <div>
            <label className="label">Expected Delivery</label>
            <input className="input" type="date" />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="textarea" rows={3} placeholder="Any special instructions for this order" value={form.notes} onChange={update('notes')} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button className="btn-primary">Submit for Approval</button>
          <button className="btn-outline">Save as Draft</button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="kpi-card">
          <span className="section-title">PO Value</span>
          <span className="stat-figure">₹{total.toLocaleString('en-IN')}</span>
        </div>
        <div className="card p-5 text-sm text-ink-muted leading-relaxed">
          Purchase-order approval is kept human-approved rather than automatic — this PO will
          route to the Approval Queue and won't be sent to the vendor until approved.
        </div>
      </div>
    </div>
  );
}

/* ---------------- PO List & Status Tracker ---------------- */
function POList({ pos }) {
  return (
    <div className="card p-5 animate-enter">
      <table className="table-clean">
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>SKU</th>
            <th>Qty</th>
            <th className="text-right">Rate</th>
            <th className="text-right">Value</th>
            <th>Status</th>
            <th>ETA</th>
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

/* ---------------- Approval Queue ---------------- */
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
              {po.margin >= 30 ? <span className="badge-ok">{po.margin}% margin</span> : <span className="badge-warn">{po.margin}% margin</span>}
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

/* ---------------- Negotiation Assistant ---------------- */
function NegotiationAssistant() {
  const [sku, setSku] = useState(MOCK_SKUS[0]);
  const [qty, setQty] = useState(2500);
  const [currentQuote, setCurrentQuote] = useState(525);

  const lastPO = 510;
  const bestHistorical = 485;
  const targetPrice = useMemo(() => Math.round(bestHistorical + (lastPO - bestHistorical) * 0.5), []);
  const increasePct = ((currentQuote - lastPO) / lastPO) * 100;
  const savingAtTarget = (currentQuote - targetPrice) * Number(qty || 0);

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

/* ---------------- Page ---------------- */
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
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'}
              style={active ? { borderBottom: '2px solid var(--color-primary)' } : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'create' && <CreatePO />}
      {activeTab === 'list' && <POList pos={MOCK_POS} />}
      {activeTab === 'approval' && <ApprovalQueue queue={MOCK_APPROVAL_QUEUE} />}
      {activeTab === 'negotiation' && <NegotiationAssistant />}
    </div>
  );
}