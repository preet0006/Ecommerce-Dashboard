import { db } from '../db/index.js';
import { channelOrders } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

// ── GET all channel orders (filters: ?channel=amazon  ?status=pending) ────────
export async function getAllChannelOrders(req, res) {
  try {
    const { channel, status } = req.query;

    const conditions = [];
    if (channel) conditions.push(eq(channelOrders.channel, channel));
    if (status)  conditions.push(eq(channelOrders.status,  status));

    const rows = await db
      .select()
      .from(channelOrders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(channelOrders.orderedAt));

    res.json(rows);
  } catch (err) {
    console.error('[channelOrderController.getAllChannelOrders]', err);
    res.status(500).json({ message: 'Failed to fetch channel orders', error: err.message });
  }
}

// ── GET single channel order by id ───────────────────────────────────────────
export async function getChannelOrderById(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  try {
    const [order] = await db
      .select()
      .from(channelOrders)
      .where(eq(channelOrders.id, id));

    if (!order) return res.status(404).json({ message: 'Channel order not found' });
    res.json(order);
  } catch (err) {
    console.error('[channelOrderController.getChannelOrderById]', err);
    res.status(500).json({ message: 'Failed to fetch channel order', error: err.message });
  }
}
