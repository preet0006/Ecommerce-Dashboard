import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { login as loginApi } from '../lib/api';
import greenfibreLogo from '../assets/greenfibre-logo.png';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const token = res.token;
      const user = res.user;

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('gf_auth_token', token);
      storage.setItem('gf_auth_user', JSON.stringify(user));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch bg-bg text-ink">
      {/* Left — branded illustrated panel with watermark */}
      <div
        className="hidden lg:flex w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #092c1e 0%, #1F6E4C 55%, #3a9b6f 100%)' }}
      >
        {/* Large watermark logo in background */}
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-[520px] h-[520px] pointer-events-none select-none flex items-center justify-center opacity-[0.08] filter brightness-200">
          <img src={greenfibreLogo} alt="" className="w-full h-full object-contain" />
        </div>

        {/* Top-Right Shaded Watermark Badge (Circled area) */}
        <div className="absolute right-8 top-10 w-44 h-44 rounded-full bg-white/[0.08] border border-white/15 p-7 flex items-center justify-center pointer-events-none select-none shadow-2xl backdrop-blur-xs">
          <img src={greenfibreLogo} alt="" className="w-full h-full object-contain opacity-40 filter drop-shadow" />
        </div>

        {/* Bottom subtle radial glow */}
        <div
          className="absolute -left-10 -bottom-10 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
        />
        <svg className="absolute bottom-0 left-0 w-full opacity-30 pointer-events-none" viewBox="0 0 500 200" fill="none">
          <path d="M0 150 Q 60 100 120 150 T 240 150 T 360 150 T 500 120" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 10" />
        </svg>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center">
              <img src={greenfibreLogo} alt="Green Fibre Logo" className="h-full w-full object-contain" />
            </div>
            <span className="font-display text-xl font-bold tracking-wide !text-white drop-shadow-sm">GREEN FIBRE</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4 !text-white drop-shadow-sm">
            Welcome back to<br />your dashboard
          </h1>
          <p className="text-white/90 max-w-sm leading-relaxed text-sm font-normal">
            Manage vendors, inventory, pricing, and orders across every channel — Amazon, Flipkart, and your own store — from one place.
          </p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 py-12 bg-surface">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-white p-1 border border-border/80 shadow-xs flex items-center justify-center">
              <img src={greenfibreLogo} alt="Green Fibre Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-wide text-ink block leading-tight">GREEN FIBRE</span>
              <span className="text-[10px] text-ink-muted font-medium uppercase tracking-wider">Team Portal</span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-ink mb-1">Team Login</h2>
          <p className="text-ink-muted text-sm mb-8">Sign in with the account your admin created for you.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@greenfibre.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-border bg-bg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-md border border-border bg-bg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-ink-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary font-medium hover:underline text-xs sm:text-sm">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-xs sm:text-sm text-red bg-red-soft rounded-md px-3 py-2 border border-red/20 animate-enter">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99] shadow-sm hover:brightness-105"
              style={{ background: 'linear-gradient(135deg, #092c1e 0%, #1F6E4C 100%)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Log In'}
            </button>
          </form>

          <p className="text-xs text-ink-muted mt-8 leading-relaxed">
            Don't have an account? Ask your admin to create one for you in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
