import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { staffMembers, systemUsers } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const INITIAL_STAFF_SEED = [
  { memberId: 'm_101', name: 'Ramesh Kumar', role: 'Field Sales', phone: '+91 98123 45678', reportingTime: '09:00 AM', status: 'on_time' },
  { memberId: 'm_102', name: 'Sunil Sharma', role: 'Warehouse Helper', phone: '+91 98234 56789', reportingTime: '09:00 AM', status: 'on_time' },
  { memberId: 'm_103', name: 'Vikas Verma', role: 'Logistics / Driver', phone: '+91 98345 67890', reportingTime: '09:30 AM', status: 'late' },
  { memberId: 'm_104', name: 'Anil Yadav', role: 'Field Sales', phone: '+91 98456 78901', reportingTime: '09:00 AM', status: 'on_time' },
  { memberId: 'm_105', name: 'Deepak Gupta', role: 'Warehouse Helper', phone: '+91 98567 89012', reportingTime: '09:00 AM', status: 'on_time' },
  { memberId: 'm_106', name: 'Manoj Singh', role: 'Logistics / Driver', phone: '+91 98678 90123', reportingTime: '09:00 AM', status: 'absent' },
];

function formatMember(m) {
  return {
    id: m.memberId || `m_${m.id}`,
    memberId: m.memberId || `m_${m.id}`,
    name: m.name,
    role: m.role,
    phone: m.phone || '',
    reportingTime: m.reportingTime || '09:00 AM',
    scheduledReportingTime: m.reportingTime || '09:00 AM',
    status: m.status || 'on_time',
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/**
 * GET /api/staff — Fetch all staff/team members
 */
export async function getStaffMembers(_req, res) {
  try {
    let rows = await db.select().from(staffMembers).orderBy(desc(staffMembers.createdAt));

    // Auto-seed initial team members if table is empty
    if (rows.length === 0) {
      console.log('[staffController] Seeding initial staff members...');
      await db.insert(staffMembers).values(INITIAL_STAFF_SEED).onConflictDoNothing();
      rows = await db.select().from(staffMembers).orderBy(desc(staffMembers.createdAt));
    }

    const members = rows.map(formatMember);
    const onTime = members.filter((m) => m.status === 'on_time').length;
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
