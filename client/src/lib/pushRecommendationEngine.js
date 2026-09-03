// Deterministic, fully-explainable scoring — no AI/black-box logic here.
// Every threshold below is intentional and shown in the reason text,
// so an admin can see exactly why a product was flagged.

const SELL_THROUGH_THRESHOLD = 35;   // % of available stock sold in last 30 days
const DAYS_COVER_THRESHOLD = 60;     // days of stock remaining at current pace
const MARGIN_THRESHOLD = 25;         // % margin below which cost-of-sale is "high"

export function computePushCandidates(products) {
  return products
    .map((p) => {
      const available = (p.physical ?? p.stock ?? 0) + (p.inTransit ?? 0);
      const dailySales = (p.sales30d ?? 0) / 30;
      const sellThroughPct = available > 0 ? Math.round(((p.sales30d ?? 0) / available) * 100) : 0;
      const daysCover = dailySales > 0 ? Math.round((available / dailySales) * 10) / 10 : 999;
      const marginPct = p.sellingPrice
        ? Math.round(((p.sellingPrice - (p.landedCost ?? p.costPrice ?? 0)) / p.sellingPrice) * 1000) / 10
        : 0;

      const reasonTags = [];
      const lowSales = sellThroughPct < SELL_THROUGH_THRESHOLD || daysCover > DAYS_COVER_THRESHOLD;
      const highCostOfSale = marginPct < MARGIN_THRESHOLD;

      if (sellThroughPct < SELL_THROUGH_THRESHOLD) {
        reasonTags.push(`Only ${sellThroughPct}% sell-through in the last 30 days (below the ${SELL_THROUGH_THRESHOLD}% healthy threshold)`);
      }
      if (daysCover > DAYS_COVER_THRESHOLD) {
        reasonTags.push(`${daysCover} days of stock cover at current sales pace (above the ${DAYS_COVER_THRESHOLD}-day threshold)`);
      }
      if (highCostOfSale) {
        reasonTags.push(`Margin is only ${marginPct}% — high cost relative to selling price (below the ${MARGIN_THRESHOLD}% threshold)`);
      }

      if (!lowSales && !highCostOfSale) return null;

      return {
        sku: p.sku,
        productName: p.name,
        category: p.category,
        sellThroughPct,
        daysCover,
        marginPct,
        reasonTags,
        prices: { amazon: p.amazon, flipkart: p.flipkart, website: p.website },
      };
    })
    .filter(Boolean);
}
