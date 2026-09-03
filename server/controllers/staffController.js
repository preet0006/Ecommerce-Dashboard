import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { staffMembers, systemUsers, attendanceLogs } from '../db/schema.js';
import { eq, desc, or } from 'drizzle-orm';

function formatMember(m) {
  const isPresent = m.status === 'on_time' || m.status === 'late' || m.status === 'present';
  const nameParts = (m.name || 'Staff Member').trim().split(/\s+/);
  const avatarInitials = nameParts.length >= 2 
    ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    : nameParts[0].slice(0, 2).toUpperCase();

  return {
    id: m.memberId || `m_${m.id}`,
    memberId: m.memberId || `m_${m.id}`,
    name: m.name,
    role: m.role || 'Field Sales',
    phone: m.phone || '',
    reportingTime: m.reportingTime || '09:00 AM',
    scheduledReportingTime: m.reportingTime || '09:00 AM',
    status: isPresent ? (m.status === 'late' ? 'late' : 'present') : 'absent',
    checkIn: m.checkIn || (isPresent ? (m.reportingTime || '09:00 AM') : null),
    checkOut: m.checkOut || null,
    lastCheckedInAt: m.lastCheckedInAt || null,
    lastCheckedOutAt: m.lastCheckedOutAt || null,
    avatar: avatarInitials,
    department: m.role?.toLowerCase().includes('sales') ? 'Field Sales' : 'Shift Operations',
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/**
 * GET /api/staff — Fetch all real staff/team members & attendance summary
 */
export async function getStaffMembers(_req, res) {
  try {
    const rows = await db.select().from(staffMembers).orderBy(desc(staffMembers.createdAt));
    const members = rows.map(formatMember);

    // Also include any registered sales systemUsers not already in members
    try {
      const salesUsers = await db.select().from(systemUsers).where(eq(systemUsers.role, 'sales'));
      const existingNames = new Set(members.map((m) => m.name.toLowerCase().trim()));
      
      for (const u of salesUsers) {
        if (!existingNames.has(u.name.toLowerCase().trim())) {
          members.push({
            id: `u_${u.id}`,
            memberId: `u_${u.id}`,
            userId: String(u.id),
            name: u.name,
            role: 'Field Sales',
            phone: u.phone || '',
            reportingTime: '09:00 AM',
            scheduledReportingTime: '09:00 AM',
            status: u.status === 'active' ? 'present' : 'absent',
            checkIn: u.status === 'active' ? '09:00 AM' : null,
            avatar: u.avatar || u.name.slice(0, 2).toUpperCase() || 'SR',
            department: u.department || 'Field Sales',
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          });
          existingNames.add(u.name.toLowerCase().trim());
        }
      }
    } catch {
      // Non-fatal if systemUsers query fails
    }

    const onTime = members.filter((m) => m.status === 'present' || m.status === 'on_time').length;
    const late = members.filter((m) => m.status === 'late').length;
    const absent = members.filter((m) => m.status === 'absent').length;

    return res.json({
      summary: {
        reported: onTime + late,
        total: members.length,
        onTime,
        late,
        absent,
      },
      members,
    });
  } catch (err) {
    console.error('[staffController.getStaffMembers]', err);
    return res.status(500).json({ message: 'Failed to fetch team members', error: err.message });
  }
}

/**
 * POST /api/staff
 * Manager creates a new team member and generates login credentials in systemUsers
 */
export async function createStaffMember(req, res) {
  try {
    const { name, role, email, password, phone, reportingTime, scheduledReportingTime, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const cleanName = name.trim();
    const cleanEmail = (email || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@greenfibre.com`).trim().toLowerCase();
    const rawPassword = password || 'GreenFibre@2026';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const normalizedRole = role?.toLowerCase().includes('sales') ? 'sales' : (role?.toLowerCase() || 'sales');
    const assignedDept = department || (normalizedRole === 'sales' ? 'Field Sales' : 'Shift Operations');
    const avatarInitials = cleanName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
    const time = reportingTime || scheduledReportingTime || '09:00 AM';
    const generatedMemberId = `m_${Date.now()}`;

    // 1. Check if user already exists or create new systemUser for app login
    const [existingUser] = await db.select().from(systemUsers).where(eq(systemUsers.email, cleanEmail));
    let userId;

    if (existingUser) {
      userId = existingUser.id;
      await db.update(systemUsers).set({
        name: cleanName,
        role: normalizedRole,
        password: rawPassword,
        passwordHash,
        phone: phone || existingUser.phone || '',
        department: assignedDept,
        avatar: avatarInitials,
        status: 'active',
        updatedAt: new Date(),
      }).where(eq(systemUsers.id, userId));
    } else {
      const [inserted] = await db.insert(systemUsers).values({
        name: cleanName,
        email: cleanEmail,
        password: rawPassword,
        passwordHash,
        role: normalizedRole,
        department: assignedDept,
        phone: phone || '',
        avatar: avatarInitials,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      userId = inserted?.id || Date.now();
    }

    // 2. Also record in staff_members table for attendance and roster
    try {
      await db.insert(staffMembers).values({
        memberId: generatedMemberId,
        name: cleanName,
        role: normalizedRole === 'sales' ? 'Field Sales' : (role || 'Field Sales'),
        phone: phone || '',
        reportingTime: time,
        status: 'on_time',
      });
    } catch (e) {
      console.warn('[staffController.createStaffMember] staff_members insert non-fatal warning:', e.message);
    }

    // 3. Format response for frontend
    const newStaffMember = {
      id: String(userId),
      userId: String(userId),
      memberId: generatedMemberId,
      name: cleanName,
      email: cleanEmail,
      role: normalizedRole === 'sales' ? 'Field Sales' : (role || 'Staff Member'),
      avatar: avatarInitials,
      phone: phone || '',
      reportingTime: time,
      checkIn: null,
      checkOut: null,
      status: 'present',
      date: new Date().toISOString().split('T')[0],
      department: assignedDept,
    };

    return res.status(201).json({
      success: true,
      message: 'Staff member and login credentials created successfully',
      staff: newStaffMember,
      user: { id: userId, email: cleanEmail, role: normalizedRole, name: cleanName },
    });
  } catch (error) {
    console.error('[staffController.createStaffMember]', error);
    return res.status(500).json({ message: 'Failed to create staff member', error: error.message });
  }
}

/**
 * PUT /api/staff/:id — Update team member details or status
 */
export async function updateStaffMember(req, res) {
  const { id } = req.params;
  const { name, role, phone, reportingTime, status } = req.body;

  try {
    const [existing] = await db.select().from(staffMembers).where(eq(staffMembers.memberId, id));
    if (!existing) {
      return res.status(404).json({ message: `Member ${id} not found` });
    }

    const [updated] = await db
      .update(staffMembers)
      .set({
        name: name !== undefined ? name.trim() : existing.name,
        role: role !== undefined ? role.trim() : existing.role,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        reportingTime: reportingTime !== undefined ? reportingTime : existing.reportingTime,
        status: status !== undefined ? status : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(staffMembers.memberId, id))
      .returning();

    return res.json(formatMember(updated));
  } catch (err) {
    console.error('[staffController.updateStaffMember]', err);
    return res.status(500).json({ message: 'Failed to update team member', error: err.message });
  }
}

/**
 * DELETE /api/staff/:id — Delete team member
 */
export async function deleteStaffMember(req, res) {
  const { id } = req.params;

  try {
    await db.delete(staffMembers).where(eq(staffMembers.memberId, id));
    return res.json({ success: true, message: `Member ${id} deleted` });
  } catch (err) {
    console.error('[staffController.deleteStaffMember]', err);
    return res.status(500).json({ message: 'Failed to delete member', error: err.message });
  }
}

const TEN_HOURS_MS = 10 * 60 * 60 * 1000;

/**
 * POST /api/staff/checkin or POST /api/staff/attendance
 * Staff / Sales rep marks daily attendance.
 * RULE: Once marked, attendance is LOCKED for 10 hours and cannot be modified/re-marked.
 */
export async function markAttendance(req, res) {
  try {
    const rawUserId = req.body.userId || req.user?.id || req.body.memberId;
    const rawName = req.body.name || req.user?.name || '';
    const rawRole = req.body.role || req.user?.role || 'Field Sales';
    const notes = req.body.notes || '';

    if (!rawName && !rawUserId) {
      return res.status(400).json({ message: 'User identification (userId or name) is required' });
    }

    const cleanName = rawName.trim();
    const cleanUserId = String(rawUserId || cleanName);
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Check existing staff member record
    let [member] = await db
      .select()
      .from(staffMembers)
      .where(or(eq(staffMembers.name, cleanName), eq(staffMembers.memberId, cleanUserId)));

    // 2. Check 10-hour lock rule
    const lastCheckIn = member?.lastCheckedInAt;
    if (lastCheckIn) {
      const elapsedMs = now.getTime() - new Date(lastCheckIn).getTime();
      if (elapsedMs < TEN_HOURS_MS) {
        const remainingMs = TEN_HOURS_MS - elapsedMs;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const nextAllowed = new Date(new Date(lastCheckIn).getTime() + TEN_HOURS_MS);

        return res.status(400).json({
          success: false,
          locked: true,
          canCheckIn: false,
          message: `Attendance is already marked! It is locked for 10 hours and cannot be re-marked (unlocks in ${remainingHours}h ${remainingMinutes}m).`,
          checkIn: member.checkIn || timeFormatted,
          status: member.status || 'present',
          lastCheckedInAt: member.lastCheckedInAt,
          nextAllowedCheckInAt: nextAllowed.toISOString(),
          remainingTime: `${remainingHours}h ${remainingMinutes}m`,
        });
      }
    }

    // 3. Determine On-Time vs Late based on reporting time
    const reportingTime = member?.reportingTime || req.body.reportingTime || '09:00 AM';
    let attendanceStatus = 'present';

    try {
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      let targetHour = 9;
      let targetMin = 15; // 15-minute grace period
      const match12 = reportingTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const p = match12[3].toUpperCase();
        if (p === 'PM' && h < 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        targetHour = h;
        targetMin = m + 15;
        if (targetMin >= 60) {
          targetHour += Math.floor(targetMin / 60);
          targetMin %= 60;
        }
      }
      if (currentHour > targetHour || (currentHour === targetHour && currentMin > targetMin)) {
        attendanceStatus = 'late';
      }
    } catch {
      // Keep 'present' default
    }

    // 4. Update or Insert in staff_members table
    if (member) {
      await db
        .update(staffMembers)
        .set({
          status: attendanceStatus,
          checkIn: timeFormatted,
          checkOut: null,
          lastCheckedInAt: now,
          updatedAt: now,
        })
        .where(eq(staffMembers.id, member.id));
    } else {
      const generatedMemberId = `m_${Date.now()}`;
      const [inserted] = await db
        .insert(staffMembers)
        .values({
          memberId: generatedMemberId,
          name: cleanName,
          role: rawRole,
          reportingTime,
          status: attendanceStatus,
          checkIn: timeFormatted,
          lastCheckedInAt: now,
        })
        .returning();
      member = inserted;
    }

    // 5. Log into attendance_logs table
    try {
      await db.insert(attendanceLogs).values({
        userId: cleanUserId,
        name: cleanName,
        role: rawRole,
        checkInTime: timeFormatted,
        status: attendanceStatus,
        date: todayDate,
        notes: notes ? notes.trim() : 'Checked in via mobile app',
      });
    } catch (e) {
      console.warn('[staffController.markAttendance] Log insert warning:', e.message);
    }

    const nextAllowedCheckIn = new Date(now.getTime() + TEN_HOURS_MS);

    return res.json({
      success: true,
      message: `✓ Attendance marked as ${attendanceStatus.toUpperCase()} at ${timeFormatted}. Locked for 10 hours.`,
      canCheckIn: false,
      locked: true,
      attendance: {
        userId: cleanUserId,
        name: cleanName,
        role: member?.role || rawRole,
        status: attendanceStatus,
        checkIn: timeFormatted,
        checkInTimestamp: now.toISOString(),
        date: todayDate,
        nextAllowedCheckInAt: nextAllowedCheckIn.toISOString(),
      },
    });
  } catch (err) {
    console.error('[staffController.markAttendance]', err);
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
}

/**
 * GET /api/staff/attendance/status
 * Check if user is currently checked in or locked under the 10-hour rule
 */
export async function getAttendanceStatus(req, res) {
  try {
    const rawUserId = req.query.userId || req.user?.id || req.query.memberId;
    const rawName = req.query.name || req.user?.name || '';

    if (!rawName && !rawUserId) {
      return res.status(400).json({ message: 'User identification (userId or name) is required' });
    }

    const cleanName = rawName.trim();
    const cleanUserId = String(rawUserId || cleanName);
    const now = new Date();

    const [member] = await db
      .select()
      .from(staffMembers)
      .where(or(eq(staffMembers.name, cleanName), eq(staffMembers.memberId, cleanUserId)));

    const lastCheckIn = member?.lastCheckedInAt;
    if (lastCheckIn) {
      const elapsedMs = now.getTime() - new Date(lastCheckIn).getTime();
      if (elapsedMs < TEN_HOURS_MS) {
        const remainingMs = TEN_HOURS_MS - elapsedMs;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const nextAllowed = new Date(new Date(lastCheckIn).getTime() + TEN_HOURS_MS);

        return res.json({
          isCheckedIn: true,
          canCheckIn: false,
          locked: true,
          status: member.status || 'present',
          checkIn: member.checkIn || '09:00 AM',
          lastCheckedInAt: lastCheckIn,
          nextAllowedCheckInAt: nextAllowed.toISOString(),
          remainingLockTime: `${remainingHours}h ${remainingMinutes}m`,
          message: `Attendance is locked for today. Next check-in allowed in ${remainingHours}h ${remainingMinutes}m.`,
        });
      }
    }

    return res.json({
      isCheckedIn: false,
      canCheckIn: true,
      locked: false,
      message: 'Ready to mark attendance for today.',
    });
  } catch (err) {
    console.error('[staffController.getAttendanceStatus]', err);
    return res.status(500).json({ message: 'Failed to fetch attendance status', error: err.message });
  }
}

/**
 * POST /api/staff/checkout
 * Mark check-out time for end of shift
 */
export async function checkoutAttendance(req, res) {
  try {
    const rawUserId = req.body.userId || req.user?.id || req.body.memberId;
    const rawName = req.body.name || req.user?.name || '';

    const cleanName = rawName.trim();
    const cleanUserId = String(rawUserId || cleanName);
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const [member] = await db
      .select()
      .from(staffMembers)
      .where(or(eq(staffMembers.name, cleanName), eq(staffMembers.memberId, cleanUserId)));

    if (member) {
      await db
        .update(staffMembers)
        .set({
          checkOut: timeFormatted,
          lastCheckedOutAt: now,
          updatedAt: now,
        })
        .where(eq(staffMembers.id, member.id));
    }

    return res.json({
      success: true,
      message: `Checked out successfully at ${timeFormatted}.`,
      checkOut: timeFormatted,
      lastCheckedOutAt: now.toISOString(),
    });
  } catch (err) {
    console.error('[staffController.checkoutAttendance]', err);
    return res.status(500).json({ message: 'Failed to checkout', error: err.message });
  }
}
