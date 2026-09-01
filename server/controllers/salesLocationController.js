import { db } from '../db/index.js';
import { systemUsers, salesOrders, salesVisits } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

// In-memory live telemetry store
const liveLocations = new Map();

// In-memory sales orders fallback store
const inMemoryOrders = [
  {
    id: 'SO-2026-001',
    orderNumber: 'SO-2026-001',
    clientName: 'Metro Garments & Retail',
    clientPhone: '+91 98221 34567',
    salesRepId: '235',
    salesRepName: 'Amit Sharma',
    items: [
      { sku: 'GF-CAS-001', name: 'Casserole Set A', quantity: 30, rate: 899 },
      { sku: 'GF-BWL-014', name: 'Bowl Set B', quantity: 25, rate: 549 },
    ],
    totalAmount: 42500,
    status: 'confirmed',
    deliveryAddress: 'C.G. Road, Navrangpura, Ahmedabad',
    paymentMethod: 'Cash on Delivery',
    notes: 'Urgent festival delivery requested',
    orderDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'SO-2026-002',
    orderNumber: 'SO-2026-002',
    clientName: 'Shreeji Departmental Store',
    clientPhone: '+91 98332 45678',
    salesRepId: '285',
    salesRepName: 'Kavita Rao',
    items: [
      { sku: 'GF-PET-002', name: 'Pet Bowl Steel', quantity: 50, rate: 249 },
    ],
    totalAmount: 18750,
    status: 'delivered',
    deliveryAddress: 'Law Garden, Ellisbridge, Ahmedabad',
    paymentMethod: 'UPI / Online Transfer',
    notes: 'Delivered and signed by Store Manager',
    orderDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
];

// In-memory client visits fallback store
const inMemoryVisits = [
  {
    id: 'VST-2026-001',
    visitId: 'VST-2026-001',
    clientName: 'Metro Garments & Retail',
    clientAddress: 'Shop 4, Commercial Complex, C.G. Road, Ahmedabad',
    clientPhone: '+91 98221 34567',
    salesRepId: '235',
    salesRepName: 'Amit Sharma',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '11:00 AM',
    status: 'scheduled',
    purpose: 'Festive Stock Replenishment & Order Collection',
    outcome: null,
    notes: 'Meet purchasing manager Mr. Rajesh',
    latitude: 23.0258,
    longitude: 72.5729,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'VST-2026-002',
    visitId: 'VST-2026-002',
    clientName: 'Laxmi Supermarket Chain',
    clientAddress: 'Sindhu Bhavan Road, Bodakdev, Ahmedabad',
    clientPhone: '+91 98443 56789',
    salesRepId: '285',
    salesRepName: 'Kavita Rao',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '02:30 PM',
    status: 'in_progress',
    purpose: 'New Stainless Steel Casserole Showcase',
    outcome: null,
    notes: 'Demonstrate new GF-CAS-001 samples',
    latitude: 23.0338,
    longitude: 72.5850,
    createdAt: new Date().toISOString(),
  },
];

/**
 * POST /api/sales/location
 * Sales rep broadcasts live GPS coordinates
 */
export async function updateLocation(req, res) {
  try {
    const { userId, name, role, latitude, longitude, address, isGpsEnabled } = req.body;
    const effectiveId = String(userId || req.user?.id || 'rep_1');
    const effectiveName = name || req.user?.name || 'Sales Representative';

    const numLat = parseFloat(latitude) || 0;
    const numLng = parseFloat(longitude) || 0;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let finalAddress = address;
    if (!finalAddress || finalAddress === 'Location not tracked') {
      finalAddress = (numLat && numLng) ? `${numLat.toFixed(4)}° N, ${numLng.toFixed(4)}° E` : 'Navrangpura, Ahmedabad';
    }

    const locationData = {
      id: effectiveId,
      userId: effectiveId,
      name: effectiveName,
      role: role || 'Field Sales Rep',
      latitude: numLat,
      longitude: numLng,
      currentAddress: finalAddress,
      isGpsEnabled: Boolean(isGpsEnabled ?? true),
      status: isGpsEnabled ? 'active' : 'idle',
      lastUpdate: timeFormatted,
      updatedAt: now.toISOString(),
    };

    // Store by ID and by lowercased Name so lookups never miss
    liveLocations.set(effectiveId, locationData);
    if (effectiveName) {
      liveLocations.set(`name_${effectiveName.toLowerCase().trim()}`, locationData);
    }

    res.json({ success: true, location: locationData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
}

/**
 * GET /api/sales/locations
 * Admin & Manager fetch live sales rep fleet positions (Clean Deduplication)
 */
export async function getLiveLocations(req, res) {
  try {
    let registeredSalesUsers = [];
    try {
      registeredSalesUsers = await db.select().from(systemUsers).where(eq(systemUsers.role, 'sales'));
    } catch {
      registeredSalesUsers = [];
    }

    const result = [];
    const processedNames = new Set();
    const processedIds = new Set();

    for (const u of registeredSalesUsers) {
      const cleanName = u.name?.trim() || 'Sales Rep';
      const lowerName = cleanName.toLowerCase();

      // Find any live location matching ID or Name
      const live =
        liveLocations.get(String(u.id)) ||
        liveLocations.get(`name_${lowerName}`) ||
        Array.from(liveLocations.values()).find(
          (l) => l.name?.toLowerCase().trim() === lowerName || String(l.userId) === String(u.id) || l.id === String(u.id)
        );

      const hasLiveCoords = live && Number(live.latitude) !== 0 && Number(live.longitude) !== 0;

      // Default fallback coordinates if rep hasn't pinged yet (Ahmedabad commercial hub)
      const lat = hasLiveCoords ? Number(live.latitude) : 23.0225;
      const lng = hasLiveCoords ? Number(live.longitude) : 72.5714;
      const addr = live?.currentAddress || (hasLiveCoords ? `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E` : 'Ahmedabad Central Market');
      const isLiveActive = live ? Boolean(live.isGpsEnabled) : (u.status === 'active');

      result.push({
        id: String(u.id),
        name: cleanName,
        avatar: u.avatar || cleanName.slice(0, 2).toUpperCase() || 'SR',
        role: 'Field Sales Rep',
        status: isLiveActive ? 'active' : 'offline',
        latitude: lat,
        longitude: lng,
        currentAddress: addr,
        todaySales: 42000,
        lastUpdate: live?.lastUpdate || 'Just now',
        phone: u.phone || '+91 98765 43210',
        isGpsEnabled: isLiveActive,
        completedTasksCount: 3,
        pendingTasksCount: 1,
      });

      processedNames.add(lowerName);
      processedIds.add(String(u.id));
      if (live?.id) processedIds.add(String(live.id));
      if (live?.userId) processedIds.add(String(live.userId));
    }

    // Add any unique broadcasting reps in memory not already in DB
    for (const [key, live] of liveLocations.entries()) {
      if (key.startsWith('name_')) continue;

      const lowerName = (live.name || '').toLowerCase().trim();
      if (!processedNames.has(lowerName) && !processedIds.has(String(live.id)) && !processedIds.has(String(live.userId))) {
        result.push({
          id: live.id || `rep_${Date.now()}`,
          name: live.name || 'Field Sales Rep',
          avatar: live.name?.slice(0, 2).toUpperCase() || 'SR',
          role: live.role || 'Field Sales Rep',
          status: live.status || 'active',
          latitude: Number(live.latitude || 23.0225),
          longitude: Number(live.longitude || 72.5714),
          currentAddress: live.currentAddress || 'Ahmedabad Commercial Hub',
          todaySales: 35000,
          lastUpdate: live.lastUpdate || 'Just now',
          phone: '+91 98765 43210',
          isGpsEnabled: Boolean(live.isGpsEnabled ?? true),
          completedTasksCount: 2,
          pendingTasksCount: 1,
        });

        processedNames.add(lowerName);
        processedIds.add(String(live.id));
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ locations: result, team: result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch live locations', error: error.message });
  }
}

/**
 * GET /api/sales/orders
 * Fetch field sales orders
 */
export async function getSalesOrders(req, res) {
  try {
    const { salesRepId, status, search } = req.query;

    let orders = [...inMemoryOrders];

    try {
      if (salesOrders) {
        const rows = await db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt));
        if (rows && rows.length > 0) {
          orders = rows.map((r) => ({
            id: r.orderNumber || String(r.id),
            orderNumber: r.orderNumber || `SO-${r.id}`,
            clientName: r.clientName,
            clientPhone: r.clientPhone || '',
            salesRepId: r.salesRepId || '',
            salesRepName: r.salesRepName || '',
            items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || []),
            totalAmount: Number(r.totalAmount || 0),
            status: r.status || 'confirmed',
            deliveryAddress: r.deliveryAddress || '',
            paymentMethod: r.paymentMethod || 'Cash on Delivery',
            notes: r.notes || '',
            orderDate: r.orderDate || new Date(r.createdAt).toISOString().split('T')[0],
            createdAt: r.createdAt,
          }));
        }
      }
    } catch {
      // Fall back to inMemoryOrders
    }

    if (salesRepId) {
      orders = orders.filter((o) => String(o.salesRepId) === String(salesRepId));
    }
    if (status) {
      orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter((o) =>
        o.clientName.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.salesRepName.toLowerCase().includes(q)
      );
    }

    return res.json({ orders, count: orders.length });
  } catch (error) {
    console.error('[salesLocationController.getSalesOrders]', error);
    return res.status(500).json({ message: 'Failed to fetch sales orders', error: error.message });
  }
}

/**
 * POST /api/sales/orders
 * Create new field sales order
 */
export async function createSalesOrder(req, res) {
  try {
    const {
      clientName,
      clientPhone,
      salesRepId,
      salesRepName,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      notes,
      orderNumber,
    } = req.body;

    if (!clientName) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    const generatedNumber = orderNumber || `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedItems = Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items) : []);
    const calculatedTotal = Number(totalAmount || parsedItems.reduce((s, i) => s + (Number(i.quantity || 1) * Number(i.rate || 0)), 0));

    const newOrder = {
      id: generatedNumber,
      orderNumber: generatedNumber,
      clientName: clientName.trim(),
      clientPhone: clientPhone || '',
      salesRepId: String(salesRepId || req.user?.id || '235'),
      salesRepName: salesRepName || req.user?.name || 'Sales Representative',
      items: parsedItems,
      totalAmount: calculatedTotal,
      status: 'confirmed',
      deliveryAddress: deliveryAddress || '',
      paymentMethod: paymentMethod || 'Cash on Delivery',
      notes: notes || '',
      orderDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    // Try saving to DB if table exists
    try {
      if (salesOrders) {
        await db.insert(salesOrders).values({
          orderNumber: generatedNumber,
          clientName: newOrder.clientName,
          clientPhone: newOrder.clientPhone,
          salesRepId: newOrder.salesRepId,
          salesRepName: newOrder.salesRepName,
          items: JSON.stringify(newOrder.items),
          totalAmount: String(newOrder.totalAmount),
          status: newOrder.status,
          deliveryAddress: newOrder.deliveryAddress,
          paymentMethod: newOrder.paymentMethod,
          notes: newOrder.notes,
          orderDate: newOrder.orderDate,
        });
      }
    } catch (e) {
      console.warn('[salesLocationController.createSalesOrder] DB insert warning:', e.message);
    }

    inMemoryOrders.unshift(newOrder);

    return res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      order: newOrder,
    });
  } catch (error) {
    console.error('[salesLocationController.createSalesOrder]', error);
    return res.status(500).json({ message: 'Failed to create sales order', error: error.message });
  }
}

/**
 * GET /api/sales/visits
 * Fetch scheduled & logged client visits
 */
export async function getSalesVisits(req, res) {
  try {
    const { salesRepId, status, date } = req.query;

    let visits = [...inMemoryVisits];

    try {
      if (salesVisits) {
        const rows = await db.select().from(salesVisits).orderBy(desc(salesVisits.createdAt));
        if (rows && rows.length > 0) {
          visits = rows.map((r) => ({
            id: r.visitId || String(r.id),
            visitId: r.visitId || `VST-${r.id}`,
            clientName: r.clientName,
            clientAddress: r.clientAddress || '',
            clientPhone: r.clientPhone || '',
            salesRepId: r.salesRepId || '',
            salesRepName: r.salesRepName || '',
            scheduledDate: r.scheduledDate || '',
            scheduledTime: r.scheduledTime || '09:00 AM',
            status: r.status || 'scheduled',
            purpose: r.purpose || 'Client Visit',
            outcome: r.outcome || null,
            notes: r.notes || '',
            latitude: Number(r.latitude || 0),
            longitude: Number(r.longitude || 0),
            completedAt: r.completedAt,
            createdAt: r.createdAt,
          }));
        }
      }
    } catch {
      // Fall back to inMemoryVisits
    }

    if (salesRepId) {
      visits = visits.filter((v) => String(v.salesRepId) === String(salesRepId));
    }
    if (status) {
      visits = visits.filter((v) => v.status.toLowerCase() === status.toLowerCase());
    }
    if (date) {
      visits = visits.filter((v) => v.scheduledDate === date);
    }

    return res.json({ visits, count: visits.length });
  } catch (error) {
    console.error('[salesLocationController.getSalesVisits]', error);
    return res.status(500).json({ message: 'Failed to fetch sales visits', error: error.message });
  }
}

/**
 * POST /api/sales/visits
 * Schedule a new client visit
 */
export async function createSalesVisit(req, res) {
  try {
    const {
      clientName,
      clientAddress,
      clientPhone,
      salesRepId,
      salesRepName,
      scheduledDate,
      scheduledTime,
      purpose,
      notes,
      latitude,
      longitude,
    } = req.body;

    if (!clientName) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    const generatedId = `VST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVisit = {
      id: generatedId,
      visitId: generatedId,
      clientName: clientName.trim(),
      clientAddress: clientAddress || 'Ahmedabad Commercial Hub',
      clientPhone: clientPhone || '',
      salesRepId: String(salesRepId || req.user?.id || '235'),
      salesRepName: salesRepName || req.user?.name || 'Sales Representative',
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || '10:00 AM',
      status: 'scheduled',
      purpose: purpose || 'Product Demo & Order Taking',
      outcome: null,
      notes: notes || '',
      latitude: Number(latitude || 23.0225),
      longitude: Number(longitude || 72.5714),
      createdAt: new Date().toISOString(),
    };

    try {
      if (salesVisits) {
        await db.insert(salesVisits).values({
          visitId: generatedId,
          clientName: newVisit.clientName,
          clientAddress: newVisit.clientAddress,
          clientPhone: newVisit.clientPhone,
          salesRepId: newVisit.salesRepId,
          salesRepName: newVisit.salesRepName,
          scheduledDate: newVisit.scheduledDate,
          scheduledTime: newVisit.scheduledTime,
          status: newVisit.status,
          purpose: newVisit.purpose,
          notes: newVisit.notes,
          latitude: String(newVisit.latitude),
          longitude: String(newVisit.longitude),
        });
      }
    } catch (e) {
      console.warn('[salesLocationController.createSalesVisit] DB insert warning:', e.message);
    }

    inMemoryVisits.unshift(newVisit);

    return res.status(201).json({
      success: true,
      message: 'Sales visit scheduled successfully',
      visit: newVisit,
    });
  } catch (error) {
    console.error('[salesLocationController.createSalesVisit]', error);
    return res.status(500).json({ message: 'Failed to schedule visit', error: error.message });
  }
}
