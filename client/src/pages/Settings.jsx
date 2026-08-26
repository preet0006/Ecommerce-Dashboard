import React, { useState, useEffect } from 'react';
import {
  Users, Type, Building2, ShieldCheck, Plus, Trash2, Edit3,
  CheckCircle2, X, AlertCircle, Sparkles, Sun, Moon,
  Lock, Eye, ShieldAlert, Check, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useFont } from '../context/FontContext';

const TABS = [
  { id: 'team', label: 'Team & Permissions', icon: Users },
  { id: 'appearance', label: 'Appearance & Fonts', icon: Type },
  { id: 'company', label: 'Company & Hubs', icon: Building2 },
  { id: 'matrix', label: 'Role Permissions Matrix', icon: ShieldCheck },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('team');
  const { isDark, toggleTheme }   = useTheme();
  const {
    selectedFontId, setFont,
    selectedScaleId, setFontScale,
    availableFonts, availableScales,
    activeFont,
  } = useFont();

  // Users state
  const [users, setUsers]           = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast]           = useState(null);
  const [formError, setFormError]   = useState(null);

  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'reader',
    department: 'Procurement',
    status: 'active',
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch users from PostgreSQL
  const loadUsers = () => {
    setLoadingUsers(true);
    api.getSystemUsers()
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => {
        console.warn('Failed to load users:', err.message);
      })
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      role: 'reader',
      department: 'Procurement',
      status: 'active',
    });
    setFormError(null);
    setUserModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || 'Procurement',
      status: u.status || 'active',
    });
    setFormError(null);
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingUser) {
        await api.updateSystemUser(editingUser.id, userForm);
        showToast(`User ${userForm.name} updated successfully.`);
      } else {
        await api.createSystemUser(userForm);
        showToast(`New team member ${userForm.name} added as ${userForm.role.toUpperCase()}.`);
      }
      setUserModalOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to save user.');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
      await api.deleteSystemUser(userId);
      showToast(`User ${name} removed.`);
      loadUsers();
    } catch (err) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge font-bold bg-primary-soft text-primary-strong border border-primary/30">
            <ShieldCheck size={12} className="inline mr-1" /> ADMIN
          </span>
        );
      case 'manager':
        return (
          <span className="badge font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Edit3 size={12} className="inline mr-1" /> MANAGER
          </span>
        );
      default:
        return (
          <span className="badge font-medium bg-surface-raised text-ink-muted border border-border">
            <Eye size={12} className="inline mr-1" /> READER (View Only)
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-bg transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-xl bg-surface border border-primary/30 shadow-2xl text-primary font-medium text-xs flex items-center gap-2 animate-enter">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">
            System Settings & Administration
          </h1>
          <p className="text-xs text-ink-muted">
            Manage team roles (Admin vs. Reader), real-time typography, company details, and system parameters.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap text-xs sm:text-sm ${
                active ? 'sidebar-link-active !rounded-b-none font-bold' : 'sidebar-link !rounded-b-none'
              }`}
              style={active ? { borderBottom: '2px solid var(--color-primary)' } : { borderBottom: '2px solid transparent' }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: TEAM & RBAC PERMISSIONS ── */}
      {activeTab === 'team' && (
        <div className="flex flex-col gap-5 animate-enter">
          {/* Info Banner */}
          <div className="p-4 rounded-xl border border-primary/30 bg-primary-soft/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={16} />
              </div>
              <div className="text-xs">
                <h3 className="font-display font-bold text-sm text-ink mb-0.5">
                  Role-Based Access Control (RBAC)
                </h3>
                <p className="text-ink-muted">
                  Assign <strong>Admin</strong> (full management & approval authority) or <strong>Reader</strong> (read-only viewer privileges with modification restrictions).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn-primary !text-xs shrink-0 whitespace-nowrap"
            >
              <Plus size={14} /> Add Team Member
            </button>
          </div>

          {/* Users Table */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-base text-ink">
                  Registered Team Members ({users.length})
                </h3>
                <p className="text-xs text-ink-muted">
                  Managed in PostgreSQL <code className="font-mono text-primary text-[11px]">system_users</code> table.
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="btn-outline !py-1.5 !px-2.5 text-xs text-ink-muted hover:text-ink"
                title="Refresh from database"
              >
                <RefreshCw size={13} className={loadingUsers ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="table-responsive-container">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email Address</th>
                    <th>Role & Permission</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary-soft text-primary-strong flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                            {u.avatar || u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-ink text-xs">{u.name}</div>
                            <span className="text-[10px] text-ink-muted">ID #{u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-ink">{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td className="text-xs text-ink-muted">{u.department || 'Procurement'}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-primary hover:bg-surface-raised transition-colors"
                            title="Edit Role / Details"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-red hover:bg-surface-raised transition-colors"
                            title="Remove User"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !loadingUsers && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-ink-muted text-xs">
                        No team members found in database. Click "Add Team Member" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: APPEARANCE & REAL-TIME FONTS ── */}
      {activeTab === 'appearance' && (
        <div className="flex flex-col gap-6 animate-enter">
          {/* Real-Time Font Family Selector */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <Type size={18} className="text-primary" /> Real-Time Website Typography
                </h3>
                <p className="text-xs text-ink-muted">
                  Select a font family to immediately transform the entire dashboard's typography in real time.
                </p>
              </div>

              <span className="text-xs font-bold text-primary px-3 py-1 rounded-lg bg-primary-soft border border-primary/20">
                Active: {activeFont.name}
              </span>
            </div>

            {/* Font Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {availableFonts.map((f) => {
                const isSelected = selectedFontId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setFont(f.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary-soft/30 shadow-md ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-raised/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          className="font-bold text-base text-ink"
                          style={{ fontFamily: f.fontFamily }}
                        >
                          {f.name}
                        </div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase">
                          {f.category}
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="h-5 w-5 rounded-full border border-border" />
                      )}
                    </div>

                    <div
                      className="p-2.5 rounded-lg bg-surface border border-border/70 text-xs text-ink leading-relaxed"
                      style={{ fontFamily: f.fontFamily }}
                    >
                      "{f.previewText}"
                    </div>

                    <div className="text-[11px] text-ink-muted">
                      {f.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Font Scaling & Theme Density */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Font Size Scaling */}
            <div className="card p-5">
              <h3 className="font-display font-semibold text-sm text-ink mb-1">
                Display Scale & Density
              </h3>
              <p className="text-xs text-ink-muted mb-4">
                Adjust overall UI density and font proportions.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {availableScales.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontScale(s.id)}
                    className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold ${
                      selectedScaleId === s.id
                        ? 'border-primary bg-primary-soft text-primary-strong shadow-2xs'
                        : 'border-border bg-surface text-ink hover:bg-surface-raised'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark & Light Theme Switcher */}
            <div className="card p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm text-ink mb-1">
                  Color Mode Theme
                </h3>
                <p className="text-xs text-ink-muted mb-4">
                  Toggle between Crisp Light and Obsidian Dark modes.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="btn-outline !py-2.5 !justify-between w-full text-xs font-semibold"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                  <span>Current: {isDark ? 'Obsidian Dark Mode' : 'Clean Light Mode'}</span>
                </span>
                <span className="text-[11px] font-mono text-primary font-bold uppercase">
                  Click to Switch
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: COMPANY & HUBS ── */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-enter">
          <div className="card p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Building2 size={18} className="text-primary" /> Company Profile
            </h3>

            <div>
              <label className="label">Company Legal Name</label>
              <input className="input font-semibold" defaultValue="Green Fibre Homeware & Logistics LLP" readOnly />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">GSTIN Identification</label>
                <input className="input font-mono" defaultValue="24AABCG1234F1Z8" readOnly />
              </div>
              <div>
                <label className="label">Base Currency</label>
                <input className="input font-mono font-bold text-primary" defaultValue="₹ INR (Indian Rupee)" readOnly />
              </div>
            </div>

            <div>
              <label className="label">Registered Office</label>
              <textarea className="textarea" rows={2} defaultValue="Plot 42, GIDC Industrial Estate, Umbergaon, Gujarat — 396171" readOnly />
            </div>
          </div>

          <div className="card p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> Fulfillment & Logistics Hubs
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-surface-raised flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink">Bhiwandi Central Hub (Hub A)</div>
                  <span className="text-[11px] text-ink-muted">West Zone Primary Distribution Warehouse</span>
                </div>
                <span className="badge-ok">Active Hub</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-surface-raised flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink">Delhi NCR Fulfillment (Hub B)</div>
                  <span className="text-[11px] text-ink-muted">North Zone Quick Ship Dock</span>
                </div>
                <span className="badge-ok">Active Hub</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-surface-raised flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink">Bangalore Logistics (Hub C)</div>
                  <span className="text-[11px] text-ink-muted">South Zone Regional Hub</span>
                </div>
                <span className="badge-ok">Active Hub</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ROLES & SECURITY MATRIX ── */}
      {activeTab === 'matrix' && (
        <div className="card p-5 animate-enter">
          <div className="mb-4">
            <h3 className="font-display font-bold text-base text-ink">
              System Permissions & Role Privilege Matrix
            </h3>
            <p className="text-xs text-ink-muted">
              Defined security constraints separating Administrative power from Read-Only viewer privileges.
            </p>
          </div>

          <div className="table-responsive-container">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>ERP Module / Feature</th>
                  <th className="text-center">Admin (Full Access)</th>
                  <th className="text-center">Manager (Ops)</th>
                  <th className="text-center">Reader (View Only)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-ink">Dashboard KPIs & Charts</td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Full View</span></td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Full View</span></td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Full View</span></td>
                </tr>
                <tr>
                  <td className="font-semibold text-ink">Create Purchase Orders</td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Create & Send</span></td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Create & Send</span></td>
                  <td className="text-center"><span className="text-red-500 font-bold">✕ Read-Only</span></td>
                </tr>
                <tr>
                  <td className="font-semibold text-ink">PO Approval Queue</td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Approve / Reject</span></td>
                  <td className="text-center"><span className="text-amber-600 font-bold">⚠ Review Only</span></td>
                  <td className="text-center"><span className="text-red-500 font-bold">✕ Hidden / Blocked</span></td>
                </tr>
                <tr>
                  <td className="font-semibold text-ink">Vendor Master & Rates</td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Full CRUD</span></td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Add / Edit</span></td>
                  <td className="text-center"><span className="text-ink-muted font-bold">✓ View List</span></td>
                </tr>
                <tr>
                  <td className="font-semibold text-ink">Product / SKU Master</td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Full CRUD</span></td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Add / Edit</span></td>
                  <td className="text-center"><span className="text-ink-muted font-bold">✓ View Catalog</span></td>
                </tr>
                <tr>
                  <td className="font-semibold text-ink">Settings & User Roles</td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Full Control</span></td>
                  <td className="text-center"><span className="text-red-500 font-bold">✕ No Access</span></td>
                  <td className="text-center"><span className="text-red-500 font-bold">✕ No Access</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT USER MODAL ── */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-enter">
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-raised/50">
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {editingUser ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 flex flex-col gap-3.5">
              {formError && (
                <div className="p-2.5 rounded-lg border border-red-300 bg-red-500/10 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Ramesh Sharma"
                  value={userForm.name}
                  onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. ramesh@greenfibre.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">System Role *</label>
                <select
                  className="select font-semibold"
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="admin">ADMIN — Full Management & Approval Access</option>
                  <option value="manager">MANAGER — Procurement & Operations</option>
                  <option value="reader">READER — Read-Only Viewer (Cannot Edit)</option>
                </select>
                <p className="text-[11px] text-ink-muted mt-1">
                  {userForm.role === 'reader' && '🛡️ Reader role can view products, POs, and reports but is strictly restricted from editing or creating.'}
                  {userForm.role === 'admin' && '⚡ Admin role has full authority over purchase orders, approvals, and team management.'}
                  {userForm.role === 'manager' && '📦 Manager role can create purchase orders and manage catalog items.'}
                </p>
              </div>

              <div>
                <label className="label">Department</label>
                <input
                  className="input"
                  placeholder="e.g. Procurement / Inventory"
                  value={userForm.department}
                  onChange={(e) => setUserForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="btn-ghost !text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !text-xs">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
