import { Groq } from 'groq-sdk';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { desc } from 'drizzle-orm';

/**
 * Primary Groq Model
 */
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODELS = [
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
    products: [],
    vendors: [],
    purchaseOrders: [],
    channelOrders: [],
    priceChanges: [],
    systemUsers: [],
    appSettings: [],
    aiSessions: [],
    aiQueries: [],
    stats: {
      totalProducts: 0,
      totalInventoryValue: 0,
      totalVendors: 0,
      totalPOs: 0,
      pendingPOs: 0,
      confirmedPOs: 0,
      deliveredPOs: 0,
      rejectedPOs: 0,
      totalChannelOrders: 0,
      totalChannelRevenue: 0,
      pendingPriceChanges: 0,
    },
  };

  try {
    const [allProducts, allVendors, allPOs, allChannelOrders, allPriceChanges, allUsers, allSettings, allSessions, allQueries] = await Promise.all([
      db.select().from(schema.products).orderBy(desc(schema.products.createdAt)).catch(() => []),
      db.select().from(schema.vendors).orderBy(desc(schema.vendors.createdAt)).catch(() => []),
      db.select().from(schema.purchaseOrders).orderBy(desc(schema.purchaseOrders.createdAt)).catch(() => []),
      db.select().from(schema.channelOrders).orderBy(desc(schema.channelOrders.orderedAt)).catch(() => []),
      db.select().from(schema.priceChanges).orderBy(desc(schema.priceChanges.createdAt)).catch(() => []),
      db.select().from(schema.systemUsers).catch(() => []),
      db.select().from(schema.appSettings).catch(() => []),
      db.select().from(schema.aiChatSessions).orderBy(desc(schema.aiChatSessions.updatedAt)).limit(10).catch(() => []),
      db.select().from(schema.aiUserQueries).orderBy(desc(schema.aiUserQueries.createdAt)).limit(15).catch(() => []),
    ]);

    context.products = allProducts || [];
    context.vendors = allVendors || [];
    context.purchaseOrders = allPOs || [];
    context.channelOrders = allChannelOrders || [];
    context.priceChanges = allPriceChanges || [];
    context.systemUsers = allUsers || [];
    context.appSettings = allSettings || [];
    context.aiSessions = allSessions || [];
    context.aiQueries = allQueries || [];

    const delivered = (allPOs || []).filter((p) => p.status === 'delivered' || p.isDelivered === 'true').length;
    const pending = (allPOs || []).filter((p) => p.status === 'pending' || p.status === 'Pending Approval').length;
    const confirmed = (allPOs || []).filter((p) => p.status === 'confirmed' || p.status === 'Approved').length;
    const rejected = (allPOs || []).filter((p) => p.status === 'rejected' || p.status === 'Rejected').length;

    const channelRev = (allChannelOrders || []).reduce((acc, o) => acc + (Number(o.price) || 0), 0);
    const invValue = (allProducts || []).reduce((acc, p) => acc + (Number(p.physical || 0) * (Number(p.costPrice || p.landedCost) || 300)), 0);
    const pendingPrices = (allPriceChanges || []).filter((pc) => pc.status === 'pending').length;

    context.stats = {
      totalProducts: (allProducts || []).length,
      totalInventoryValue: invValue,
      totalVendors: (allVendors || []).length,
      totalPOs: (allPOs || []).length,
      pendingPOs: pending,
      confirmedPOs: confirmed,
      deliveredPOs: delivered,
      rejectedPOs: rejected,
      totalChannelOrders: (allChannelOrders || []).length,
      totalChannelRevenue: channelRev,
      pendingPriceChanges: pendingPrices,
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
  const { products, vendors, purchaseOrders, channelOrders, priceChanges, systemUsers, appSettings, stats } = dbContext;

  // Format Products Table
  const productLines = products.length > 0
    ? products.map((p) =>
        `- SKU: \`${p.sku}\` | Name: **${p.name}** | Category: ${p.category || 'General'} | Physical Stock: **${p.physical || 0} units** | In-Transit: ${p.inTransit || 0} | 30d Sales: ${p.sales30d || 0} | MRP: ₹${p.mrp || 'N/A'} | Cost Price: ₹${p.costPrice || 'N/A'} | Amazon Price: ₹${p.amazon || 'N/A'} | Flipkart Price: ₹${p.flipkart || 'N/A'} | Website Price: ₹${p.website || 'N/A'} | Lead Time: ${p.leadTimeDays || 14} days | Safety Stock: ${p.safetyStockDays || 5} days`
      ).join('\n')
    : 'No records in `products` table.';

  // Format Vendors Table
  const vendorLines = vendors.length > 0
    ? vendors.map((v) =>
        `- Vendor ID ${v.id}: **${v.name}** (Code: \`${v.vendorCode}\`) | Email: \`${v.email || 'N/A'}\` | Contact: ${v.contact || 'N/A'} | GSTIN: \`${v.gstin || 'N/A'}\` | Credit Terms: **${v.creditDays || 30} days** | Lead Time: **${v.leadTimeDays || 7} days** | On-Time SLA: **${v.deliveryPct}%** | Rejection Rate: **${v.rejectionPct}%**`
      ).join('\n')
    : 'No vendor records found in PostgreSQL `vendors` table.';

  // Format Purchase Orders Table
  const poLines = purchaseOrders.length > 0
    ? purchaseOrders.map((p) =>
        `- PO: \`${p.poNumber || `PO-${p.id}`}\` | Vendor: **${p.vendorName}** (\`${p.vendorEmail || 'N/A'}\`) | SKU: \`${p.sku}\` | Product: ${p.productName || p.sku} | Quantity: ${Number(p.quantity).toLocaleString('en-IN')} | Unit Rate: ₹${p.rate} | Total: **₹${Number(p.totalValue || (Number(p.quantity) * Number(p.rate))).toLocaleString('en-IN')}** | Status: **${p.status}** | Expected Delivery: \`${p.expectedDelivery || 'N/A'}\` | Timeline: ${p.givenDays || 14} days`
      ).join('\n')
    : 'No purchase order records found in PostgreSQL `purchase_orders` table.';

  // Format Channel Orders Table
  const channelLines = channelOrders.length > 0
    ? channelOrders.map((o) =>
        `- Order: \`${o.channelOrderId}\` (${o.channel.toUpperCase()}) | Item: **${o.productName}** (SKU: \`${o.productSku || 'N/A'}\`) | Qty: ${o.quantity} | Price: ₹${Number(o.price).toLocaleString('en-IN')} | Status: **${o.status}** | Location: ${o.location || 'N/A'}`
      ).join('\n')
    : 'No channel order records found in PostgreSQL `channel_orders` table.';

  // Format Price Changes Table
  const priceChangeLines = priceChanges.length > 0
    ? priceChanges.map((pc) =>
        `- Price Change #${pc.id}: SKU \`${pc.sku}\` on ${pc.channel.toUpperCase()} from ₹${pc.fromPrice} to ₹${pc.toPrice} (Margin: ${pc.marginAfterPct || 'N/A'}%) — Status: **${pc.status}** (Requested by: ${pc.requestedBy})`
      ).join('\n')
    : 'No pending price change records in `price_changes` table.';

  // Format System Users
  const userLines = systemUsers.length > 0
    ? systemUsers.map((u) =>
        `- User: **${u.name}** (\`${u.email}\`) | Role: **${u.role}** | Department: ${u.department || 'General'} | Status: ${u.status}`
      ).join('\n')
    : 'Default Admin User active.';

  // Format API endpoints
  const apiLines = SYSTEM_API_DIRECTORY.map((a) =>
    `- \`${a.method} ${a.path}\` — ${a.description}`
  ).join('\n');

  return `
================================================================================
🏢 GREENFIBRE ENTERPRISE ERP — COMPLETE LIVE DATABASE & API SPECIFICATION
================================================================================

### 1. LIVE SYSTEM KPIS:
- Total Product Lines: ${stats.totalProducts} (Est. Inventory Value: ₹${stats.totalInventoryValue.toLocaleString('en-IN')})
- Total Vendors: ${stats.totalVendors}
- Total Purchase Orders: ${stats.totalPOs} (${stats.pendingPOs} in Approval Queue, ${stats.confirmedPOs} Confirmed, ${stats.deliveredPOs} Delivered, ${stats.rejectedPOs} Rejected)
- Total Channel Sales Orders: ${stats.totalChannelOrders} (Revenue: ₹${stats.totalChannelRevenue.toLocaleString('en-IN')})
- Pending Price Changes: ${stats.pendingPriceChanges}

### 2. LIVE PRODUCTS & INVENTORY TABLE (\`products\`):
${productLines}

### 3. LIVE VENDORS TABLE (\`vendors\`):
${vendorLines}

### 4. LIVE PURCHASE ORDERS TABLE (\`purchase_orders\`):
${poLines}

### 5. LIVE CHANNEL ORDERS TABLE (\`channel_orders\`):
${channelLines}

### 6. LIVE PRICE CHANGE REQUESTS TABLE (\`price_changes\`):
${priceChangeLines}

### 7. SYSTEM USERS & RBAC TABLE (\`system_users\`):
${userLines}

### 8. COMPLETE BACKEND REST API DIRECTORY:
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

  // Expert Enterprise System Prompt with Full ERP Grounding & Strategic Intelligence
  const systemPrompt = `You are GreenFibre Intelligence, the expert AI supply chain advisor and executive business strategist for GreenFibre (leading sustainable homeware & kitchenware brand).

YOU HAVE 100% DIRECT ACCESS TO THE COMPANY'S LIVE POSTGRESQL DATABASE AND ERP REST APIS (SNAPSHOT PROVIDED BELOW).

CORE CAPABILITIES & RESPONSIBILITIES:
1. **Live ERP Telemetry & Precision**:
   - When asked about products, inventory levels, stockout risks, safety buffer days, vendors, purchase orders, sales channels (Amazon, Flipkart, Website), price changes, or system users, ALWAYS reference the exact live data from the database snapshot below.
   - Calculate real-world metrics accurately:
     * Days of Stock Cover = (Physical Stock) / (Average Daily Sales = Sales30d / 30)
     * Stockout Risk = High if (Days of Cover) < (Vendor Lead Time + Safety Stock Days)
     * Direct Gross Margin = (Selling Price - Cost Price) / Selling Price * 100
     * Net Contribution Margin = (Selling Price - Cost Price - Platform Fees - Logistics/Returns) / Selling Price * 100
     * Total PO Value = Quantity * Unit Rate

2. **Executive Supply Chain Strategy & Problem Solving**:
   - Deliver rich, highly insightful, comprehensive, and professional responses.
   - When asked for strategies, vendor counter-offers, negotiation scripts, email drafts, dead stock liquidation plans, cash flow optimization, or margin improvement:
     * Ground your strategy in the real database facts (e.g. mention the actual vendor name, quoted price, SKU, historical rates).
     * Provide structured, beautifully formatted Markdown tables, step-by-step action plans, bulleted leverage points, and ready-to-use email drafts with subject lines.

3. **Tone & Style**:
   - Direct, authoritative, strategic, and articulate.
   - Use clean Markdown formatting: bold text, bullet points, structured tables, headers, and code tags for SKUs and PO numbers.
   - Never say "I am just an AI language model". You are GreenFibre's in-house AI intelligence engine.
   - If a specific database entity (e.g. an unknown order number or vendor) is searched for and not found in the database, clearly inform the user that no matching record exists in PostgreSQL, and offer related available data.

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
        temperature: 0.3, // Optimal temperature for precise database accuracy + articulate strategic analysis
        max_tokens: 2048,
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
  const { products, vendors, purchaseOrders, channelOrders, priceChanges, systemUsers, stats } = dbContext;

  // 1. Products / Inventory / Stockout lookup
  if (q.includes('product') || q.includes('inventory') || q.includes('stock') || q.includes('sku') || q.includes('casserole') || q.includes('tiffin') || q.includes('bottle')) {
    if (products.length === 0) {
      return `### 📦 Inventory & Products in Database\n\nNo product records found in the PostgreSQL \`products\` table.`;
    }
    const list = products.map((p) =>
      `• **${p.name}** (SKU: \`${p.sku}\`)\n  - Physical Stock: **${p.physical || 0} units** | In-Transit: **${p.inTransit || 0}**\n  - 30-Day Sales: **${p.sales30d || 0} units** | Lead Time: **${p.leadTimeDays || 14} days**\n  - Pricing: MRP ₹${p.mrp || 'N/A'}, Cost ₹${p.costPrice || 'N/A'}, Amazon ₹${p.amazon || 'N/A'}, Website ₹${p.website || 'N/A'}`
    ).join('\n\n');
    return `### 📦 Live Products & Inventory in Database (${products.length} Total SKUs, Est. Inventory Value: ₹${stats.totalInventoryValue.toLocaleString('en-IN')})\n\n${list}`;
  }

  // 2. Vendors table query
  if (q.includes('vendor') || q.includes('supplier') || q.includes('shreeji') || q.includes('anand') || q.includes('puneet')) {
    if (vendors.length === 0) {
      return "There are currently no vendor records found in the PostgreSQL `vendors` table.";
    }
    const list = vendors.map((v) =>
      `• **${v.name}** (Code: \`${v.vendorCode}\`)\n  - Email: \`${v.email || 'N/A'}\` | Contact: \`${v.contact || 'N/A'}\`\n  - Credit Days: **${v.creditDays} days** | Lead Time: **${v.leadTimeDays} days**\n  - On-Time SLA: **${v.deliveryPct}%** | Rejection Rate: **${v.rejectionPct}%**`
    ).join('\n\n');
    return `### 🏢 Vendors in PostgreSQL Database (${vendors.length} Total)\n\n${list}`;
  }

  // 3. Purchase orders table query
  if (q.includes('po') || q.includes('purchase order') || q.includes('approval') || q.includes('order')) {
    if (purchaseOrders.length === 0) {
      return "There are currently no purchase order records found in the PostgreSQL `purchase_orders` table.";
    }
    const list = purchaseOrders.map((p) =>
      `• **${p.poNumber || `PO-${p.id}`}**: **${p.productName || p.sku}** (\`${p.sku}\`)\n  - Vendor: **${p.vendorName}** (${p.vendorEmail || 'N/A'})\n  - Quantity: **${Number(p.quantity).toLocaleString('en-IN')}** @ ₹${p.rate}/unit (Total: **₹${Number(p.totalValue || (Number(p.quantity) * Number(p.rate))).toLocaleString('en-IN')}**)\n  - Status: **${p.status}** | Expected Delivery: \`${p.expectedDelivery || 'N/A'}\`${p.rejectionReason ? `\n  - Rejection Reason: *"${p.rejectionReason}"*` : ''}`
    ).join('\n\n');
    return `### 📦 Purchase Orders in PostgreSQL Database (${stats.totalPOs} Total: ${stats.pendingPOs} in Approval Queue, ${stats.confirmedPOs} Confirmed, ${stats.deliveredPOs} Delivered, ${stats.rejectedPOs} Rejected)\n\n${list}`;
  }

  // 4. Channel orders & sales table query
  if (q.includes('channel') || q.includes('amazon') || q.includes('flipkart') || q.includes('sales') || q.includes('revenue') || q.includes('margin')) {
    if (channelOrders.length === 0) {
      return "There are currently no channel order records found in the PostgreSQL `channel_orders` table.";
    }
    const list = channelOrders.slice(0, 15).map((o) =>
      `• **${o.channel.toUpperCase()}** Order \`${o.channelOrderId}\`: **${o.productName}** (Qty: ${o.quantity}, Price: ₹${Number(o.price).toLocaleString('en-IN')}) — Status: **${o.status}** (${o.location || 'N/A'})`
    ).join('\n');
    return `### 🛒 Channel Orders in PostgreSQL Database (${stats.totalChannelOrders} Total, Revenue: ₹${stats.totalChannelRevenue.toLocaleString('en-IN')})\n\n${list}`;
  }

  // 5. Price changes & approvals
  if (q.includes('price change') || q.includes('discount') || q.includes('pricing')) {
    if (priceChanges.length === 0) {
      return "No pending price change requests found in the PostgreSQL `price_changes` table.";
    }
    const list = priceChanges.map((pc) =>
      `• Price Change #${pc.id}: **${pc.productName || pc.sku}** on **${pc.channel.toUpperCase()}** from ₹${pc.fromPrice} to ₹${pc.toPrice} (Target Margin: ${pc.marginAfterPct || 'N/A'}%) — Status: **${pc.status}**`
    ).join('\n');
    return `### 🏷️ Price Change Requests in Database\n\n${list}`;
  }

  // 6. Users & Team
  if (q.includes('user') || q.includes('team') || q.includes('admin') || q.includes('role')) {
    const list = systemUsers.map((u) => `• **${u.name}** (\`${u.email}\`) — Role: **${u.role}** (${u.department})`).join('\n');
    return `### 👥 System Users & RBAC\n\n${list || 'Default Admin Account active.'}`;
  }

  // 7. General ERP Telemetry Overview
  return `### 🏢 GreenFibre ERP Live Telemetry

**Database Status & Core Records:**
- **Product SKUs**: ${stats.totalProducts} lines (Est. Inventory Value: ₹${stats.totalInventoryValue.toLocaleString('en-IN')})
- **Vendor Partners**: ${stats.totalVendors} active suppliers
- **Purchase Orders**: ${stats.totalPOs} (${stats.pendingPOs} awaiting approval, ${stats.confirmedPOs} confirmed)
- **Channel Sales**: ${stats.totalChannelOrders} orders (Total Revenue: ₹${stats.totalChannelRevenue.toLocaleString('en-IN')})
- **Pending Price Changes**: ${stats.pendingPriceChanges}

*All responses are directly grounded in the live PostgreSQL database and REST APIs.*`;
}
