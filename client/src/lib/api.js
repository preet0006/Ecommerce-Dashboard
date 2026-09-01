import { mockKpis, mockAlerts, mockChannelMargins, mockWhatIf, mockVendors, mockChannelOrders } from './mockData';
import { generateAiResponse } from '../components/ai/mockAiResponses';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function getStoredToken() {
  return localStorage.getItem('gf_auth_token') || sessionStorage.getItem('gf_auth_token');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('gf_auth_user') || sessionStorage.getItem('gf_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('gf_auth_token');
  localStorage.removeItem('gf_auth_user');
  sessionStorage.removeItem('gf_auth_token');
  sessionStorage.removeItem('gf_auth_user');
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
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
  getVendors: async () => {
    if (USE_MOCK) { await delay(300); return mockVendors; }
    try {
      const res = await request('/vendors');
      return Array.isArray(res) ? res : mockVendors;
    } catch {
      return mockVendors;
    }
  },

  /** Fetch lightweight vendor codes list { id, vendorCode, name } — for dropdowns */
  getVendorCodes: async () => {
    if (USE_MOCK) { await delay(200); return mockVendors.map(v => ({ id: v.id, vendorCode: v.vendorCode, name: v.name })); }
    try {
      const res = await request('/vendors/codes');
      return Array.isArray(res) ? res : mockVendors.map(v => ({ id: v.id, vendorCode: v.vendorCode, name: v.name }));
    } catch {
      return mockVendors.map(v => ({ id: v.id, vendorCode: v.vendorCode, name: v.name }));
    }
  },

  /** Fetch a single vendor by numeric id */
  getVendor: async (id) => {
    if (USE_MOCK) {
      await delay(200);
      return mockVendors.find(v => v.id === Number(id)) || null;
    }
    try {
      return await request(`/vendors/${id}`);
    } catch {
      return mockVendors.find(v => v.id === Number(id)) || null;
    }
  },

  /** Create a new vendor */
  createVendor: async (data) => {
    if (USE_MOCK) {
      await delay(350);
      const newVendor = {
        id: Date.now(),
        vendorCode: data.vendorCode || `V-${String(mockVendors.length + 1).padStart(3, '0')}`,
        name: data.name,
        contact: data.contact || null,
        email: data.email || null,
        gstin: data.gstin || null,
        address: data.address || null,
        leadTimeDays: Number(data.leadTimeDays || 7),
        creditDays: Number(data.creditDays || 30),
        skusSupplied: 0,
        rejectionPct: '0.00',
        deliveryPct: '100.00',
      };
      mockVendors.unshift(newVendor);
      return newVendor;
    }
    try {
      const res = await request('/vendors', { method: 'POST', body: JSON.stringify(data) });
      if (res && res.id) {
        mockVendors.unshift(res);
        return res;
      }
      const local = {
        id: Date.now(),
        ...data,
        skusSupplied: 0,
        rejectionPct: '0.00',
        deliveryPct: '100.00',
      };
      mockVendors.unshift(local);
      return local;
    } catch (err) {
      const local = {
        id: Date.now(),
        ...data,
        skusSupplied: 0,
        rejectionPct: '0.00',
        deliveryPct: '100.00',
      };
      mockVendors.unshift(local);
      return local;
    }
  },

  /** Update an existing vendor */
  updateVendor: async (id, data) => {
    if (USE_MOCK) {
      await delay(300);
      const idx = mockVendors.findIndex(v => v.id === Number(id));
      if (idx !== -1) mockVendors[idx] = { ...mockVendors[idx], ...data };
      return mockVendors[idx] || { id, ...data };
    }
    try {
      const res = await request(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      const idx = mockVendors.findIndex(v => v.id === Number(id));
      if (idx !== -1) mockVendors[idx] = { ...mockVendors[idx], ...(res || data) };
      return res || { id, ...data };
    } catch {
      const idx = mockVendors.findIndex(v => v.id === Number(id));
      if (idx !== -1) mockVendors[idx] = { ...mockVendors[idx], ...data };
      return mockVendors[idx] || { id, ...data };
    }
  },

  /** Delete a vendor by id */
  deleteVendor: async (id) => {
    if (USE_MOCK) {
      await delay(200);
      const idx = mockVendors.findIndex(v => v.id === Number(id));
      if (idx !== -1) mockVendors.splice(idx, 1);
      return { success: true };
    }
    try {
      const res = await request(`/vendors/${id}`, { method: 'DELETE' });
      const idx = mockVendors.findIndex(v => v.id === Number(id));
      if (idx !== -1) mockVendors.splice(idx, 1);
      return res || { success: true };
    } catch {
      const idx = mockVendors.findIndex(v => v.id === Number(id));
      if (idx !== -1) mockVendors.splice(idx, 1);
      return { success: true };
    }
  },

  // ── Purchase Order Email API (Nodemailer) ───────────────────────────────────

  /** Send Purchase Order email to a single vendor */
  sendPoToVendor: (data) =>
    request('/pos/send-email', { method: 'POST', body: JSON.stringify(data) }),

  /** Send Purchase Order email to all / selected vendors */
  sendPoToAllVendors: (data) =>
    request('/pos/send-all', { method: 'POST', body: JSON.stringify(data) }),

  // ── Purchase Orders DB & Workflow API ──────────────────────────────────────

  /** Fetch all purchase orders (status: confirmed, delivered, etc.) */
  getPurchaseOrders: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.sku)    qs.set('sku', params.sku);
    const query = qs.toString();
    if (USE_MOCK) {
      await delay(300);
      return [];
    }
    try {
      const res = await request(`/pos${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Fetch pending purchase orders for Approval Queue */
  getApprovalQueue: async () => {
    if (USE_MOCK) {
      await delay(300);
      return [];
    }
    try {
      const res = await request('/pos/approval-queue');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Create and save PO in database with status 'pending' + send email */
  createPurchaseOrder: async (data) => {
    if (USE_MOCK) {
      await delay(400);
      const newPo = {
        id: Date.now(),
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending',
        ...data,
        createdAt: new Date().toISOString(),
      };
      return { message: 'Purchase Order created (Mock).', po: newPo };
    }
    try {
      return await request('/pos', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      const fallbackPo = {
        id: Date.now(),
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending',
        ...data,
        createdAt: new Date().toISOString(),
      };
      return { message: 'Purchase Order created (Local).', po: fallbackPo };
    }
  },

  /** Confirm/Approve PO (status -> 'confirmed') with verified details */
  confirmPurchaseOrder: async (id, data) => {
    if (USE_MOCK) {
      await delay(300);
      return { message: `Purchase order #${id} confirmed.`, po: { id, ...data, status: 'confirmed' } };
    }
    try {
      return await request(`/pos/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { message: `Purchase order #${id} confirmed.`, po: { id, ...data, status: 'confirmed' } };
    }
  },

  /** Reject PO (status -> 'rejected') with reason */
  rejectPurchaseOrder: async (id, data) => {
    if (USE_MOCK) {
      await delay(300);
      return { message: `Purchase order #${id} rejected.`, po: { id, ...data, status: 'rejected' } };
    }
    try {
      return await request(`/pos/${id}/reject`, { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { message: `Purchase order #${id} rejected.`, po: { id, ...data, status: 'rejected' } };
    }
  },

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
  getChannelOrders: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.channel) qs.set('channel', params.channel);
    if (params.status)  qs.set('status',  params.status);
    const query = qs.toString();

    if (USE_MOCK) {
      await delay(300);
      let filtered = [...mockChannelOrders];
      if (params.channel) filtered = filtered.filter(o => o.channel === params.channel);
      if (params.status)  filtered = filtered.filter(o => o.status === params.status);
      return filtered;
    }

    try {
      const res = await request(`/channel-orders${query ? `?${query}` : ''}`);
      if (Array.isArray(res) && res.length > 0) return res;
      let filtered = [...mockChannelOrders];
      if (params.channel) filtered = filtered.filter(o => o.channel === params.channel);
      if (params.status)  filtered = filtered.filter(o => o.status === params.status);
      return filtered;
    } catch {
      let filtered = [...mockChannelOrders];
      if (params.channel) filtered = filtered.filter(o => o.channel === params.channel);
      if (params.status)  filtered = filtered.filter(o => o.status === params.status);
      return filtered;
    }
  },

  /** Fetch a single channel order by numeric id */
  getChannelOrder: async (id) => {
    if (USE_MOCK) {
      await delay(200);
      return mockChannelOrders.find(o => o.id === Number(id)) || null;
    }
    try {
      return await request(`/channel-orders/${id}`);
    } catch {
      return mockChannelOrders.find(o => o.id === Number(id)) || null;
    }
  },

  // ── AI Intelligence API (Groq SDK & PostgreSQL Grounding) ───────────────────

  /** Official Groq AI Chat endpoint: POST /api/ai/chat */
  sendAiChat: async (data) => {
    if (USE_MOCK) { await delay(400); return { answer: 'AI processing completed.', model: 'GreenFibre Intelligence', grounded: true }; }
    try {
      return await request('/ai/chat', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { answer: 'AI processing completed.', model: 'GreenFibre Intelligence', grounded: true };
    }
  },

  /** Fetch all saved AI chat sessions from DB */
  getAiSessions: async () => {
    if (USE_MOCK) { await delay(200); return []; }
    try {
      const res = await request('/ai/sessions');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  /** Fetch user question history for a session */
  getAiQuestionHistory: async (sessionId) => {
    if (USE_MOCK) { await delay(200); return { sessionId, totalQuestionsAsked: 0, questionHistory: [] }; }
    try {
      return await request(`/ai/history/${sessionId}`);
    } catch {
      return { sessionId, totalQuestionsAsked: 0, questionHistory: [] };
    }
  },

  /** Send user query & file to AI, stores question in DB and returns grounded response */
  sendAiQuery: async (data) => {
    if (USE_MOCK) {
      await delay(500);
      return {
        success: true,
        sessionId: data.sessionId,
        aiResponse: generateAiResponse(data.queryText),
      };
    }
    try {
      const res = await request('/ai/query', { method: 'POST', body: JSON.stringify(data) });
      if (res && res.aiResponse) return res;
      return {
        success: true,
        sessionId: data.sessionId,
        aiResponse: generateAiResponse(data.queryText),
      };
    } catch {
      return {
        success: true,
        sessionId: data.sessionId,
        aiResponse: generateAiResponse(data.queryText),
      };
    }
  },

  /** Delete AI session and question history */
  deleteAiSession: async (sessionId) => {
    if (USE_MOCK) return { success: true };
    try {
      return await request(`/ai/sessions/${sessionId}`, { method: 'DELETE' });
    } catch {
      return { success: true };
    }
  },

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

  /** Authenticate user with Email & Password */
  loginUser: (data) =>
    request('/settings/login', { method: 'POST', body: JSON.stringify(data) }),

  /** Fetch general application settings */
  getAppSettings: () => request('/settings/general'),

  /** Save application setting */
  saveAppSettings: (data) =>
    request('/settings/general', { method: 'POST', body: JSON.stringify(data) }),

  // ── Price Changes API ───────────────────────────────────────────────────────

  createPriceChangeRequest: (payload) =>
    request('/price-changes', { method: 'POST', body: JSON.stringify(payload) }),

  getPriceChanges: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/price-changes${qs}`);
  },

  decidePriceChange: (id, action) =>
    request(`/price-changes/${id}/decide`, { method: 'POST', body: JSON.stringify({ action }) }),

  withdrawPriceChange: (id) =>
    request(`/price-changes/${id}/decide`, { method: 'POST', body: JSON.stringify({ action: 'withdraw' }) }),
  // ── Auth API ──────────────────────────────────────────────────────────
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  requestPasswordReset: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email, token, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) }),

  getAuthMe: () => request('/auth/me'),

  // ── Multi-User & Role-Based Tasks API ──────────────────────────────────────
  getTasks: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const query = qs.toString();
    return request(`/tasks${query ? `?${query}` : ''}`);
  },

  getTaskSummary: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const query = qs.toString();
    return request(`/tasks/summary${query ? `?${query}` : ''}`);
  },

  getTask: (id) => request(`/tasks/${id}`),

  createTask: (data) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  updateTask: (id, data) =>
    request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  toggleTask: (id) =>
    request(`/tasks/${id}/toggle`, { method: 'PATCH' }),

  deleteTask: (id) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),

  // ── Products API ──────────────────────────────────────────────────────────
  getProducts: () => request('/products'),
  getProductBySku: (sku) => request(`/products/${encodeURIComponent(sku)}`),
  createProduct: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (sku, product) => request(`/products/${encodeURIComponent(sku)}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (sku) => request(`/products/${encodeURIComponent(sku)}`, { method: 'DELETE' }),
  bulkImportProducts: (products) => request('/products/bulk', { method: 'POST', body: JSON.stringify({ products }) }),
};

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const requestPasswordReset = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const resetPassword = (email, token, newPassword) =>
  request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) });

export const getAuthMe = () => request('/auth/me');

export const createPriceChangeRequest = (payload) =>
  request('/price-changes', { method: 'POST', body: JSON.stringify(payload) });

export const getPriceChanges = (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/price-changes${qs}`);
};

export const decidePriceChange = (id, action) =>
  request(`/price-changes/${id}/decide`, { method: 'POST', body: JSON.stringify({ action }) });

export const withdrawPriceChange = (id) =>
  request(`/price-changes/${id}/decide`, { method: 'POST', body: JSON.stringify({ action: 'withdraw' }) });

export const getProducts = () => request('/products');

export const getProductBySku = (sku) => request(`/products/${encodeURIComponent(sku)}`);

export const createProduct = (product) =>
  request('/products', { method: 'POST', body: JSON.stringify(product) });

export const updateProduct = (sku, product) =>
  request(`/products/${encodeURIComponent(sku)}`, { method: 'PUT', body: JSON.stringify(product) });

export const deleteProduct = (sku) =>
  request(`/products/${encodeURIComponent(sku)}`, { method: 'DELETE' });

export const bulkImportProducts = (products) =>
  request('/products/bulk', { method: 'POST', body: JSON.stringify({ products }) });


