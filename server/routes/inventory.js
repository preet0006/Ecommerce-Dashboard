import { Router } from 'express';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, or, asc, desc } from 'drizzle-orm';

const router = Router();

function formatInventoryItem(p) {
  const stock = Number(p.physical ?? 0);
  const cost = Number(p.landedCost || p.costPrice || 0);
  const price = Number(p.sellingPrice || 0);
  const stockValue = stock * cost;

  let stockStatus = 'in_stock';
  if (stock === 0) stockStatus = 'out_of_stock';
  else if (stock < 100) stockStatus = 'low_stock';

  return {
    id: p.sku,
    sku: p.sku,
    dbId: p.id,
    name: p.name,
    category: p.category || 'General',
    warehouse: p.warehouse || 'Bhiwandi',
    physicalStock: stock,
    stock,
    inTransit: Number(p.inTransit ?? 0),
    reserved: Number(p.reserved ?? 0),
    availableStock: Math.max(0, stock - Number(p.reserved ?? 0)),
    costPrice: cost,
    sellingPrice: price,
    inventoryValue: Math.round(stockValue),
    status: stockStatus,
    leadTimeDays: Number(p.leadTimeDays || 14),
    safetyStockDays: Number(p.safetyStockDays || 5),
    sales30d: Number(p.sales30d || 0),
    updatedAt: p.updatedAt,
  };
}

// ── GET /api/inventory — Full inventory list & summary ────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, warehouse, status, search } = req.query;
    let rows = await db.select().from(products).orderBy(asc(products.name));

    let items = rows.map(formatInventoryItem);

    if (category) {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }
    if (warehouse) {
      items = items.filter((i) => i.warehouse.toLowerCase() === warehouse.toLowerCase());
    }
    if (status) {
      items = items.filter((i) => i.status.toLowerCase() === status.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }

    const totalSkus = items.length;
    const totalPhysicalUnits = items.reduce((sum, i) => sum + i.physicalStock, 0);
    const totalInventoryValue = items.reduce((sum, i) => sum + i.inventoryValue, 0);
    const lowStockCount = items.filter((i) => i.status === 'low_stock').length;
    const outOfStockCount = items.filter((i) => i.status === 'out_of_stock').length;

    res.json({
      summary: {
        totalSkus,
        totalUnits: totalPhysicalUnits,
        totalPhysicalStock: totalPhysicalUnits,
        totalInventoryValue: Math.round(totalInventoryValue),
        lowStockCount,
        outOfStockCount,
        warehouses: ['Bhiwandi', 'Navi Mumbai', 'Central Warehouse'],
      },
      items,
      count: items.length,
    });
  } catch (err) {
    console.error('[inventory.getInventory]', err);
    res.status(500).json({ message: 'Failed to fetch inventory', error: err.message });
  }
});

// ── GET /api/inventory/summary — Inventory KPI overview ──────────────────────
router.get('/summary', async (_req, res) => {
  try {
    const rows = await db.select().from(products);
    const items = rows.map(formatInventoryItem);

    const totalSkus = items.length;
    const totalUnits = items.reduce((sum, i) => sum + i.physicalStock, 0);
    const totalInventoryValue = items.reduce((sum, i) => sum + i.inventoryValue, 0);
    const lowStockCount = items.filter((i) => i.status === 'low_stock').length;
    const outOfStockCount = items.filter((i) => i.status === 'out_of_stock').length;

    res.json({
      totalSkus,
      totalUnits,
      totalInventoryValue: Math.round(totalInventoryValue),
      lowStockCount,
      outOfStockCount,
      healthyStockCount: Math.max(0, totalSkus - lowStockCount - outOfStockCount),
    });
  } catch (err) {
    console.error('[inventory.getSummary]', err);
    res.status(500).json({ message: 'Failed to fetch inventory summary', error: err.message });
  }
});

// ── GET /api/inventory/low-stock — Reorder & Low Stock Alerts ────────────────
router.get('/low-stock', async (_req, res) => {
  try {
    const rows = await db.select().from(products);
    const items = rows.map(formatInventoryItem);
    const lowStockItems = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');

    res.json({
      count: lowStockItems.length,
      items: lowStockItems,
    });
  } catch (err) {
    console.error('[inventory.getLowStock]', err);
    res.status(500).json({ message: 'Failed to fetch low stock items', error: err.message });
  }
});

// ── PATCH /api/inventory/:sku/stock — Adjust product stock ───────────────────
router.patch('/:sku/stock', async (req, res) => {
  const { sku } = req.params;
  const { physical, stock, adjustment, reason } = req.body;
  const targetSku = sku.trim().toUpperCase();

  try {
    const [existing] = await db.select().from(products).where(eq(products.sku, targetSku));
    if (!existing) return res.status(404).json({ message: `SKU ${sku} not found` });

    let newStock = existing.physical || 0;
    if (physical !== undefined) newStock = Number(physical);
    else if (stock !== undefined) newStock = Number(stock);
    else if (adjustment !== undefined) newStock = Math.max(0, newStock + Number(adjustment));

    const [updated] = await db.update(products)
      .set({
        physical: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.sku, targetSku))
      .returning();

    res.json({
      success: true,
      message: `Stock updated for ${targetSku}`,
      item: formatInventoryItem(updated),
      reason: reason || 'Manual adjustment',
    });
  } catch (err) {
    console.error('[inventory.updateStock]', err);
    res.status(500).json({ message: 'Failed to update stock', error: err.message });
  }
});

export default router;
