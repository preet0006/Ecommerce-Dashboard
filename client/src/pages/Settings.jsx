import React, { useState, useEffect } from 'react';
import {
  Users, Type, Building2, ShieldCheck, Plus, Trash2, Edit3,
  CheckCircle2, X, AlertCircle, Sparkles, Sun, Moon,
  Lock, Eye, EyeOff, ShieldAlert, Check, RefreshCw, KeyRound, LogIn, Copy
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
  const [users, setUsers]                 = useState([]);
  const [loadingUsers, setLoadingUsers]   = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser]     = useState(null);
  const [toast, setToast]                 = useState(null);
  const [formError, setFormError]         = useState(null);
  const [showPassword, setShowPassword]   = useState(false);

  // Test Login Simulator state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm]           = useState({ email: '', password: '' });
  const [loginResult, setLoginResult]       = useState(null);
  const [loginLoading, setLoginLoading]     = useState(false);

  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
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

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pwd = 'GF@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm((f) => ({ ...f, password: pwd }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setShowPassword(false);
    setUserForm({
      name: '',
      email: '',
      password: 'User@1234',
      role: 'reader',
      department: 'Procurement',
      status: 'active',
    });
    setFormError(null);
    setUserModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setShowPassword(false);
    setUserForm({
      name: u.name,
      email: u.email,
      password: u.password || 'GreenFibre@2026',
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

    if (!userForm.name?.trim()) {
      setFormError('Please provide user name.');
      return;
    }
    if (!userForm.email?.trim() || !userForm.email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }
    if (!userForm.password?.trim()) {
      setFormError('Please provide a login password.');
      return;
    }

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

  const handleTestLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginResult(null);

    try {
      const res = await api.loginUser(loginForm);
      setLoginResult({ success: true, user: res.user, message: res.message });
      showToast(`Logged in successfully as ${res.user.name} (${res.user.role.toUpperCase()})`);
    } catch (err) {
      setLoginResult({ success: false, message: err.message || 'Invalid credentials' });
    } finally {
      setLoginLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
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
            Manage user accounts (Name, Email & Login Password), RBAC roles (Admin vs. Reader), typography, and security.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoginForm({ email: 'admin@greenfibre.com', password: 'Admin@1234' });
            setLoginResult(null);
            setLoginModalOpen(true);
          }}
          className="btn-outline !text-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <LogIn size={14} className="text-primary" />
          <span>Test User Login</span>
        </button>
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
          <div className="p-4 rounded-xl border border-primary/30 bg-primary-soft/30 flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={16} />
              </div>
              <div className="text-xs">
                <h3 className="font-display font-bold text-sm text-ink mb-0.5">
                  User Authentication & Access Management (RBAC)
                </h3>
                <p className="text-ink-muted">
                  Create team members with their <strong>Full Name</strong>, <strong>Email</strong>, and <strong>Password</strong>. Assign <strong>Admin</strong> (full management & approval authority) or <strong>Reader</strong> (read-only view permissions).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="btn-primary !text-xs shrink-0 whitespace-nowrap"
              >
                <Plus size={14} /> Add Team Member
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-base text-ink">
                  Registered Users & Credentials ({users.length})
                </h3>
                <p className="text-xs text-ink-muted">
                  Stored securely in PostgreSQL <code className="font-mono text-primary text-[11px]">system_users</code> with login authentication.
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="btn-outline !py-1.5 !px-2.5 text-xs text-ink-muted hover:text-ink cursor-pointer"
                title="Refresh from database"
              >
                <RefreshCw size={13} className={loadingUsers ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="table-responsive-container">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>User / Name</th>
                    <th>Login Email</th>
                    <th>Login Password</th>
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
                      <td className="font-mono text-xs text-ink">
                        <div className="flex items-center gap-1.5">
                          <span>{u.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.email, 'Email')}
                            className="text-ink-muted hover:text-primary transition-colors"
                            title="Copy email"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-xs px-2 py-0.5 rounded bg-surface-raised border border-border text-ink">
                            {u.password || '••••••••'}
                          </code>
                          {u.password && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.password, 'Password')}
                              className="text-ink-muted hover:text-primary transition-colors"
                              title="Copy password"
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </td>
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
                            className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-primary hover:bg-surface-raised transition-colors cursor-pointer"
                            title="Edit User / Password / Role"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-red hover:bg-surface-raised transition-colors cursor-pointer"
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
                      <td colSpan={7} className="text-center py-8 text-ink-muted text-xs">
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
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-ink" style={{ fontFamily: f.body }}>
                          {f.name}
                        </span>
                        {isSelected && (
                          <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted block mb-2">{f.category}</span>
                      <p className="text-xs text-ink-muted" style={{ fontFamily: f.body }}>
                        "Quick procurement orders & reliable textile supply chain analytics."
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-ink-muted font-mono">
                      <span>123,456.00</span>
                      <span>₹495/unit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Font Scaling */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Dashboard Scale & Information Density
                </h3>
                <p className="text-xs text-ink-muted">
                  Fine-tune layout spacing and UI text scaling for your display.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableScales.map((s) => {
                const isSelected = selectedScaleId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontScale(s.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-soft/40 ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:border-primary/30'
                    }`}
                  >
                    <div className="font-bold text-xs text-ink mb-0.5">{s.name}</div>
                    <div className="text-[11px] text-ink-muted">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: COMPANY PROFILE & HUBS ── */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-enter">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base text-ink mb-4 pb-2 border-b border-border flex items-center gap-2">
              <Building2 size={16} className="text-primary" /> Enterprise Profile
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="label">Company Legal Name</label>
                <input className="input" defaultValue="Green Fibre Textiles Ltd." readOnly />
              </div>
              <div>
                <label className="label">Registered GSTIN</label>
                <input className="input font-mono" defaultValue="27AAACG0123M1Z9" readOnly />
              </div>
              <div>
                <label className="label">Headquarters / Main Office</label>
                <input className="input" defaultValue="GreenFibre Tower, Phase II, Bandra-Kurla Complex, Mumbai" readOnly />
              </div>
              <div>
                <label className="label">Finance & Procurement Email</label>
                <input className="input" defaultValue="procurement@greenfibre.com" readOnly />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold text-base text-ink mb-4 pb-2 border-b border-border">
              Fulfillment Warehouses & Hubs
            </h3>

            <div className="flex flex-col gap-3">
              {[
                { name: 'Bhiwandi Central Hub (WH-01)', loc: 'Bhiwandi, Maharashtra', cap: '85,000 units', status: 'Operational' },
                { name: 'Surat Textile Distribution Center (WH-02)', loc: 'Surat, Gujarat', cap: '50,000 units', status: 'Operational' },
                { name: 'Bangalore South Fulfillment (WH-03)', loc: 'Peenya, Bangalore', cap: '35,000 units', status: 'Operational' },
              ].map((h, i) => (
                <div key={i} className="p-3 rounded-xl border border-border bg-surface-raised flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-ink">{h.name}</div>
                    <div className="text-[11px] text-ink-muted">{h.loc} · Capacity: {h.cap}</div>
                  </div>
                  <span className="badge-ok text-[11px]">{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ROLE PERMISSIONS MATRIX ── */}
      {activeTab === 'matrix' && (
        <div className="card p-5 animate-enter">
          <div className="mb-4 pb-3 border-b border-border">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" /> Role-Based Access Permissions Matrix
            </h3>
            <p className="text-xs text-ink-muted">
              Comparison of capabilities across system roles.
            </p>
          </div>

          <div className="table-responsive-container">
            <table className="table-clean text-xs">
              <thead>
                <tr>
                  <th>Feature / Module</th>
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
                  <td className="font-semibold text-ink">Settings & User Management</td>
                  <td className="text-center"><span className="text-emerald-600 font-bold">✓ Full Control</span></td>
                  <td className="text-center"><span className="text-red-500 font-bold">✕ No Access</span></td>
                  <td className="text-center"><span className="text-red-500 font-bold">✕ No Access</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT USER MODAL (WITH NAME, EMAIL & PASSWORD) ── */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-enter">
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-raised/50">
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Users size={18} className="text-primary" />
                {editingUser ? 'Edit User Credentials & Access' : 'Create User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
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

              {/* 1. Full Name */}
              <div>
                <label className="label">
                  Full Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Ramesh Sharma"
                  value={userForm.name}
                  onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              {/* 2. Login Email */}
              <div>
                <label className="label">
                  Login Email Address <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. ramesh@greenfibre.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              {/* 3. Login Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label !mb-0">
                    Login Password <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} /> Generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10 font-mono"
                    placeholder="e.g. Secret@1234"
                    value={userForm.password}
                    onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  User will use this email & password to sign in.
                </p>
              </div>

              {/* 4. Role Selection */}
              <div>
                <label className="label">System Role & Permission *</label>
                <select
                  className="select font-semibold"
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="admin">ADMIN — Full Management & Approval Authority</option>
                  <option value="manager">MANAGER — Procurement & Operations</option>
                  <option value="reader">READER — Read-Only Viewer (Cannot Edit)</option>
                </select>
                <p className="text-[11px] text-ink-muted mt-1">
                  {userForm.role === 'reader' && '🛡️ Reader role can view products, POs, and reports but is strictly restricted from editing or creating.'}
                  {userForm.role === 'admin' && '⚡ Admin role has full authority over purchase orders, approvals, and team management.'}
                  {userForm.role === 'manager' && '📦 Manager role can create purchase orders and manage catalog items.'}
                </p>
              </div>

              {/* 5. Department */}
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
                  className="btn-ghost !text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !text-xs cursor-pointer">
                  {editingUser ? 'Save User Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TEST USER LOGIN SIMULATOR MODAL ── */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-enter">
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-raised/50">
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <LogIn size={18} className="text-primary" /> Test User Login
              </h3>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTestLoginSubmit} className="p-5 flex flex-col gap-3.5">
              <p className="text-xs text-ink-muted">
                Test signing in with registered credentials to verify password authentication and role access.
              </p>

              {loginResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-1 ${
                    loginResult.success
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : 'border-red-300 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {loginResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    <span>{loginResult.message}</span>
                  </div>
                  {loginResult.success && loginResult.user && (
                    <div className="text-[11px] opacity-90 mt-1">
                      Role: <strong className="uppercase">{loginResult.user.role}</strong> · Department: {loginResult.user.department}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input text-xs"
                  placeholder="admin@greenfibre.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input text-xs font-mono"
                  placeholder="Enter user password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-ink-muted">Quick Autofill:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginForm({ email: 'admin@greenfibre.com', password: 'Admin@1234' })}
                    className="btn-outline !text-[11px] !py-1 !px-2 flex-1"
                  >
                    Admin User
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ email: 'pooja.patel@greenfibre.com', password: 'Reader@1234' })}
                    className="btn-outline !text-[11px] !py-1 !px-2 flex-1"
                  >
                    Reader User
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="btn-ghost !text-xs cursor-pointer"
                >
                  Close
                </button>
                <button type="submit" className="btn-primary !text-xs cursor-pointer" disabled={loginLoading}>
                  {loginLoading ? 'Authenticating…' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
