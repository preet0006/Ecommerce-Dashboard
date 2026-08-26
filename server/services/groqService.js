import { Groq } from 'groq-sdk';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { desc } from 'drizzle-orm';

/**
 * Primary Groq Model
 */
const PRIMARY_MODEL = 'openai/gpt-oss-20b';
const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

/**
 * Instantiate Groq client securely using server environment variable
 */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key' || apiKey.trim() === '') {
    return null;
  }
  return new Groq({ apiKey });
}

/**
 * Complete REST API Endpoint Directory
 */
export const SYSTEM_API_DIRECTORY = [
  { method: 'GET', path: '/api/vendors', description: 'List all vendors with contact info, credit terms, lead times, SLA delivery & rejection %' },
  { method: 'GET', path: '/api/vendors/codes', description: 'Get lightweight vendor code dropdown list' },
  { method: 'GET', path: '/api/vendors/:id', description: 'Get single vendor profile by ID' },
  { method: 'POST', path: '/api/vendors', description: 'Create new vendor in PostgreSQL' },
  { method: 'PUT', path: '/api/vendors/:id', description: 'Update existing vendor details' },
  { method: 'DELETE', path: '/api/vendors/:id', description: 'Delete vendor from database' },
  { method: 'GET', path: '/api/pos', description: 'Get all purchase orders (filterable by status, sku)' },
  { method: 'GET', path: '/api/pos/approval-queue', description: 'Get purchase orders pending management approval' },
  { method: 'POST', path: '/api/pos', description: 'Create purchase order, save to DB, and send HTML email to vendor' },
  { method: 'POST', path: '/api/pos/:id/confirm', description: 'Approve/Confirm PO and verify rate, quantity, delivery date' },
  { method: 'POST', path: '/api/pos/:id/reject', description: 'Reject PO with documented rejection reason' },
  { method: 'POST', path: '/api/pos/run-followup-cron', description: 'Execute SLA 10-day vendor check cron job manually' },
  { method: 'GET', path: '/api/pos/pending-deliveries', description: 'Get confirmed orders due for delivery arrival verification' },
  { method: 'POST', path: '/api/pos/:id/record-delivery', description: 'Record delivery arrival (on-time vs late in days, feedback)' },
  { method: 'GET', path: '/api/pos/vendor-scoreboard', description: 'Get vendor performance scorecards by SKU' },
  { method: 'GET', path: '/api/channel-orders', description: 'List all multi-channel e-commerce sales (Amazon, Flipkart, Website)' },
  { method: 'GET', path: '/api/channel-orders/:id', description: 'Get single channel order by ID' },
  { method: 'POST', path: '/api/ai/chat', description: 'Official Groq AI Chatbot endpoint with live PostgreSQL grounding' },
  { method: 'POST', path: '/api/ai/query', description: 'AI inquiry with file attachment analysis and user question history' },
  { method: 'GET', path: '/api/ai/sessions', description: 'List saved AI chat sessions' },
  { method: 'GET', path: '/api/ai/history/:sessionId', description: 'Get user question history for a session' },
  { method: 'DELETE', path: '/api/ai/sessions/:sessionId', description: 'Delete AI chat session and its question history' },
];

/**
 * Fetch 100% real, live data directly from ALL PostgreSQL database tables
 */
export async function getLiveDatabaseContext() {
  const context = {
    vendors: [],
    purchaseOrders: [],
    channelOrders: [],
    aiSessions: [],
    aiQueries: [],
    stats: {
      totalVendors: 0,
      totalPOs: 0,
      pendingPOs: 0,
      confirmedPOs: 0,
      deliveredPOs: 0,
      rejectedPOs: 0,
      totalChannelOrders: 0,
      totalChannelRevenue: 0,
    },
  };

  try {
    const [allVendors, allPOs, allChannelOrders, allSessions, allQueries] = await Promise.all([
      db.select().from(schema.vendors).orderBy(desc(schema.vendors.createdAt)).catch(() => []),
      db.select().from(schema.purchaseOrders).orderBy(desc(schema.purchaseOrders.createdAt)).catch(() => []),
      db.select().from(schema.channelOrders).orderBy(desc(schema.channelOrders.orderedAt)).catch(() => []),
      db.select().from(schema.aiChatSessions).orderBy(desc(schema.aiChatSessions.updatedAt)).limit(10).catch(() => []),
      db.select().from(schema.aiUserQueries).orderBy(desc(schema.aiUserQueries.createdAt)).limit(15).catch(() => []),
    ]);

    context.vendors = allVendors || [];
    context.purchaseOrders = allPOs || [];
    context.channelOrders = allChannelOrders || [];
    context.aiSessions = allSessions || [];
    context.aiQueries = allQueries || [];

    const delivered = allPOs.filter((p) => p.status === 'delivered' || p.isDelivered === 'true').length;
    const pending = allPOs.filter((p) => p.status === 'pending' || p.status === 'Pending Approval').length;
    const confirmed = allPOs.filter((p) => p.status === 'confirmed' || p.status === 'Approved').length;
    const rejected = allPOs.filter((p) => p.status === 'rejected' || p.status === 'Rejected').length;

    const channelRev = allChannelOrders.reduce((acc, o) => acc + (Number(o.price) || 0), 0);

    context.stats = {
      totalVendors: allVendors.length,
      totalPOs: allPOs.length,
      pendingPOs: pending,
      confirmedPOs: confirmed,
      deliveredPOs: delivered,
      rejectedPOs: rejected,
      totalChannelOrders: allChannelOrders.length,
      totalChannelRevenue: channelRev,
    };
  } catch (err) {
    console.error('[groqService.getLiveDatabaseContext] Error querying PostgreSQL:', err.message);
  }

  return context;
}

/**
 * Format complete PostgreSQL data and API architecture into full context for Groq
 */
function formatComprehensiveDatabaseContext(dbContext) {
  const { vendors, purchaseOrders, channelOrders, stats } = dbContext;

  // Format all Vendors
  const vendorLines = vendors.length > 0
    ? vendors.map((v) =>
        `- Vendor ID ${v.id}: **${v.name}** (Code: \`${v.vendorCode}\`) | Email: \`${v.email || 'N/A'}\` | Contact: ${v.contact || 'N/A'} | GSTIN: \`${v.gstin || 'N/A'}\` | Address: "${v.address || 'N/A'}" | Credit Terms: **${v.creditDays || 30} days** | Lead Time: **${v.leadTimeDays || 7} days** | On-Time SLA: **${v.deliveryPct}%** | Rejection Rate: **${v.rejectionPct}%**`
      ).join('\n')
    : 'No vendor records found in PostgreSQL `vendors` table.';

  // Format all Purchase Orders
  const poLines = purchaseOrders.length > 0
    ? purchaseOrders.map((p) =>
        `- PO: \`${p.poNumber || `PO-${p.id}`}\` | Vendor: **${p.vendorName}** (\`${p.vendorEmail || 'N/A'}\`) | SKU: \`${p.sku}\` | Product: ${p.productName || p.sku} | Quantity: ${Number(p.quantity).toLocaleString('en-IN')} | Unit Rate: ₹${p.rate} | Total: **₹${Number(p.totalValue || (Number(p.quantity) * Number(p.rate))).toLocaleString('en-IN')}** | Status: **${p.status}** | Expected Delivery: \`${p.expectedDelivery || 'N/A'}\` | Credit Days: ${p.creditDays || 30} | Delivery Timeline: ${p.givenDays || 14} days | Auto-Check Day: Day ${p.reminderDaysThreshold || 'N/A'} | Follow-up Sent: ${p.reminderSent}${p.rejectionReason ? ` | Rejection Note: "${p.rejectionReason}"` : ''}${p.deliveryFeedback ? ` | Delivery Feedback: "${p.deliveryFeedback}"` : ''}`
      ).join('\n')
    : 'No purchase order records found in PostgreSQL `purchase_orders` table.';

  // Format all Channel Orders
  const channelLines = channelOrders.length > 0
    ? channelOrders.map((o) =>
        `- Order: \`${o.channelOrderId}\` (${o.channel.toUpperCase()}) | Item: **${o.productName}** (SKU: \`${o.productSku || 'N/A'}\`) | Qty: ${o.quantity} | Price: ₹${Number(o.price).toLocaleString('en-IN')} | Status: **${o.status}** | Location: ${o.location || 'N/A'} | Date: ${new Date(o.orderedAt).toISOString().split('T')[0]}`
      ).join('\n')
    : 'No channel order records found in PostgreSQL `channel_orders` table.';

  // Derive unique products directly from database records
  const uniqueProductsMap = new Map();
  purchaseOrders.forEach((p) => {
    if (p.sku && !uniqueProductsMap.has(p.sku)) {
      uniqueProductsMap.set(p.sku, {
        sku: p.sku,
        name: p.productName || p.sku,
        lastRate: p.rate,
        totalOrderedQty: Number(p.quantity) || 0,
      });
    } else if (p.sku) {
      const existing = uniqueProductsMap.get(p.sku);
      existing.totalOrderedQty += Number(p.quantity) || 0;
    }
  });

  channelOrders.forEach((o) => {
    const key = o.productSku || o.productName;
    if (key && !uniqueProductsMap.has(key)) {
      uniqueProductsMap.set(key, {
        sku: o.productSku || 'N/A',
        name: o.productName,
        lastRate: o.price,
        totalOrderedQty: Number(o.quantity) || 0,
      });
    }
  });

  const uniqueProductLines = Array.from(uniqueProductsMap.values()).map((p) =>
    `- SKU: \`${p.sku}\` | Product Name: **${p.name}** | Unit Rate/Price: ₹${p.lastRate} | Total Volume Ordered: ${p.totalOrderedQty} units`
  ).join('\n') || 'No product records found across database tables.';

  // Format API endpoints
  const apiLines = SYSTEM_API_DIRECTORY.map((a) =>
    `- \`${a.method} ${a.path}\` — ${a.description}`
  ).join('\n');

  return `
================================================================================
🏢 GREENFIBRE ENTERPRISE ERP — LIVE POSTGRESQL DATABASE CONTEXT
================================================================================

### 1. LIVE DATABASE METRICS:
- Total Vendors: ${stats.totalVendors}
- Total Purchase Orders: ${stats.totalPOs} (${stats.pendingPOs} in Approval Queue, ${stats.confirmedPOs} Confirmed, ${stats.deliveredPOs} Delivered, ${stats.rejectedPOs} Rejected)
- Total Channel Sales Orders: ${stats.totalChannelOrders} (Revenue: ₹${stats.totalChannelRevenue.toLocaleString('en-IN')})

### 2. LIVE VENDORS TABLE (\`vendors\`):
${vendorLines}

### 3. LIVE PURCHASE ORDERS TABLE (\`purchase_orders\`):
${poLines}

### 4. LIVE CHANNEL ORDERS TABLE (\`channel_orders\`):
${channelLines}

### 5. PRODUCTS & SKUS IN DATABASE:
${uniqueProductLines}

### 6. COMPLETE BACKEND REST API DIRECTORY:
${apiLines}
================================================================================`;
}

/**
 * Execute Groq AI Chat Completion with Strict Anti-Hallucination Guardrails
 * @param {{ message: string, history?: Array<{ sender: string, content: string }> }} params
 * @returns {Promise<{ answer: string, model: string, grounded: boolean }>}
 */
export async function executeGroqChat({ message, history = [] }) {
  if (!message || !message.trim()) {
    return {
      answer: "Please provide a valid question.",
      model: 'system',
      grounded: false,
    };
  }

  const cleanMessage = message.trim();
  const dbContext = await getLiveDatabaseContext();
  const dbContextString = formatComprehensiveDatabaseContext(dbContext);

  const groq = getGroqClient();

  // If Groq client is not available, return PostgreSQL response
  if (!groq) {
    const fallbackAnswer = generatePureDatabaseResponse(cleanMessage, dbContext);
    return {
      answer: fallbackAnswer,
      model: 'GreenFibre Intelligence (PostgreSQL Grounded)',
      grounded: true,
    };
  }

  // Strict Zero-Hallucination System Prompt
  const systemPrompt = `You are Groq AI, the intelligent enterprise supply chain and database assistant for GreenFibre.

CRITICAL ZERO-HALLUCINATION INSTRUCTIONS:
1. You have direct access to the live PostgreSQL database snapshot provided below.
2. Ground all answers 100% strictly in the provided database context.
3. NEVER INVENT, GUESS, OR HALLUCINATE: If a user asks about a vendor, order number, SKU, product, person, price, date, or piece of data that is NOT present in the database below, you MUST state directly:
   "I do not have any record for that in our PostgreSQL database."
4. Do NOT make up hypothetical vendor names, fake order numbers, or unrecorded figures.
5. If the database context has the requested records, summarize them clearly and accurately using Markdown bullet points or tables.

${dbContextString}`;

  // Format messages array with conversation history
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
  ];

  // Include recent conversation history (up to last 10 turns)
  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-10);
    for (const turn of recentHistory) {
      if (turn && turn.content) {
        const role = turn.sender === 'user' ? 'user' : 'assistant';
        formattedMessages.push({ role, content: turn.content });
      }
    }
  }

  // Add current user query
  formattedMessages.push({ role: 'user', content: cleanMessage });

  // Multi-model execution with resilient fallback
  const candidateModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: formattedMessages,
        temperature: 0.0, // Strict zero temperature for maximum factual adherence and zero hallucination
        max_tokens: 1536,
      });

      const responseText = completion?.choices?.[0]?.message?.content;
      if (responseText && responseText.trim()) {
        return {
          answer: responseText.trim(),
          model: `Groq (${model})`,
          grounded: true,
        };
      }
    } catch (err) {
      console.warn(`[groqService] Model ${model} attempt failed:`, err.message);
      lastError = err;
    }
  }

  console.error('[groqService] All Groq models failed. Falling back to direct DB queries.', lastError?.message);
  const dbAnswer = generatePureDatabaseResponse(cleanMessage, dbContext);
  return {
    answer: dbAnswer,
    model: 'GreenFibre Intelligence (PostgreSQL Grounded Fallback)',
    grounded: true,
  };
}

/**
 * Pure database answer generator querying live PostgreSQL records
 */
function generatePureDatabaseResponse(query, dbContext) {
  const q = query.toLowerCase();
  const { vendors, purchaseOrders, channelOrders, stats } = dbContext;

  // Vendors table query
  if (q.includes('vendor') || q.includes('supplier')) {
    if (vendors.length === 0) {
      return "There are currently no vendor records found in the PostgreSQL `vendors` table.";
    }
    const list = vendors.map((v) =>
      `• **${v.name}** (Code: \`${v.vendorCode}\`)\n  - Email: \`${v.email || 'N/A'}\`\n  - Contact: \`${v.contact || 'N/A'}\`\n  - Credit Days: **${v.creditDays} days** | Lead Time: **${v.leadTimeDays} days**\n  - On-Time SLA: **${v.deliveryPct}%** | Rejection Rate: **${v.rejectionPct}%**`
    ).join('\n\n');
    return `### 🏢 Vendors in PostgreSQL Database (${vendors.length} Total)\n\n${list}`;
  }

  // Purchase orders table query
  if (q.includes('po') || q.includes('purchase order') || q.includes('order')) {
    if (purchaseOrders.length === 0) {
      return "There are currently no purchase order records found in the PostgreSQL `purchase_orders` table.";
    }
    const list = purchaseOrders.map((p) =>
      `• **${p.poNumber || `PO-${p.id}`}**: **${p.productName || p.sku}** (\`${p.sku}\`)\n  - Vendor: **${p.vendorName}** (${p.vendorEmail || 'N/A'})\n  - Quantity: **${Number(p.quantity).toLocaleString('en-IN')}** @ ₹${p.rate}/unit (Total: **₹${Number(p.totalValue || (Number(p.quantity) * Number(p.rate))).toLocaleString('en-IN')}**)\n  - Status: **${p.status}** | Expected Delivery: \`${p.expectedDelivery || 'N/A'}\`${p.rejectionReason ? `\n  - Rejection Reason: *"${p.rejectionReason}"*` : ''}`
    ).join('\n\n');
    return `### 📦 Purchase Orders in PostgreSQL Database (${stats.totalPOs} Total: ${stats.pendingPOs} Pending, ${stats.confirmedPOs} Confirmed, ${stats.deliveredPOs} Delivered, ${stats.rejectedPOs} Rejected)\n\n${list}`;
  }

  // Channel orders table query
  if (q.includes('channel') || q.includes('amazon') || q.includes('flipkart') || q.includes('sales') || q.includes('revenue')) {
    if (channelOrders.length === 0) {
      return "There are currently no channel order records found in the PostgreSQL `channel_orders` table.";
    }
    const list = channelOrders.map((o) =>
      `• **${o.channel.toUpperCase()}** Order \`${o.channelOrderId}\`: **${o.productName}** (Qty: ${o.quantity}, Price: ₹${Number(o.price).toLocaleString('en-IN')}) — Status: **${o.status}** (${o.location || 'N/A'})`
    ).join('\n');
    return `### 🛒 Channel Orders in PostgreSQL Database (${stats.totalChannelOrders} Total, Revenue: ₹${stats.totalChannelRevenue.toLocaleString('en-IN')})\n\n${list}`;
  }

  // Generic lookup with no matching entity
  return "I do not have any record for that in our PostgreSQL database.";
}
