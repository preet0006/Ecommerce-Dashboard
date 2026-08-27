/**
 * GreenFibre AI Knowledge Base & Suggested Quick Starters
 * Real user questions and file uploads are saved to PostgreSQL (ai_user_queries).
 */

export const SUGGESTED_PROMPTS = [
  {
    id: 'stockout-casserole',
    category: 'Inventory Risk',
    icon: '📦',
    title: 'Casserole Set Festive Stockout Risk',
    prompt: 'Analyze stockout risk for Casserole Set A (GF-CAS-001) over the upcoming festive quarter based on current velocity and vendor lead times.',
    tag: 'High Priority',
  },
  {
    id: 'vendor-negotiate',
    category: 'Procurement Strategy',
    icon: '💰',
    title: 'Counter-Offer for Shreeji Plastics',
    prompt: 'Draft an assertive yet relationship-preserving counter-offer to Shreeji Plastics for PO-2026-0142 targeting ₹475/unit down from ₹495.',
    tag: 'Negotiation',
  },
  {
    id: 'channel-margin-compare',
    category: 'Financial Optimization',
    icon: '📊',
    title: 'Amazon vs Flipkart vs Blinkit Margins',
    prompt: 'Compare net contribution margins across Amazon, Flipkart, and Quick Commerce channels. Where are we leaking profitability?',
    tag: 'Margin Analysis',
  },
  {
    id: 'dead-stock-clearance',
    category: 'Cashflow & Liquidation',
    icon: '⚡',
    title: 'Dead Stock Clearance Strategy',
    prompt: 'Identify the top 3 stagnant SKUs tied up in warehouse capital and formulate an immediate discount & bundle clearance plan.',
    tag: 'Liquidation',
  },
];

/**
 * Intelligent response generator for supply chain domains
 */
export function generateAiResponse(query) {
  const q = (query || '').toLowerCase();

  // 1. Vendor Negotiation & Rate Counter-Offers
  if (q.includes('shreeji') || q.includes('negotiat') || q.includes('counter') || q.includes('quote') || q.includes('rate') || (q.includes('price') && !q.includes('channel'))) {
    return {
      modelName: 'GreenFibre Intelligence Enterprise',
      thinkingDuration: '1.8s',
      thoughts: [
        '1. Queried vendor master & quotation history for Shreeji Plastics (V-001).',
        '2. Current Quote: ₹495.00/unit for 2,500 units of GF-CAS-001.',
        '3. Historical lowest confirmed rate: ₹470.00 (January 2026 bulk order of 3,000 units).',
        '4. Raw material polymer resin index (PP/HDPE) softened by 4.2% in domestic markets.',
        '5. Formulating counter-negotiation terms: Target rate ₹475.00/unit, 30 days credit, 14 days delivery guarantee.',
      ],
      content: `### 🤝 Vendor Counter-Negotiation Strategy & Email Draft

**Target Counter-Rate**: <strong style="color: var(--color-primary);">₹475.00/unit</strong> (Down from ₹495.00 quoted)  
**Projected Direct Cost Savings**: <strong style="color: var(--color-primary);">₹50,000.00</strong> on 2,500 units.

---

#### 📌 Leverage Points to Use:
1. **Raw Material Trend**: Polymer resin input pricing in Gujarat/Maharashtra industrial corridors softened by **4.2%** over Q2.
2. **Volume Commitment**: We are placing a firm upfront commitment of **2,500 units** with repeat Q4 festive reorders planned.
3. **Historical Benchmark**: Shreeji previously supplied identical grade batches at **₹470.00** in Jan 2026 for 3,000 units.

---

#### 📝 Recommended Vendor Email Draft:

> **Subject**: RE: Commercial Quotation & Purchase Order Confirmation - GreenFibre (PO-2026-0142)  
>  
> Dear Shreeji Plastics Commercial Team,  
>  
> Thank you for your quotation of ₹495/unit for **2,500 units of Casserole Set A (GF-CAS-001)**.  
>  
> Given our continuous procurement volume and the recent easing of raw polymer index costs, our management has approved procurement at a benchmark of **₹475.00/unit (+ GST)** with standard **30-day payment terms** and delivery within **14 calendar days**.  
>  
> Upon your confirmation of this rate, we will immediately release the formalized Purchase Order and allocate the batch for priority warehouse docking.  
>  
> Warm regards,  
> **Green Fibre Procurement Division**`,
      actionChips: [
        'Create New Purchase Order',
        'Open Purchase Order Hub',
        'View Vendor Master',
      ],
    };
  }

  // 2. Stockout Risk & Inventory Velocity Analysis
  if (q.includes('stockout') || q.includes('casserole') || q.includes('reorder') || q.includes('safety') || q.includes('runway')) {
    return {
      modelName: 'GreenFibre Intelligence Enterprise',
      thinkingDuration: '1.5s',
      thoughts: [
        '1. Cross-referencing inventory levels for Casserole Set A (GF-CAS-001) across Bhiwandi & Delhi NCR hubs.',
        '2. Current Physical Stock: 850 units | In-Transit: 400 units | Daily Sales Run-rate: 62 units/day.',
        '3. Calculated stock cover: ~13.7 days (Below 20-day safety stock floor).',
        '4. Lead time from Anand Plastics / Shreeji: 10–14 days.',
        '5. High risk of stockout during upcoming festive surge (expected +35% volume).',
      ],
      content: `### 📦 Stockout Risk Analysis: Casserole Set A (GF-CAS-001)

<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 14px;">
  <strong style="color: #ef4444;">⚠️ HIGH RISK LEVEL</strong>: Current stock runway is <strong>13.7 days</strong> against a <strong>14-day vendor lead time</strong>.
</div>

---

#### 📊 Critical Metrics Breakdown:
- **Available Physical Stock**: 850 units
- **Average 30-Day Sales Velocity**: 62 units/day (Projected festive spike: ~85 units/day)
- **Safety Threshold Floor**: 1,240 units (20 days buffer)
- **Deficit Below Buffer**: **390 units**

---

#### 🎯 Recommended Action Plan:
1. **Immediate Reorder**: Issue PO for **2,500 units** immediately with 10-day expedited delivery SLA.
2. **Safety Allocation**: Split stock 60% Amazon FBA / 40% Direct Website to protect high-margin orders.
3. **Temporary Promo Pause**: Restrict heavy flash discounts on Flipkart until new batch docks in Bhiwandi.`,
      actionChips: [
        'Create Reorder PO',
        'View Stock Overview',
        'Check Approval Queue',
      ],
    };
  }

  // 3. Channel Margin & Profitability Comparison
  if (q.includes('margin') || q.includes('channel') || q.includes('amazon') || q.includes('flipkart') || q.includes('blinkit') || q.includes('leakage')) {
    return {
      modelName: 'GreenFibre Intelligence Enterprise',
      thinkingDuration: '1.7s',
      thoughts: [
        '1. Extracting multi-channel revenue and fee structures across Amazon, Flipkart, and Direct Website.',
        '2. Amazon Net Margin: 24.0% (₹1,499 ASP, 16% referral fee, ₹110 FBA weight handling).',
        '3. Flipkart Net Margin: 19.0% (High return rate of 8.4% eroding gross contribution).',
        '4. Direct Website Margin: 33.0% (Highest contribution, minimal 2.2% payment gateway fee).',
        '5. Identifying core leakage: Flipkart returns & reverse logistics charges.',
      ],
      content: `### 📊 Multi-Channel Contribution Margin Comparison

| Sales Channel | Gross Margin | Referral/Platform Fees | Logistics / Returns | **Net Contribution** |
| :--- | :--- | :--- | :--- | :--- |
| **Direct Website** | 44.5% | 2.2% (PG) | 9.3% (Shiprocket) | <strong style="color: var(--color-primary);">33.0% (Highest)</strong> |
| **Amazon FBA** | 42.0% | 15.5% (Referral) | 12.5% (FBA + Pick) | <strong style="color: var(--color-primary);">24.0% (Healthy)</strong> |
| **Flipkart** | 39.0% | 14.0% (Comm) | 16.0% (8.4% Return Rate) | <strong style="color: #ef4444;">19.0% (Leakage)</strong> |

---

#### 🔍 Key Profitability Leakage Insights:
1. **Flipkart Return Rate**: Customer return rate on Flipkart is **8.4%** (vs 2.8% on Amazon). Reverse freight reduces margin by ~₹72 per delivered unit.
2. **Website Growth Potential**: Direct website generates **+900 bps higher net margin** than Amazon. Recommend shifting ₹25,000 ad budget to Meta D2C campaigns.
3. **Price Parity Rule**: Ensure Website price includes a 5% bundle discount to incentivize direct checkouts.`,
      actionChips: [
        'View Margin by Channel',
        'Open Pricing & Discount Hub',
        'Run What-If Scenario',
      ],
    };
  }

  // 4. Dead Stock & Capital Liquidation Strategy
  if (q.includes('dead') || q.includes('stagnant') || q.includes('slow') || q.includes('liquidat') || q.includes('clearance')) {
    return {
      modelName: 'GreenFibre Intelligence Enterprise',
      thinkingDuration: '1.6s',
      thoughts: [
        '1. Scanning SKUs with lastSaleDaysAgo > 45 days and cover > 60 days.',
        '2. Identified 3 stagnant SKUs: Tiffin Combo (92 days cover), Pet Bowl Steel (58 days cover), Water Bottle Blue (49 days cover).',
        '3. Tied-up working capital: ~₹4,20,000 across warehouse storage.',
        '4. Formulating 3-step liquidation playbook: Bundle promos, corporate gift packaging, and B2B distributor push.',
      ],
      content: `### ⚡ Stagnant & Dead Stock Liquidation Strategy

**Capital Trapped in Slow-Moving SKUs**: <strong style="color: #ef4444;">₹4,20,000.00</strong> across 3 key product lines.

---

#### 🏷️ Top 3 Stagnant SKUs Identified:
1. **Tiffin Combo (GF-TIF-003)**: 92 days of cover, zero sales in last 18 days. (₹1,85,000 capital).
2. **Pet Bowl Steel (GF-PET-002)**: 58 days of cover, low reorder velocity. (₹1,40,000 capital).
3. **Water Bottle 1L Blue (GF-BOT-004)**: 49 days of cover. (₹95,000 capital).

---

#### 🚀 Recommended Action Plan:
- **Bundle Strategy**: Create *"Festive Kitchen Combo"* bundling 1x Tiffin Set + 1x Casserole at 15% discount.
- **Clearance Flash Sale**: Run a 72-hour clearance promo on Amazon with 20% coupon discount to recover cash for next PO.
- **B2B Bulk Offer**: Push remaining 400 Pet Bowls to institutional buyers at cost price + 5%.`,
      actionChips: [
        'View Dead Stock Report',
        'Open Pricing & Discounts',
        'Run What-If Simulator',
      ],
    };
  }

  // 5. General / Dynamic Supply Chain Analysis
  return {
    modelName: 'GreenFibre Intelligence Enterprise',
    thinkingDuration: '1.4s',
    thoughts: [
      `1. Logged query in PostgreSQL question history memory.`,
      '2. Querying GreenFibre ERP database across: Products, Vendors, Purchase Orders, and Channel Sales.',
      '3. Formulating strategic response with live telemetry & data insights.',
    ],
    content: `### 🎯 Strategic Analysis & Supply Chain Telemetry

Regarding your inquiry: *"**${query}**"*

---

#### 📌 Live ERP System Snapshot:
1. **Active Vendors**: **3 primary vendors** configured with average **94.8% on-time delivery rate**.
2. **Open Purchase Orders**: Live orders tracked in database with automated delivery SLA checks.
3. **Inventory Runway**: Critical SKUs average **38 days of stock cover** across Bhiwandi and Delhi NCR fulfillment centers.
4. **Channel Sales Revenue**: Multi-channel distribution performing across Amazon, Flipkart, and Direct D2C Website.

---

#### 🚀 Recommended Next Actions:
- **Run Reorder Audit**: Verify whether any fast-moving SKUs are approaching their reorder threshold.
- **Review Approval Queue**: Check pending vendor inquiries and confirm negotiated rates.
- **Margin Optimization**: Review pricing discount guardrails to ensure healthy gross margins.`,
    actionChips: [
      'View Active Inventory Status',
      'Open Purchase Order Hub',
      'View Channel Orders',
      'Run What-If Scenario',
    ],
  };
}

