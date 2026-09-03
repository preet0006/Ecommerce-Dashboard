import { db } from '../db/index.js';
import { systemUsers, salesOrders, salesVisits, tasks, salesLocations } from '../db/schema.js';
import { eq, desc, and, sql, ilike } from 'drizzle-orm';
import { getSocketIO } from '../sockets/locationSocket.js';

// Live telemetry store (in-memory fast cache)
const liveLocations = new Map();

/**
 * Update in-memory telemetry store from socket or REST
 */
export function recordLocationUpdate(locationData) {
  const keyId = String(locationData.userId || locationData.id);
  liveLocations.set(keyId, locationData);
  if (locationData.name) {
    liveLocations.set(`name_${locationData.name.toLowerCase().trim()}`, locationData);
  }
}

/**
 * POST /api/sales/location
 * Sales rep broadcasts live GPS coordinates from mobile app (REST fallback)
 */
export async function updateLocation(req, res) {
  try {
    const { userId, name, role, latitude, longitude, address, isGpsEnabled, distanceMovedMeters } = req.body;
    const effectiveId = String(userId || req.user?.id || 'rep_1');
    const effectiveName = (name || req.user?.name || 'Sales Representative').trim();

    const numLat = parseFloat(latitude) || 0;
    const numLng = parseFloat(longitude) || 0;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let finalAddress = address;
    if (!finalAddress || finalAddress === 'Location not tracked') {
      finalAddress = (numLat && numLng) ? `${numLat.toFixed(4)}° N, ${numLng.toFixed(4)}° E` : 'Live GPS Location';
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
      status: isGpsEnabled && numLat !== 0 ? 'active' : 'idle',
      lastUpdate: timeFormatted,
      updatedAt: now.toISOString(),
    };

    // Store in-memory
    recordLocationUpdate(locationData);

    // Persist to Neon PostgreSQL sales_locations table
    try {
      await db.execute(sql`
        INSERT INTO sales_locations (user_id, name, role, latitude, longitude, address, is_gps_enabled, last_update)
        VALUES (
          ${effectiveId}, 
          ${effectiveName}, 
          ${role || 'Field Sales Rep'}, 
          ${numLat}, 
          ${numLng}, 
          ${finalAddress}, 
          ${Boolean(isGpsEnabled ?? true)}, 
          NOW()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          address = EXCLUDED.address,
          is_gps_enabled = EXCLUDED.is_gps_enabled,
          last_update = NOW();
      `);
    } catch (dbErr) {
      console.warn('[salesLocationController.updateLocation] DB insert non-fatal warning:', dbErr.message);
    }

    // Broadcast via Socket.IO to managers room if socket server is active
    const io = getSocketIO();
    if (io) {
      io.to('managers').emit('fleet:location_updated', {
        userId: effectiveId,
        name: effectiveName,
        role: role || 'Field Sales Rep',
        latitude: numLat,
        longitude: numLng,
        address: finalAddress,
        isGpsEnabled: Boolean(isGpsEnabled ?? true),
        distanceMovedMeters: Number(distanceMovedMeters) || 0,
        lastUpdate: timeFormatted,
        updatedAt: now.toISOString(),
      });
    }

    return res.json({ success: true, location: locationData });
  } catch (error) {
    console.error('[salesLocationController.updateLocation]', error);
    return res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
}

/**
 * GET /api/sales/locations
 * Admin & Manager fetch live sales rep fleet positions & real KPI stats
 */
export async function getLiveLocations(req, res) {
  try {
    let registeredSalesUsers = [];
    try {
      registeredSalesUsers = await db.select().from(systemUsers).where(eq(systemUsers.role, 'sales'));
    } catch {
      registeredSalesUsers = [];
    }

    // Fetch real orders to compute today's sales per rep
    let allOrders = [];
    try {
      allOrders = await db.select().from(salesOrders);
    } catch {
      allOrders = [];
    }

    // Fetch real tasks to compute tasks count per rep
    let allTasks = [];
    try {
      allTasks = await db.select().from(tasks);
    } catch {
      allTasks = [];
    }

    const result = [];
    const processedNames = new Set();
    const processedIds = new Set();

    for (const u of registeredSalesUsers) {
      const cleanName = u.name?.trim() || 'Sales Rep';
      const lowerName = cleanName.toLowerCase();

      // Find any live GPS broadcast matching ID or Name
      const live =
        liveLocations.get(String(u.id)) ||
        liveLocations.get(`name_${lowerName}`) ||
        Array.from(liveLocations.values()).find(
          (l) => l.name?.toLowerCase().trim() === lowerName || String(l.userId) === String(u.id) || l.id === String(u.id)
        );

      const hasLiveCoords = live && Number(live.latitude) !== 0 && Number(live.longitude) !== 0;

      const lat = hasLiveCoords ? Number(live.latitude) : 0;
      const lng = hasLiveCoords ? Number(live.longitude) : 0;
      const addr = live?.currentAddress || (hasLiveCoords ? `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E` : 'Location not tracked');
      const isLiveActive = live ? Boolean(live.isGpsEnabled) : false;

      // Calculate real metrics from DB
      const repOrders = allOrders.filter((o) => String(o.salesRepId) === String(u.id) || (o.salesRepName && o.salesRepName.toLowerCase() === lowerName));
      const repSalesTotal = repOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      const repTasks = allTasks.filter((t) => (t.assignedTo && t.assignedTo.toLowerCase().includes(lowerName)) || t.assignedToId === u.id);
      const completedTasksCount = repTasks.filter((t) => t.completed).length;
      const pendingTasksCount = repTasks.filter((t) => !t.completed).length;

      result.push({
        id: String(u.id),
        name: cleanName,
        avatar: u.avatar || cleanName.slice(0, 2).toUpperCase() || 'SR',
        role: 'Field Sales Rep',
        status: isLiveActive ? 'active' : 'offline',
        latitude: lat,
        longitude: lng,
        currentAddress: addr,
        todaySales: repSalesTotal,
        lastUpdate: live?.lastUpdate || 'Not checked in',
        phone: u.phone || '',
        isGpsEnabled: isLiveActive,
        completedTasksCount,
        pendingTasksCount,
      });

      processedNames.add(lowerName);
      processedIds.add(String(u.id));
      if (live?.id) processedIds.add(String(live.id));
      if (live?.userId) processedIds.add(String(live.userId));
    }

    // Add any unique broadcasting reps in memory
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
          latitude: Number(live.latitude || 0),
          longitude: Number(live.longitude || 0),
          currentAddress: live.currentAddress || 'Location not tracked',
          todaySales: 0,
          lastUpdate: live.lastUpdate || 'Just now',
          phone: '',
          isGpsEnabled: Boolean(live.isGpsEnabled ?? true),
          completedTasksCount: 0,
          pendingTasksCount: 0,
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
 * Fetch real field sales orders from DB
 */
export async function getSalesOrders(req, res) {
  try {
    const { salesRepId, status, search } = req.query;

    let orders = [];

    try {
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
          orderDate: r.orderDate || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          createdAt: r.createdAt,
        }));
      }
    } catch (e) {
      console.error('[salesLocationController.getSalesOrders] DB query error:', e.message);
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
 * Create new field sales order in DB
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

    if (!clientName || !clientName.trim()) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    const generatedNumber = orderNumber || `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedItems = Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items) : []);
    const calculatedTotal = Number(totalAmount || parsedItems.reduce((s, i) => s + (Number(i.quantity || 1) * Number(i.rate || 0)), 0));

    const repId = String(salesRepId || req.user?.id || '');
    const repName = salesRepName || req.user?.name || 'Sales Representative';
    const today = new Date().toISOString().split('T')[0];

    const [inserted] = await db.insert(salesOrders).values({
      orderNumber: generatedNumber,
      clientName: clientName.trim(),
      clientPhone: clientPhone ? clientPhone.trim() : '',
      salesRepId: repId,
      salesRepName: repName,
      items: JSON.stringify(parsedItems),
      totalAmount: String(calculatedTotal),
      status: 'confirmed',
      deliveryAddress: deliveryAddress ? deliveryAddress.trim() : '',
      paymentMethod: paymentMethod || 'Cash on Delivery',
      notes: notes ? notes.trim() : '',
      orderDate: today,
    }).returning();

    const formattedOrder = {
      id: inserted.orderNumber || String(inserted.id),
      orderNumber: inserted.orderNumber,
      clientName: inserted.clientName,
      clientPhone: inserted.clientPhone,
      salesRepId: inserted.salesRepId,
      salesRepName: inserted.salesRepName,
      items: parsedItems,
      totalAmount: Number(inserted.totalAmount),
      status: inserted.status,
      deliveryAddress: inserted.deliveryAddress,
      paymentMethod: inserted.paymentMethod,
      notes: inserted.notes,
      orderDate: inserted.orderDate,
      createdAt: inserted.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      order: formattedOrder,
    });
  } catch (error) {
    console.error('[salesLocationController.createSalesOrder]', error);
    return res.status(500).json({ message: 'Failed to create sales order', error: error.message });
  }
}

/**
 * GET /api/sales/visits
 * Fetch real scheduled & logged client visits from DB
 */
export async function getSalesVisits(req, res) {
  try {
    const { salesRepId, status, date } = req.query;

    let visits = [];

    try {
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
    } catch (e) {
      console.error('[salesLocationController.getSalesVisits] DB query error:', e.message);
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
 * Schedule a new client visit in DB
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

    if (!clientName || !clientName.trim()) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    const generatedId = `VST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const repId = String(salesRepId || req.user?.id || '');
    const repName = salesRepName || req.user?.name || 'Sales Representative';
    const visitDate = scheduledDate || new Date().toISOString().split('T')[0];
    const visitTime = scheduledTime || '10:00 AM';

    const [inserted] = await db.insert(salesVisits).values({
      visitId: generatedId,
      clientName: clientName.trim(),
      clientAddress: clientAddress ? clientAddress.trim() : '',
      clientPhone: clientPhone ? clientPhone.trim() : '',
      salesRepId: repId,
      salesRepName: repName,
      scheduledDate: visitDate,
      scheduledTime: visitTime,
      status: 'scheduled',
      purpose: purpose ? purpose.trim() : 'Product Demo & Order Taking',
      notes: notes ? notes.trim() : '',
      latitude: latitude ? String(latitude) : '0',
      longitude: longitude ? String(longitude) : '0',
    }).returning();

    const formattedVisit = {
      id: inserted.visitId || String(inserted.id),
      visitId: inserted.visitId,
      clientName: inserted.clientName,
      clientAddress: inserted.clientAddress,
      clientPhone: inserted.clientPhone,
      salesRepId: inserted.salesRepId,
      salesRepName: inserted.salesRepName,
      scheduledDate: inserted.scheduledDate,
      scheduledTime: inserted.scheduledTime,
      status: inserted.status,
      purpose: inserted.purpose,
      outcome: inserted.outcome,
      notes: inserted.notes,
      latitude: Number(inserted.latitude || 0),
      longitude: Number(inserted.longitude || 0),
      completedAt: inserted.completedAt,
      createdAt: inserted.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Sales visit scheduled successfully',
      visit: formattedVisit,
    });
  } catch (error) {
    console.error('[salesLocationController.createSalesVisit]', error);
    return res.status(500).json({ message: 'Failed to schedule visit', error: error.message });
  }
}

