import { db } from '../db/index.js';
import { vendors } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

// ── GET all vendors ───────────────────────────────────────────────────────────
export async function getAllVendors(req, res) {
  try {
    const rows = await db
      .select()
      .from(vendors)
      .orderBy(asc(vendors.name));
    res.json(rows);
  } catch (err) {
    console.error('[vendorController.getAllVendors]', err);
    res.status(500).json({ message: 'Failed to fetch vendors', error: err.message });
  }
}

// ── GET single vendor by id ───────────────────────────────────────────────────
export async function getVendorById(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  try {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    console.error('[vendorController.getVendorById]', err);
    res.status(500).json({ message: 'Failed to fetch vendor', error: err.message });
  }
}

// ── GET vendor codes list (lightweight — for dropdowns) ───────────────────────
export async function getVendorCodes(req, res) {
  try {
    const rows = await db
      .select({
        id:         vendors.id,
        vendorCode: vendors.vendorCode,
        name:       vendors.name,
      })
      .from(vendors)
      .orderBy(asc(vendors.vendorCode));
    res.json(rows);
  } catch (err) {
    console.error('[vendorController.getVendorCodes]', err);
    res.status(500).json({ message: 'Failed to fetch vendor codes', error: err.message });
  }
}

// ── POST create vendor ────────────────────────────────────────────────────────
export async function createVendor(req, res) {
  const { vendorCode, name, contact, email, gstin, address, leadTimeDays, creditDays } = req.body;

  if (!vendorCode?.trim()) return res.status(400).json({ message: 'vendorCode is required' });
  if (!name?.trim())       return res.status(400).json({ message: 'name is required' });

  try {
    const [created] = await db
      .insert(vendors)
      .values({
        vendorCode:   vendorCode.trim().toUpperCase(),
        name:         name.trim(),
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
    if (err.message?.toLowerCase().includes('unique')) {
      return res.status(409).json({ message: `Vendor code "${vendorCode}" already exists` });
    }
    console.error('[vendorController.createVendor]', err);
    res.status(500).json({ message: 'Failed to create vendor', error: err.message });
  }
}

// ── PUT update vendor ─────────────────────────────────────────────────────────
export async function updateVendor(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  const { name, contact, email, gstin, address, leadTimeDays, creditDays } = req.body;

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ message: 'name cannot be empty' });
  }

  try {
    const patch = {};
    if (name         !== undefined) patch.name         = name.trim();
    if (contact      !== undefined) patch.contact      = contact || null;
    if (email        !== undefined) patch.email        = email   || null;
    if (gstin        !== undefined) patch.gstin        = gstin   || null;
    if (address      !== undefined) patch.address      = address || null;
    if (leadTimeDays !== undefined) patch.leadTimeDays = Number(leadTimeDays);
    if (creditDays   !== undefined) patch.creditDays   = Number(creditDays);
    patch.updatedAt = new Date();

    const [updated] = await db
      .update(vendors)
      .set(patch)
      .where(eq(vendors.id, id))
      .returning();

    if (!updated) return res.status(404).json({ message: 'Vendor not found' });
    res.json(updated);
  } catch (err) {
    console.error('[vendorController.updateVendor]', err);
    res.status(500).json({ message: 'Failed to update vendor', error: err.message });
  }
}

// ── DELETE vendor ─────────────────────────────────────────────────────────────
export async function deleteVendor(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  try {
    const [deleted] = await db
      .delete(vendors)
      .where(eq(vendors.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: 'Vendor deleted successfully', vendor: deleted });
  } catch (err) {
    console.error('[vendorController.deleteVendor]', err);
    res.status(500).json({ message: 'Failed to delete vendor', error: err.message });
  }
}
