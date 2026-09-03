import React, { useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Briefcase,
  Calendar,
  KeyRound,
  CheckCircle2,
  LogOut,
  Settings,
  ExternalLink,
  ShieldCheck,
  Building,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getUserInitials } from '../../context/AuthContext';
import greenfibreLeaves from '../../assets/greenfibre-leaves.png';

export default function UserInfoModal() {
  const { isUserInfoModalOpen, closeUserInfoModal, user, openLogoutConfirm, openLoginModal } = useAuth();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isUserInfoModalOpen) {
        closeUserInfoModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUserInfoModalOpen, closeUserInfoModal]);

  if (!isUserInfoModalOpen || !user) return null;

  const userInitials = getUserInitials(user);

  const roleColor =
    user.role === 'admin'
      ? { bg: 'var(--color-primary-soft)', text: 'var(--color-primary-strong)', border: 'var(--color-primary)' }
      : user.role === 'manager'
      ? { bg: 'var(--color-amber-soft)', text: 'var(--color-amber)', border: 'var(--color-amber)' }
      : { bg: 'var(--color-surface-raised)', text: 'var(--color-ink)', border: 'var(--color-border)' };

  const handleGoSettings = () => {
    closeUserInfoModal();
    navigate('/settings');
  };

  const handleSwitchAccount = () => {
    closeUserInfoModal();
    openLoginModal();
  };

  const handleInitiateLogout = () => {
    closeUserInfoModal();
    openLogoutConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-enter">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeUserInfoModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-10 my-8 transition-colors">
        {/* Header Background */}
        <div
          className="p-6 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #092c1e 0%, #1F6E4C 60%, #2f8e65 100%)',
          }}
        >
          {/* Watermark leaf */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 opacity-15 pointer-events-none">
            <img src={greenfibreLeaves} alt="" className="w-full h-full object-contain filter brightness-200" />
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              {/* Avatar circle with glow */}
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-white text-emerald-900 font-display font-bold text-xl flex items-center justify-center shadow-lg border-2 border-white/80 shrink-0">
                  {userInitials}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-emerald-900 flex items-center justify-center"
                  title="Online"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </div>

              <div>
                <h3 className="font-display text-xl font-bold leading-tight">{user.name}</h3>
                <p className="text-xs text-emerald-100/90 flex items-center gap-1.5 mt-0.5">
                  <Mail size={13} /> {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-emerald-100 border border-white/20 backdrop-blur-xs">
                    {user.role || 'Admin'}
                  </span>
                  <span className="text-[11px] text-emerald-100/80 font-medium">
                    {user.department || 'Procurement Hub'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeUserInfoModal}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* User Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
              <span className="text-ink-muted flex items-center gap-1.5 font-medium">
                <Shield size={13} className="text-primary" /> Role & Privilege
              </span>
              <span className="font-semibold text-ink capitalize text-sm">{user.role || 'Admin'} Access</span>
              <span className="text-[11px] text-ink-muted">
                {user.role === 'admin'
                  ? 'Full read/write & approval rights'
                  : user.role === 'manager'
                  ? 'Standard write & PO creation'
                  : 'View & report generation only'}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
              <span className="text-ink-muted flex items-center gap-1.5 font-medium">
                <Building size={13} className="text-primary" /> Department
              </span>
              <span className="font-semibold text-ink text-sm">{user.department || 'Supply Chain'}</span>
              <span className="text-[11px] text-ink-muted">Primary Hub: Bhiwandi Central</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
              <span className="text-ink-muted flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-primary" /> Account Status
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-ink text-sm capitalize">{user.status || 'Active'}</span>
              </div>
              <span className="text-[11px] text-ink-muted">Verified Enterprise ID</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-surface-raised flex flex-col gap-1">
              <span className="text-ink-muted flex items-center gap-1.5 font-medium">
                <Clock size={13} className="text-primary" /> Active Session
              </span>
              <span className="font-semibold text-ink text-sm">Authenticated</span>
              <span className="text-[11px] text-ink-muted">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · JWT Secure
              </span>
            </div>
          </div>

          {/* Module Access Badges */}
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-2">
              Accessible Workspace Modules
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Dashboard Analytics',
                'Products Master',
                'Vendor Directory & POs',
                'Inventory AI Engine',
                'Pricing Control',
                'Forecasting',
                'Multi-Channel Orders',
                'Ask AI Grounding',
              ].map((mod) => (
                <span
                  key={mod}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-bg text-ink flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {mod}
                </span>
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleGoSettings}
              className="btn-outline w-full sm:flex-1 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <Settings size={15} />
              <span>User Settings</span>
            </button>

            <button
              type="button"
              onClick={handleSwitchAccount}
              className="btn-outline w-full sm:flex-1 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <KeyRound size={15} />
              <span>Switch User</span>
            </button>

            <button
              type="button"
              onClick={handleInitiateLogout}
              className="btn w-full sm:w-auto py-2 px-4 text-xs sm:text-sm font-semibold text-red bg-red-soft hover:bg-red-soft/80 border border-red/20 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
