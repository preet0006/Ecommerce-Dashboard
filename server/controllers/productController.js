import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, or, asc } from 'drizzle-orm';

const INITIAL_PRODUCTS_SEED = [
  { sku: 'GF-CAS-001', name: 'Casserole Set A (3pc)', category: 'Casserole', mrp: '1299', sellingPrice: '899', landedCost: '585', physical: 650 },
  { sku: 'GF-BWL-014', name: 'Bowl Set B (6pc)', category: 'Bowl', mrp: '799', sellingPrice: '549', landedCost: '410', physical: 180 },
  { sku: 'GF-PET-002', name: 'Pet Bowl Steel', category: 'Pet Accessories', mrp: '349', sellingPrice: '249', landedCost: '140', physical: 900 },
  { sku: 'GF-CAS-005', name: 'Casserole Set C (5pc)', category: 'Casserole', mrp: '1899', sellingPrice: '1399', landedCost: '1120', physical: 90 },
];

function formatProduct(p) {
  const sp = Number(p.sellingPrice || 0);
  const lc = Number(p.landedCost || 0);
  const contributionPct = sp > 0 ? ((sp - lc) / sp) * 100 : 0;
  return {
    id: p.sku,
    sku: p.sku,
    dbId: p.id,
    name: p.name,
    category: p.category || 'General',
    mrp: Number(p.mrp || 0),
    sellingPrice: sp,
    landedCost: lc,
    contributionPct: Number(contributionPct.toFixed(1)),
    stock: Number(p.physical ?? 0),
    physical: Number(p.physical ?? 0),
    inTransit: Number(p.inTransit ?? 0),
    reserved: Number(p.reserved ?? 0),
    warehouse: p.warehouse || 'Bhiwandi',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ── GET all products ──────────────────────────────────────────────────────────
export async function getAllProducts(req, res) {
  try {
    let rows = await db.select().from(products).orderBy(asc(products.name));

    // Auto-seed if database products table is empty
    if (rows.length === 0) {
      console.log('[productController] Seeding initial products...');
      await db.insert(products).values(INITIAL_PRODUCTS_SEED).onConflictDoNothing();
      rows = await db.select().from(products).orderBy(asc(products.name));
    }

    res.json(rows.map(formatProduct));
  } catch (err) {
    console.error('[productController.getAllProducts]', err);
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
}

// ── GET products summary KPI metrics ──────────────────────────────────────────
export async function getProductSummary(req, res) {
  try {
    let rows = await db.select().from(products);
    if (rows.length === 0) {
      await db.insert(products).values(INITIAL_PRODUCTS_SEED).onConflictDoNothing();
      rows = await db.select().from(products);
    }

    const items = rows.map(formatProduct);
    const totalProducts = items.length;
    const totalPhysicalStock = items.reduce((sum, p) => sum + p.stock, 0);
    const totalInventoryValue = items.reduce((sum, p) => sum + (p.stock * p.landedCost), 0);
    const totalRetailValue = items.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
    const lowStockCount = items.filter((p) => p.stock > 0 && p.stock < 100).length;
    const outOfStockCount = items.filter((p) => p.stock === 0).length;

    const categorySet = new Set(items.map((p) => p.category));
    const categoriesCount = categorySet.size;

    return res.json({
      totalProducts,
      totalStock: totalPhysicalStock,
      totalPhysicalStock,
      totalInventoryValue: Math.round(totalInventoryValue),
      totalRetailValue: Math.round(totalRetailValue),
      lowStockCount,
      outOfStockCount,
      categoriesCount,
      categories: Array.from(categorySet),
    });
  } catch (err) {
    console.error('[productController.getProductSummary]', err);
    res.status(500).json({ message: 'Failed to fetch product summary', error: err.message });
  }
}

// ── GET distinct product categories ───────────────────────────────────────────
export async function getProductCategories(req, res) {
  try {
    let rows = await db.select().from(products);
    if (rows.length === 0) {
      await db.insert(products).values(INITIAL_PRODUCTS_SEED).onConflictDoNothing();
      rows = await db.select().from(products);
    }

    const items = rows.map(formatProduct);
    const catMap = {};

    items.forEach((p) => {
      const cat = p.category || 'General';
      if (!catMap[cat]) {
        catMap[cat] = {
          name: cat,
          category: cat,
          count: 0,
          totalStock: 0,
          totalValue: 0,
          skus: [],
        };
      }
      catMap[cat].count += 1;
      catMap[cat].totalStock += p.stock;
      catMap[cat].totalValue += p.stock * p.sellingPrice;
      catMap[cat].skus.push(p.sku);
    });

    const categoryList = Object.values(catMap);
    return res.json(categoryList);
  } catch (err) {
    console.error('[productController.getProductCategories]', err);
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
}


// ── GET single product by SKU or ID ───────────────────────────────────────────
export async function getProductBySku(req, res) {
  const { sku } = req.params;
  const target = sku.trim().toUpperCase();
  const numId = isNaN(Number(sku)) ? -1 : Number(sku);

  try {
    const [item] = await db.select().from(products).where(
      or(eq(products.sku, target), eq(products.id, numId))
    );
    if (!item) return res.status(404).json({ message: 'Product not found' });
    res.json(formatProduct(item));
  } catch (err) {
    console.error('[productController.getProductBySku]', err);
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
}

// ── POST create new product ───────────────────────────────────────────────────
export async function createProduct(req, res) {
  const { id, sku, name, category, mrp, sellingPrice, landedCost, stock, physical } = req.body;
  const productSku = (sku || id || '').trim().toUpperCase();

  if (!productSku || !name) {
    return res.status(400).json({ message: 'Product SKU and Name are required' });
  }

  try {
    // Check if already exists
    const [existing] = await db.select().from(products).where(eq(products.sku, productSku));
    if (existing) {
      return res.status(400).json({ message: `Product with SKU ${productSku} already exists` });
    }

    const [created] = await db.insert(products).values({
      sku: productSku,
      name: name.trim(),
      category: category ? category.trim() : 'General',
      mrp: mrp ? String(mrp) : '0',
      sellingPrice: sellingPrice ? String(sellingPrice) : '0',
      landedCost: landedCost ? String(landedCost) : '0',
      physical: Number(stock ?? physical ?? 0),
    }).returning();

    res.status(201).json(formatProduct(created));
  } catch (err) {
    console.error('[productController.createProduct]', err);
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
}

// ── PUT/PATCH update product ──────────────────────────────────────────────────
export async function updateProduct(req, res) {
  const { sku } = req.params;
  const { name, category, mrp, sellingPrice, landedCost, stock, physical } = req.body;
  const targetSku = (sku || '').trim().toUpperCase();
  const numId = isNaN(Number(sku)) ? -1 : Number(sku);

  try {
    const [existing] = await db.select().from(products).where(
      or(eq(products.sku, targetSku), eq(products.id, numId))
    );
    if (!existing) {
      return res.status(404).json({ message: `Product ${sku} not found` });
    }

    const [updated] = await db.update(products)
      .set({
        name: name !== undefined && name !== null ? name.trim() : existing.name,
        category: category !== undefined && category !== null ? category.trim() : existing.category,
        mrp: mrp !== undefined && mrp !== null ? String(mrp) : existing.mrp,
        sellingPrice: sellingPrice !== undefined && sellingPrice !== null ? String(sellingPrice) : existing.sellingPrice,
        landedCost: landedCost !== undefined && landedCost !== null ? String(landedCost) : existing.landedCost,
        physical: stock !== undefined ? Number(stock) : (physical !== undefined ? Number(physical) : existing.physical),
        updatedAt: new Date(),
      })
      .where(eq(products.id, existing.id))
      .returning();

    res.json(formatProduct(updated));
  } catch (err) {
    console.error('[productController.updateProduct]', err);
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
}

// ── DELETE product ────────────────────────────────────────────────────────────
export async function deleteProduct(req, res) {
  const { sku } = req.params;
  const targetSku = sku.trim().toUpperCase();

  try {
    const [deleted] = await db.delete(products)
      .where(eq(products.sku, targetSku))
      .returning();

    if (!deleted) return res.status(404).json({ message: `Product with SKU ${targetSku} not found` });
    res.json({ message: 'Product deleted successfully', sku: targetSku });
  } catch (err) {
    console.error('[productController.deleteProduct]', err);
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
}

// ── POST bulk import products ─────────────────────────────────────────────────
export async function bulkImportProducts(req, res) {
  const { products: importList } = req.body;

  if (!Array.isArray(importList) || importList.length === 0) {
    return res.status(400).json({ message: 'No valid products provided for import' });
  }

  try {
    const results = [];
    for (const item of importList) {
      const itemSku = (item.sku || item.id || '').trim().toUpperCase();
      if (!itemSku || !item.name) continue;

      const [existing] = await db.select().from(products).where(eq(products.sku, itemSku));

      if (existing) {
        const [updated] = await db.update(products)
          .set({
            name: item.name.trim(),
            category: item.category ? item.category.trim() : existing.category,
            mrp: item.mrp ? String(item.mrp) : existing.mrp,
            sellingPrice: item.sellingPrice ? String(item.sellingPrice) : existing.sellingPrice,
            landedCost: item.landedCost ? String(item.landedCost) : existing.landedCost,
            physical: item.stock !== undefined ? Number(item.stock) : existing.physical,
            updatedAt: new Date(),
          })
          .where(eq(products.sku, itemSku))
          .returning();
        results.push(formatProduct(updated));
      } else {
        const [created] = await db.insert(products).values({
          sku: itemSku,
          name: item.name.trim(),
          category: item.category ? item.category.trim() : 'General',
          mrp: item.mrp ? String(item.mrp) : '0',
          sellingPrice: item.sellingPrice ? String(item.sellingPrice) : '0',
          landedCost: item.landedCost ? String(item.landedCost) : '0',
          physical: Number(item.stock ?? 0),
        }).returning();
        results.push(formatProduct(created));
      }
    }

    res.json({ message: `Successfully processed ${results.length} products`, products: results });
  } catch (err) {
    console.error('[productController.bulkImportProducts]', err);
    res.status(500).json({ message: 'Failed to process bulk import', error: err.message });
  }
}
