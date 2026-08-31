import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import greenfibreLeaves from '../../assets/greenfibre-leaves.png';

const QUICK_PROFILES = [
  {
    name: 'Shivansh',
    email: 'shivanshd703@gmail.com',
    role: 'Admin',
    department: 'Tech',
    avatar: 'SH',
  },
  {
    name: 'Rohit Malhotra',
    email: 'admin@greenfibre.com',
    role: 'Admin',
    department: 'Executive Management',
    avatar: 'RO',
  },
  {
    name: 'Pooja Patel',
    email: 'pooja.patel@greenfibre.com',
    role: 'Reader',
    department: 'Inventory Auditing',
    avatar: 'PP',
  },
];

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isLoginModalOpen) {
      setError('');
      setPassword('password123');
      if (!email) setEmail('rahul.joshi@greenfibre.com');
    }
  }, [isLoginModalOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, closeLoginModal]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, remember);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (profile) => {
    setEmail(profile.email);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-enter">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeLoginModal}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-10 my-8 transition-colors">
        {/* Header Ribbon / Banner */}
        <div
          className="p-6 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #092c1e 0%, #1F6E4C 60%, #2f8e65 100%)',
          }}
        >
          {/* Subtle logo watermark */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 opacity-15 pointer-events-none">
            <img src={greenfibreLeaves} alt="" className="w-full h-full object-contain filter brightness-200" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white p-2 shadow-md flex items-center justify-center shrink-0">
                <img src={greenfibreLeaves} alt="Green Fibre" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-display text-lg font-bold">
                  <span className="text-emerald-300">Green</span>
                  <span>Fibre</span>
                  <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-emerald-100 font-semibold ml-1">
                    Sign In
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">Access your enterprise dashboard</p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeLoginModal}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Quick Demo Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={13} className="text-primary" /> Quick Demo Accounts
              </span>
              <span className="text-[11px] text-ink-muted">Click to auto-fill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_PROFILES.map((p) => {
                const isSelected = email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleQuickSelect(p)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-soft/50 ring-1 ring-primary'
                        : 'border-border bg-surface-raised hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {p.avatar}
                      </span>
                      <span className="font-semibold text-xs text-ink truncate">{p.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] text-ink-muted mt-1 font-medium">{p.role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[11px] text-ink-muted font-medium uppercase">Or custom login</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@greenfibre.com"
                  className="input pl-9 text-xs sm:text-sm py-2"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-ink-muted">Password</label>
                <span className="text-[11px] text-ink-muted">Default: password123</span>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9 pr-9 text-xs sm:text-sm py-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-ink-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                Remember this session
              </label>
              <span className="text-ink-muted text-[11px]">Enterprise SSO Enabled</span>
            </div>

            {error && (
              <div className="text-xs text-red bg-red-soft rounded-lg p-2.5 border border-red/20 flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeLoginModal}
                className="btn-outline flex-1 py-2 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-2 text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loading ? 'Authenticating…' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
