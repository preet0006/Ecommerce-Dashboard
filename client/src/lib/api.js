import { mockKpis, mockAlerts, mockChannelMargins, mockWhatIf } from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
// Set VITE_USE_MOCK=false in your .env once the real endpoints below exist.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  getKpis: async () => {
    if (USE_MOCK) { await delay(500); return mockKpis; }
    return request('/dashboard/kpis');
  },
  getAlerts: async () => {
    if (USE_MOCK) { await delay(650); return mockAlerts; }
    return request('/dashboard/alerts');
  },
  getChannelMargins: async () => {
    if (USE_MOCK) { await delay(550); return mockChannelMargins; }
    return request('/dashboard/channel-margins');
  },
  runWhatIf: async (payload) => {
    if (USE_MOCK) { await delay(400); return mockWhatIf(payload); }
    return request('/dashboard/what-if', { method: 'POST', body: JSON.stringify(payload) });
  },

  // ── Vendor API ──────────────────────────────────────────────────────────────

  /** Fetch all vendors (full data) */
  getVendors: () => request('/vendors'),

  /** Fetch lightweight vendor codes list { id, vendorCode, name } — for dropdowns */
  getVendorCodes: () => request('/vendors/codes'),

  /** Fetch a single vendor by numeric id */
  getVendor: (id) => request(`/vendors/${id}`),

  /** Create a new vendor */
  createVendor: (data) =>
    request('/vendors', { method: 'POST', body: JSON.stringify(data) }),

  /** Update an existing vendor */
  updateVendor: (id, data) =>
    request(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /** Delete a vendor by id */
  deleteVendor: (id) =>
    request(`/vendors/${id}`, { method: 'DELETE' }),

  // ── Purchase Order Email API (Nodemailer) ───────────────────────────────────

  /** Send Purchase Order email to a single vendor */
  sendPoToVendor: (data) =>
    request('/pos/send-email', { method: 'POST', body: JSON.stringify(data) }),

  /** Send Purchase Order email to all / selected vendors */
  sendPoToAllVendors: (data) =>
    request('/pos/send-all', { method: 'POST', body: JSON.stringify(data) }),
};
