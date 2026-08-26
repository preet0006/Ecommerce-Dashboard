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

  // ── Purchase Orders DB & Workflow API ──────────────────────────────────────

  /** Fetch all purchase orders (status: confirmed, delivered, etc.) */
  getPurchaseOrders: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.sku)    qs.set('sku', params.sku);
    const query = qs.toString();
    return request(`/pos${query ? `?${query}` : ''}`);
  },

  /** Fetch pending purchase orders for Approval Queue */
  getApprovalQueue: () => request('/pos/approval-queue'),

  /** Create and save PO in database with status 'pending' + send email */
  createPurchaseOrder: (data) =>
    request('/pos', { method: 'POST', body: JSON.stringify(data) }),

  /** Confirm/Approve PO (status -> 'confirmed') with verified details */
  confirmPurchaseOrder: (id, data) =>
    request(`/pos/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) }),

  /** Reject PO (status -> 'rejected') with reason */
  rejectPurchaseOrder: (id, data) =>
    request(`/pos/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),

  /** Manually trigger 10-day cron follow-up check */
  runFollowUpCron: () =>
    request('/pos/run-followup-cron', { method: 'POST' }),

  /** Fetch confirmed orders due for delivery arrival check */
  getPendingDeliveries: () =>
    request('/pos/pending-deliveries'),

  /** Record delivery arrival (on time vs late in days) */
  recordDeliveryArrival: (id, data) =>
    request(`/pos/${id}/record-delivery`, { method: 'POST', body: JSON.stringify(data) }),

  /** Fetch vendor performance scoreboard grouped by SKU and Vendor */
  getVendorPerformanceScoreboard: () =>
    request('/pos/vendor-scoreboard'),

  // ── Channel Orders API ──────────────────────────────────────────────────────

  /**
   * Fetch all channel orders — most recent orderedAt first.
   * @param {{ channel?: string, status?: string }} [params]
   */
  getChannelOrders: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.channel) qs.set('channel', params.channel);
    if (params.status)  qs.set('status',  params.status);
    const query = qs.toString();
    return request(`/channel-orders${query ? `?${query}` : ''}`);
  },

  /** Fetch a single channel order by numeric id */
  getChannelOrder: (id) => request(`/channel-orders/${id}`),

  // ── AI Intelligence API (Groq SDK & PostgreSQL Grounding) ───────────────────

  /** Official Groq AI Chat endpoint: POST /api/ai/chat */
  sendAiChat: (data) =>
    request('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),

  /** Fetch all saved AI chat sessions from DB */
  getAiSessions: () => request('/ai/sessions'),

  /** Fetch user question history for a session */
  getAiQuestionHistory: (sessionId) => request(`/ai/history/${sessionId}`),

  /** Send user query & file to AI, stores question in DB and returns grounded response */
  sendAiQuery: (data) =>
    request('/ai/query', { method: 'POST', body: JSON.stringify(data) }),

  /** Delete AI session and question history */
  deleteAiSession: (sessionId) =>
    request(`/ai/sessions/${sessionId}`, { method: 'DELETE' }),

  // ── System Settings & RBAC Users API ────────────────────────────────────────

  /** Fetch all team members with roles (Admin vs Reader) */
  getSystemUsers: () => request('/settings/users'),

  /** Create a new system user */
  createSystemUser: (data) =>
    request('/settings/users', { method: 'POST', body: JSON.stringify(data) }),

  /** Update system user role or details */
  updateSystemUser: (id, data) =>
    request(`/settings/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /** Delete a system user */
  deleteSystemUser: (id) =>
    request(`/settings/users/${id}`, { method: 'DELETE' }),

  /** Fetch general application settings */
  getAppSettings: () => request('/settings/general'),

  /** Save application setting */
  saveAppSettings: (data) =>
    request('/settings/general', { method: 'POST', body: JSON.stringify(data) }),
};
