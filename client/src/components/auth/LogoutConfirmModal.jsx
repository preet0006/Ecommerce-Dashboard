import React, { useEffect } from 'react';
import { LogOut, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LogoutConfirmModal() {
  const { isLogoutConfirmOpen, closeLogoutConfirm, logout, user } = useAuth();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLogoutConfirmOpen) {
        closeLogoutConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutConfirmOpen, closeLogoutConfirm]);

  if (!isLogoutConfirmOpen) return null;

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-enter">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeLogoutConfirm}
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-10 my-8 p-6 transition-colors space-y-5">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-2xl bg-red-soft border border-red/20 flex items-center justify-center text-red shrink-0 shadow-xs">
            <LogOut size={22} className="ml-0.5" />
          </div>

          <button
            type="button"
            onClick={closeLogoutConfirm}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-ink mb-1">
            Sign Out of Green Fibre?
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            You are currently signed in as{' '}
            <strong className="text-ink font-semibold">{user?.name || 'Rahul Joshi'}</strong> (
            <span className="text-ink-muted font-mono">{user?.email || 'rahul.joshi@greenfibre.com'}</span>).
            Ending this session will return you to the login screen.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-raised border border-border text-xs text-ink-muted flex items-center gap-2.5">
          <ShieldAlert size={16} className="text-amber-500 shrink-0" />
          <span>Any unsaved drafts or background edits will be preserved in your browser cache.</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={closeLogoutConfirm}
            className="btn-outline flex-1 py-2.5 text-xs sm:text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="btn flex-1 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red hover:bg-red/90 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Yes, Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
