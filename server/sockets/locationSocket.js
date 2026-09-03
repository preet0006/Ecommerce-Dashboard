import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { recordLocationUpdate } from '../controllers/salesLocationController.js';

let globalIo = null;

export function getSocketIO() {
  return globalIo;
}

/**
 * Initialize Socket.IO connection and attach live location tracking handlers
 */
export function initLocationSocket(io) {
  globalIo = io;

  // Authentication & Handshake Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const role = socket.handshake.auth?.role || socket.handshake.query?.role;
    const name = socket.handshake.auth?.name || socket.handshake.query?.name;

    socket.user = {
      userId: userId ? String(userId) : null,
      role: role || 'Field Sales Rep',
      name: name || 'Sales Representative',
      token,
    };
    next();
  });

  io.on('connection', (socket) => {
    const userName = socket.user?.name || 'Anonymous';
    const userRole = socket.user?.role || 'Unknown';
    console.log(`[Socket.IO] 🔌 Client connected: ${socket.id} (User: ${userName}, Role: ${userRole})`);

    // 1. Manager / Admin joins the fleet monitoring room
    socket.on('fleet:join', () => {
      socket.join('managers');
      console.log(`[Socket.IO] 👔 ${userName} (${socket.id}) joined 'managers' tracking room`);
    });

    socket.on('fleet:leave', () => {
      socket.leave('managers');
      console.log(`[Socket.IO] 🚪 ${userName} (${socket.id}) left 'managers' tracking room`);
    });

    // 2. Employee sends live location update (filtered on app to >= 100m displacement)
    socket.on('location:update', async (data) => {
      if (!data) return;

      const {
        userId = socket.user?.userId,
        name = socket.user?.name,
        role = socket.user?.role,
        latitude,
        longitude,
        address,
        isGpsEnabled = true,
        distanceMovedMeters = 0,
      } = data;

      const effectiveUserId = String(userId || socket.user?.userId || 'rep_1');
      const effectiveName = (name || socket.user?.name || 'Sales Representative').trim();
      const numLat = parseFloat(latitude) || 0;
      const numLng = parseFloat(longitude) || 0;
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const finalAddress = address || (numLat && numLng ? `${numLat.toFixed(4)}° N, ${numLng.toFixed(4)}° E` : 'Live GPS Location');

      // Update in-memory cache in salesLocationController
      recordLocationUpdate({
        id: effectiveUserId,
        userId: effectiveUserId,
        name: effectiveName,
        role: role || 'Field Sales Rep',
        latitude: numLat,
        longitude: numLng,
        currentAddress: finalAddress,
        isGpsEnabled: Boolean(isGpsEnabled),
        status: isGpsEnabled && numLat !== 0 ? 'active' : 'idle',
        lastUpdate: timeFormatted,
        updatedAt: now.toISOString(),
      });

      try {
        // Step A: Upsert into Neon PostgreSQL sales_locations table
        await db.execute(sql`
          INSERT INTO sales_locations (user_id, name, role, latitude, longitude, address, is_gps_enabled, last_update)
          VALUES (
            ${effectiveUserId}, 
            ${effectiveName}, 
            ${role || 'Field Sales Rep'}, 
            ${numLat}, 
            ${numLng}, 
            ${finalAddress}, 
            ${Boolean(isGpsEnabled)}, 
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

        // Step B: Instantly broadcast the new location to all listening managers & admins
        io.to('managers').emit('fleet:location_updated', {
          userId: effectiveUserId,
          name: effectiveName,
          role: role || 'Field Sales Rep',
          latitude: numLat,
          longitude: numLng,
          address: finalAddress,
          isGpsEnabled: Boolean(isGpsEnabled),
          distanceMovedMeters: Number(distanceMovedMeters) || 0,
          lastUpdate: timeFormatted,
          updatedAt: now.toISOString(),
        });
      } catch (err) {
        console.error('[Socket.IO] Error updating location in PostgreSQL:', err.message);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] ❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });
}
