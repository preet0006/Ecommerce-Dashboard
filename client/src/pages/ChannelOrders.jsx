import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

/* ── Channel filter options ── */
const CHANNEL_FILTERS = [
  { label: 'All Channels', value: '' },
  { label: 'Amazon',       value: 'amazon' },
  { label: 'Flipkart',     value: 'flipkart' },
  { label: 'Website',      value: 'website' },
];

/* ── Status badge colours ── */
function StatusBadge({ status }) {
  switch (status) {
    case 'delivered':  return <span className="badge-ok">{status}</span>;
    case 'shipped':    return <span className="badge">{status}</span>;
    case 'pending':    return <span className="badge-warn">{status}</span>;
    case 'cancelled':  return <span className="badge-danger">{status}</span>;
    case 'returned':   return <span className="badge-danger">{status}</span>;
    default:           return <span className="badge">{status}</span>;
  }
}

/* ── Channel logo chip ── */
function ChannelChip({ channel }) {
  const styles = {
    amazon:   { background: '#FF9900', color: '#000' },
    flipkart: { background: '#2874F0', color: '#fff' },
    website:  { background: '#1F6E4C', color: '#fff' },
  };
  const s = styles[channel] || {};
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
      style={s}
    >
      {channel}
    </span>
  );
}

/* ── Loading row ── */
function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-8 text-ink-muted">
        <Loader2 size={20} className="inline animate-spin mr-2" />Loading…
      </td>
    </tr>
  );
}

/* ── Error banner ── */
function ErrorBanner({ message }) {
  return (
    <div
      className="flex items-center gap-2 p-3 mb-4 rounded-lg text-sm"
      style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)', color: 'var(--color-red)' }}
    >
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}

export default function ChannelOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [activeChannel, setActiveChannel] = useState('');

  const fetchOrders = (channel) => {
    setLoading(true);
    setError(null);
    api.getChannelOrders(channel ? { channel } : {})
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err)  => setError(err.message))
      .finally(()   => setLoading(false));
  };

  useEffect(() => {
    fetchOrders(activeChannel);
  }, [activeChannel]);

  /* Quick summary metrics computed from currently loaded orders */
  const totalCount = orders.length;
  const delivered  = orders.filter((o) => o.status === 'delivered').length;
  const shipped    = orders.filter((o) => o.status === 'shipped').length;
  const pending    = orders.filter((o) => o.status === 'pending').length;
  const revenue    = orders.reduce((sum, o) => sum + Number(o.price || 0), 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-bg transition-colors">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-muted mb-1">
        <span>Green Fibre</span> <ChevronRight size={13} /> <span className="text-ink font-medium">Channel Orders</span>
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-semibold mb-4 sm:mb-5">Channel Orders</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="kpi-card">
          <span className="section-title">Total Orders</span>
          <span className="stat-figure text-lg">{loading ? '—' : totalCount}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Delivered</span>
          <span className="stat-figure text-lg text-primary">{loading ? '—' : delivered}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">In-Transit / Shipped</span>
          <span className="stat-figure text-lg text-amber-500">{loading ? '—' : shipped + pending}</span>
        </div>
        <div className="kpi-card">
          <span className="section-title">Total Channel Revenue</span>
          <span className="stat-figure text-lg">
            {loading ? '—' : `₹${revenue.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>

      {/* Channel filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border overflow-x-auto pb-0.5">
        {CHANNEL_FILTERS.map((f) => {
          const active = activeChannel === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveChannel(f.value)}
              className={`whitespace-nowrap text-xs sm:text-sm ${
                active ? 'sidebar-link-active !rounded-b-none' : 'sidebar-link !rounded-b-none'
              }`}
              style={
                active
                  ? { borderBottom: '2px solid var(--color-primary)' }
                  : { borderBottom: '2px solid transparent' }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card p-4 sm:p-5 animate-enter">
        {error && <ErrorBanner message={error} />}

        <div className="table-responsive-container">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Order ID</th>
                <th>Product Name</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Price</th>
                <th>Status</th>
                <th>Location</th>
                <th>Ordered At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRow cols={8} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-ink-muted">
                    No orders found{activeChannel ? ` for ${activeChannel}` : ''}.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td><ChannelChip channel={o.channel} /></td>
                    <td className="font-mono text-xs text-ink-muted">{o.channelOrderId}</td>
                    <td className="font-medium">
                      {o.productName}
                      {o.productSku && (
                        <span className="ml-1.5 text-xs text-ink-muted font-mono">{o.productSku}</span>
                      )}
                    </td>
                    <td className="text-right">{o.quantity}</td>
                    <td className="text-right font-mono">₹{Number(o.price).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-ink-muted text-sm">{o.location || '—'}</td>
                    <td className="text-ink-muted text-sm">
                      {new Date(o.orderedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
