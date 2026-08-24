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
