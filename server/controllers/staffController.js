import { db } from '../db/index.js';
import { staffMembers, tasks } from '../db/schema.js';
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
 * POST /api/staff — Create & Register new team member / helper
 */
export async function createStaffMember(req, res) {
  const { name, role, phone, reportingTime, scheduledReportingTime } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Member full name is required' });
  }

  const memberRole = role ? role.trim() : 'Warehouse Helper';
  const time = reportingTime || scheduledReportingTime || '09:00 AM';
  const generatedId = `m_${Date.now()}`;

  try {
    const [inserted] = await db
      .insert(staffMembers)
      .values({
        memberId: generatedId,
        name: name.trim(),
        role: memberRole,
        phone: phone ? phone.trim() : '',
        reportingTime: time,
        status: 'on_time',
      })
      .returning();

    return res.status(201).json(formatMember(inserted));
  } catch (err) {
    console.error('[staffController.createStaffMember]', err);
    return res.status(500).json({ message: 'Failed to create team member', error: err.message });
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
