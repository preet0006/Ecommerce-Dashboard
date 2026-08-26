import { Boxes, RefreshCw, Ship, AlertTriangle } from 'lucide-react';

/* ── AI scoring engine (pure, no external deps) ── */
export function computeAI(r) {
  const dailyVelocity    = r.sales30d / 30;
  const velocity7d       = r.sales7d  / 7;
  const trend            = dailyVelocity > 0 ? ((velocity7d - dailyVelocity) / dailyVelocity) * 100 : 0;
  const availableStock   = r.stock + r.inTransit - r.reserved;
  const daysCover        = dailyVelocity > 0 ? availableStock / dailyVelocity : 999;
  const reorderPoint     = (dailyVelocity * r.leadTimeDays) + (dailyVelocity * r.safetyStockDays);
  const targetStock      = dailyVelocity * (r.leadTimeDays + 30 + r.safetyStockDays);
  const suggestedOrder   = Math.max(0, Math.round(targetStock - availableStock));
  const orderValue       = suggestedOrder * r.landedCost;
  const margin           = r.sellingPrice > 0 ? ((r.sellingPrice - r.landedCost) / r.sellingPrice) * 100 : 0;

  let urgency, urgencyColor, urgencyBg;
  if (daysCover <= r.leadTimeDays || r.orderDate === 'Order Now') {
    urgency = 'Critical';  urgencyColor = '#B23A34'; urgencyBg = '#FBEAE8';
  } else if (daysCover <= r.leadTimeDays + r.safetyStockDays + 7) {
    urgency = 'Warning';   urgencyColor = '#B9791E'; urgencyBg = '#FBF1DF';
  } else if (r.orderDate === 'Hold' || suggestedOrder === 0) {
    urgency = 'Hold';      urgencyColor = '#5B6B62'; urgencyBg = '#F0F3EF';
  } else {
    urgency = 'Planned';   urgencyColor = '#1F6E4C'; urgencyBg = '#E7F2EC';
  }

  let confidence = 60;
  if (Math.abs(trend) > 15)  confidence += 15;
  if (r.sales30d > 200)      confidence += 10;
  if (r.leadTimeDays <= 14)  confidence += 10;
  if (r.riskReasons.length > 1) confidence -= 5;
  confidence = Math.min(95, Math.max(40, confidence));

  const coverBarPct   = Math.min(100, (daysCover / 60) * 100);
  const coverBarColor = daysCover <= r.leadTimeDays ? '#B23A34'
    : daysCover <= 30 ? '#B9791E' : '#1F6E4C';

  return {
    dailyVelocity, velocity7d, trend,
    availableStock, daysCover: Math.round(daysCover),
    reorderPoint: Math.round(reorderPoint),
    suggestedOrder, orderValue, margin,
    urgency, urgencyColor, urgencyBg,
    confidence, coverBarPct, coverBarColor,
  };
}

/* ── AI scoring engine for dead/slow stock ── */
export function computeDeadAI(r) {
  const monthsStagnant   = r.lastSaleDaysAgo / 30;
  const totalValue       = r.stock * r.costPrice;
  const holdingCostMonth = totalValue * (r.holdingCostPctPerMonth / 100);
  const holdingCostTotal = Math.round(holdingCostMonth * monthsStagnant);
  const monthsToSell     = r.avgMonthlySales > 0 ? r.stock / r.avgMonthlySales : 999;
  const marginPct        = r.sellingPrice > 0 ? ((r.sellingPrice - r.costPrice) / r.sellingPrice) * 100 : 0;
  const maxDiscountPct   = r.sellingPrice > r.costPrice
    ? Math.floor(((r.sellingPrice - r.costPrice) / r.sellingPrice) * 100) : 0;
  const clearancePrice   = Math.round(r.costPrice * 1.05);
  const clearanceDiscount = Math.round(((r.sellingPrice - clearancePrice) / r.sellingPrice) * 100);
  const recoveryValue    = r.stock * clearancePrice;

  let tier, tierColor, tierBg, tierLabel;
  if (r.lastSaleDaysAgo >= 90 || r.avgMonthlySales <= 5) {
    tier = 'dead';     tierColor = '#B23A34'; tierBg = '#FBEAE8'; tierLabel = '💀 Dead Stock';
  } else if (r.lastSaleDaysAgo >= 60) {
    tier = 'critical'; tierColor = '#B9791E'; tierBg = '#FBF1DF'; tierLabel = '🔴 Critical';
  } else if (r.lastSaleDaysAgo >= 30) {
    tier = 'slow';     tierColor = '#1F6E4C'; tierBg = '#E7F2EC'; tierLabel = '🟡 Slow-moving';
  } else {
    tier = 'watch';    tierColor = '#5B6B62'; tierBg = '#F0F3EF'; tierLabel = '👁 Watch';
  }

  let confidence = 55;
  if (r.avgMonthlySales < 10)  confidence += 15;
  if (r.lastSaleDaysAgo > 60)  confidence += 15;
  if (r.reasons.length > 1)    confidence += 10;
  if (monthsToSell > 6)        confidence += 5;
  confidence = Math.min(95, confidence);

  const stalenessBarPct   = Math.min(100, (r.lastSaleDaysAgo / 120) * 100);
  const stalenessBarColor = r.lastSaleDaysAgo >= 90 ? '#B23A34' : r.lastSaleDaysAgo >= 60 ? '#B9791E' : '#1F6E4C';

  return {
    monthsStagnant: monthsStagnant.toFixed(1), totalValue,
    holdingCostTotal, holdingCostMonth: Math.round(holdingCostMonth),
    monthsToSell: monthsToSell > 99 ? '∞' : monthsToSell.toFixed(1),
    marginPct, maxDiscountPct, clearancePrice, clearanceDiscount, recoveryValue,
    tier, tierColor, tierBg, tierLabel, confidence, stalenessBarPct, stalenessBarColor,
  };
}

export const INVENTORY_TABS = [
  { id: 'stock',   label: 'Stock Overview',              icon: Boxes },
  { id: 'reorder', label: 'Reorder Recommendations',     icon: RefreshCw },
  { id: 'transit', label: 'In-Transit Tracking',         icon: Ship },
  { id: 'dead',    label: 'Slow-moving / Dead Stock',    icon: AlertTriangle },
];

export const MOCK_STOCK = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', warehouse: 'Bhiwandi', physical: 650, inTransit: 0, reserved: 40 },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', warehouse: 'Bhiwandi', physical: 180, inTransit: 800, reserved: 60 },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', warehouse: 'Delhi NCR', physical: 900, inTransit: 0, reserved: 20 },
  { sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', warehouse: 'Bhiwandi', physical: 90, inTransit: 400, reserved: 15 },
  { sku: 'GF-PLT-003', name: 'Dinner Plate Set (6pc)', warehouse: 'Bengaluru', physical: 500, inTransit: 200, reserved: 50 },
  { sku: 'GF-MUG-008', name: 'Ceramic Mug Set (4pc)', warehouse: 'Delhi NCR', physical: 320, inTransit: 150, reserved: 30 },
  { sku: 'GF-BOT-012', name: 'Stainless Steel Bottle 1L', warehouse: 'Bhiwandi', physical: 1200, inTransit: 0, reserved: 110 },
  { sku: 'GF-LNC-007', name: 'Bento Lunch Box 3-Tier', warehouse: 'Kolkata', physical: 450, inTransit: 300, reserved: 45 },
  { sku: 'GF-GLS-004', name: 'Highball Tumbler (6pc)', warehouse: 'Bengaluru', physical: 280, inTransit: 0, reserved: 25 },
  { sku: 'GF-JAR-019', name: 'Airtight Spice Jar (12pc)', warehouse: 'Ahmedabad', physical: 600, inTransit: 500, reserved: 80 },
];

export const MOCK_REORDER = [
  {
    sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', category: 'Casserole',
    stock: 650, inTransit: 0, reserved: 40,
    sales30d: 500, sales7d: 140,
    leadTimeDays: 21, safetyStockDays: 7,
    landedCost: 585, sellingPrice: 899,
    orderDate: '2026-09-05',
    riskReasons: ['Festive season ahead', 'Vendor lead time 21d'],
  },
  {
    sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', category: 'Bowl',
    stock: 180, inTransit: 800, reserved: 60,
    sales30d: 400, sales7d: 130,
    leadTimeDays: 14, safetyStockDays: 5,
    landedCost: 410, sellingPrice: 549,
    orderDate: 'Order Now',
    riskReasons: ['Stock below reorder point', 'High 7-day velocity'],
  },
  {
    sku: 'GF-PET-002', name: 'Pet Bowl Steel', category: 'Pet Accessories',
    stock: 900, inTransit: 0, reserved: 20,
    sales30d: 300, sales7d: 65,
    leadTimeDays: 18, safetyStockDays: 5,
    landedCost: 140, sellingPrice: 249,
    orderDate: 'Hold',
    riskReasons: ['Overstocked — 90d cover'],
  },
  {
    sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', category: 'Casserole',
    stock: 90, inTransit: 400, reserved: 15,
    sales30d: 180, sales7d: 62,
    leadTimeDays: 12, safetyStockDays: 4,
    landedCost: 1120, sellingPrice: 1399,
    orderDate: 'Order Now',
    riskReasons: ['Near stockout', 'Transit qty may not arrive in time'],
  },
];

export const MOCK_IN_TRANSIT = [
  { poId: 'PO-2026-0142', sku: 'GF-CAS-001', qty: 2500, vendor: 'Shreeji Plastics', shippedDate: '2026-08-15', eta: '2026-09-02', status: 'On Water' },
  { poId: 'PO-2026-0140', sku: 'GF-BWL-014', qty: 800, vendor: 'Komal Packaging Co.', shippedDate: '2026-08-10', eta: '2026-08-24', status: 'Customs' },
  { poId: 'PO-2026-0138', sku: 'GF-CAS-005', qty: 400, vendor: 'Anand Steelware', shippedDate: '2026-08-05', eta: '2026-08-20', status: 'At Warehouse' },
];

export const MOCK_DEAD_STOCK = [
  {
    sku: 'GF-STG-009', name: 'Storage Container Set', category: 'Storage',
    stock: 420, lastSaleDaysAgo: 74, avgMonthlySales: 85,
    costPrice: 162, mrp: 699, sellingPrice: 499,
    holdingCostPctPerMonth: 2,
    reasons: ['Seasonal drop-off', 'New variant launched'],
  },
  {
    sku: 'GF-PET-006', name: 'Pet Feeder Large', category: 'Pet Accessories',
    stock: 210, lastSaleDaysAgo: 61, avgMonthlySales: 40,
    costPrice: 150, mrp: 449, sellingPrice: 349,
    holdingCostPctPerMonth: 2,
    reasons: ['Low reorder rate', 'Competitor pricing pressure'],
  },
  {
    sku: 'GF-CAS-003', name: 'Casserole Set (Discontinued)', category: 'Casserole',
    stock: 85, lastSaleDaysAgo: 120, avgMonthlySales: 5,
    costPrice: 500, mrp: 1199, sellingPrice: 999,
    holdingCostPctPerMonth: 2,
    reasons: ['Discontinued line', 'No reorders in 4 months'],
  },
];
