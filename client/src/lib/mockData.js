export const mockKpis = [
  { id: 'sales',        label: "Today's sales",          value: 184500,  format: 'currency', delta: 6.2,  tone: 'ok' },
  { id: 'margin',       label: 'Gross margin',            value: 27.4,    format: 'percent',  delta: -1.8, tone: 'warn' },
  { id: 'contribution', label: 'Contribution',            value: 61200,   format: 'currency', delta: 3.1,  tone: 'ok' },
  { id: 'inventory',    label: 'Inventory value',         value: 2840000, format: 'currency', delta: 0,    tone: 'ok' },
  { id: 'cash',         label: 'Cash for next PO',        value: 950000,  format: 'currency', delta: 0,    tone: 'warn' },
  { id: 'forecast',     label: 'Projected 30-day sales',  value: 4200000, format: 'currency', delta: 4.4,  tone: 'ok' },
];

export const mockAlerts = [
  { id: 1, tone: 'danger', title: 'Reorder now — Bowl Set B',        detail: '14 days stock cover, below safety threshold', time: '2h ago' },
  { id: 2, tone: 'warn',   title: 'Margin below target — Pet Bowl',  detail: 'Contribution margin at 17%, below 20% floor', time: '4h ago' },
  { id: 3, tone: 'warn',   title: 'Vendor price increased',          detail: 'Anand Plastics quoted +5.2% vs last PO',      time: '6h ago' },
  { id: 4, tone: 'ok',     title: 'Discount opportunity',             detail: 'Casserole Set A has room for 12% promo',      time: '1d ago' },
  { id: 5, tone: 'danger', title: 'Slow-moving inventory',            detail: 'Tiffin Combo: 92 days cover, no sale in 18d', time: '1d ago' },
];

export const mockChannelMargins = [
  { channel: 'Amazon',   margin: 24 },
  { channel: 'Flipkart', margin: 19 },
  { channel: 'Website',  margin: 33 },
];

export const mockVendors = [
  { id: 1, vendorCode: 'V-001', name: 'Anand Plastics Pvt Ltd', contact: '+91 98200 12345', email: 'sales@anandplastics.com', gstin: '27AAACA1234A1Z5', leadTimeDays: 7, creditDays: 30, skusSupplied: 12, rejectionPct: '1.20', deliveryPct: '97.50', address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai 400093' },
  { id: 2, vendorCode: 'V-002', name: 'Shree Kitchenware Industries', contact: '+91 98922 67890', email: 'info@shreekitchenware.in', gstin: '27AABCS5678B1Z2', leadTimeDays: 10, creditDays: 45, skusSupplied: 8, rejectionPct: '0.80', deliveryPct: '98.20', address: 'Gala 14, Parasnath Complex, Bhiwandi, Thane 421302' },
  { id: 3, vendorCode: 'V-003', name: 'Mahavir Polymer Crafts', contact: '+91 97110 54321', email: 'orders@mahavirpolymers.com', gstin: '24AAACM9876C1Z9', leadTimeDays: 14, creditDays: 15, skusSupplied: 5, rejectionPct: '3.40', deliveryPct: '89.00', address: 'Phase 2, GIDC Estate, Ahmedabad, Gujarat 382445' },
];

export const mockChannelOrders = [
  { id: 1, channel: 'amazon', channelOrderId: '408-1234567-8901234', productName: 'Stainless Steel Insulated Casserole 2.5L', productSku: 'GF-CAS-001', quantity: 2, price: 1499, status: 'delivered', location: 'Mumbai, MH', orderedAt: '2026-08-26T14:30:00Z' },
  { id: 2, channel: 'flipkart', channelOrderId: 'OD3098127391823900', productName: 'Tri-Ply Stainless Steel Kadhai 24cm', productSku: 'GF-KAD-002', quantity: 1, price: 2199, status: 'shipped', location: 'Bengaluru, KA', orderedAt: '2026-08-26T11:15:00Z' },
  { id: 3, channel: 'website', channelOrderId: 'GF-WEB-98421', productName: 'BPA-Free Microwave Safe Tiffin Set (3 Container)', productSku: 'GF-TIF-003', quantity: 3, price: 899, status: 'pending', location: 'Delhi, DL', orderedAt: '2026-08-27T09:45:00Z' },
  { id: 4, channel: 'amazon', channelOrderId: '408-9876543-2109876', productName: 'Stainless Steel Water Bottle 1000ml (Set of 2)', productSku: 'GF-BOT-004', quantity: 1, price: 1150, status: 'delivered', location: 'Pune, MH', orderedAt: '2026-08-25T16:20:00Z' },
  { id: 5, channel: 'flipkart', channelOrderId: 'OD3098127391823905', productName: 'Premium Copper Bottom Pressure Cooker 3L', productSku: 'GF-COO-005', quantity: 1, price: 2850, status: 'shipped', location: 'Hyderabad, TS', orderedAt: '2026-08-26T18:00:00Z' },
  { id: 6, channel: 'website', channelOrderId: 'GF-WEB-98435', productName: 'Non-Stick Induction Fry Pan 22cm', productSku: 'GF-PAN-006', quantity: 2, price: 1290, status: 'cancelled', location: 'Ahmedabad, GJ', orderedAt: '2026-08-24T10:10:00Z' },
];

export function mockWhatIf({ discountPct = 0, costChangePct = 0, volume = 500, basePrice = 1000, baseCost = 650 }) {
  const newPrice = basePrice * (1 - discountPct / 100);
  const newCost = baseCost * (1 + costChangePct / 100);
  const marginPerUnit = newPrice - newCost;
  const marginPct = newPrice > 0 ? (marginPerUnit / newPrice) * 100 : 0;
  const monthlyProfit = marginPerUnit * volume;
  return {
    newPrice: Math.round(newPrice),
    marginPerUnit: Math.round(marginPerUnit),
    marginPct: Number(marginPct.toFixed(1)),
    monthlyProfit: Math.round(monthlyProfit),
  };
}
