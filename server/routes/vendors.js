import { Router } from 'express';
import { db } from '../db/index.js';
import { vendors } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// ── GET /api/vendors  ─────────────────────────────────────────────────────────
// Returns all vendors ordered by name
router.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(vendors)
      .orderBy(vendors.name);
    res.json(rows);
  } catch (err) {
    console.error('[GET /vendors]', err);
    res.status(500).json({ message: 'Failed to fetch vendors', error: err.message });
  }
});

// ── GET /api/vendors/:id  ─────────────────────────────────────────────────────
// Returns a single vendor by primary-key id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  try {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    console.error('[GET /vendors/:id]', err);
    res.status(500).json({ message: 'Failed to fetch vendor', error: err.message });
  }
});

// ── POST /api/vendors  ────────────────────────────────────────────────────────
// Creates a new vendor
// Body: { vendorCode, name, contact, email, gstin, address, leadTimeDays, creditDays }
router.post('/', async (req, res) => {
  const { vendorCode, name, contact, email, gstin, address, leadTimeDays, creditDays } = req.body;

  if (!vendorCode || !name) {
    return res.status(400).json({ message: 'vendorCode and name are required' });
  }

  try {
    const [created] = await db
      .insert(vendors)
      .values({
        vendorCode,
        name,
        contact:      contact      || null,
        email:        email        || null,
        gstin:        gstin        || null,
        address:      address      || null,
        leadTimeDays: leadTimeDays ? Number(leadTimeDays) : 7,
        creditDays:   creditDays   ? Number(creditDays)   : 30,
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    // Unique-constraint violation (duplicate vendorCode)
    if (err.message?.includes('unique')) {
      return res.status(409).json({ message: `Vendor code "${vendorCode}" already exists` });
    }
    console.error('[POST /vendors]', err);
    res.status(500).json({ message: 'Failed to create vendor', error: err.message });
  }
});

// ── PUT /api/vendors/:id  ─────────────────────────────────────────────────────
// Updates an existing vendor
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  const { name, contact, email, gstin, address, leadTimeDays, creditDays } = req.body;

  try {
    const [updated] = await db
      .update(vendors)
      .set({
        ...(name         !== undefined && { name }),
        ...(contact      !== undefined && { contact }),
        ...(email        !== undefined && { email }),
        ...(gstin        !== undefined && { gstin }),
        ...(address      !== undefined && { address }),
        ...(leadTimeDays !== undefined && { leadTimeDays: Number(leadTimeDays) }),
        ...(creditDays   !== undefined && { creditDays:   Number(creditDays) }),
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id))
      .returning();

    if (!updated) return res.status(404).json({ message: 'Vendor not found' });
    res.json(updated);
  } catch (err) {
    console.error('[PUT /vendors/:id]', err);
    res.status(500).json({ message: 'Failed to update vendor', error: err.message });
  }
});

// ── DELETE /api/vendors/:id  ──────────────────────────────────────────────────
// Soft-deletes by vendor id (hard delete — adjust to soft delete if preferred)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  try {
    const [deleted] = await db
      .delete(vendors)
      .where(eq(vendors.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: 'Vendor deleted', vendor: deleted });
  } catch (err) {
    console.error('[DELETE /vendors/:id]', err);
    res.status(500).json({ message: 'Failed to delete vendor', error: err.message });
  }
});

export default router;
