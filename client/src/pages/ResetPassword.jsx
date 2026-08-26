import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { resetPassword as resetPasswordApi } from '../lib/api';
import greenfibreLogo from '../assets/greenfibre-logo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-ink">
        <div className="card max-w-md w-full p-8 text-center border border-border">
          <div className="w-12 h-12 rounded-full bg-red-soft text-red flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-ink-muted mb-6">
            This password reset link is missing a valid token or has expired.
          </p>
          <Link to="/forgot-password" className="btn-primary w-full inline-block">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(email, token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg text-ink">
      <div className="card max-w-md w-full p-8 shadow-xl border border-border animate-enter">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-white p-1 border border-border/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={greenfibreLogo}
              alt="Green Fibre Leaves Emblem"
              className="h-full w-full object-cover object-top scale-[1.5] -translate-y-[6%]"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-display text-lg font-bold tracking-tight text-ink flex items-center gap-1.5 leading-tight">
              <span className="text-primary font-extrabold">Green</span>
              <span className="text-ink font-semibold">Fibre</span>
            </div>
            <span className="text-[10px] text-ink-muted font-medium uppercase tracking-[0.2em]">Secure Password Reset</span>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="font-display text-xl font-bold">Password Reset Complete</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Your password has been successfully updated. You can now log into your Green Fibre dashboard.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-primary w-full"
              >
                Sign In Now
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-2xl font-bold mb-1.5">Set New Password</h2>
            <p className="text-sm text-ink-muted mb-6">
              Create a new secure password for <strong className="text-ink">{email || 'your account'}</strong>.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!emailParam && (
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@greenfibre.com"
                    className="w-full px-3.5 py-2.5 rounded-md border border-border bg-bg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">New Password (min 8 chars)</label>
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

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-md border border-border bg-bg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs sm:text-sm text-red bg-red-soft rounded-md px-3 py-2 border border-red/20">
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
                {loading ? 'Updating Password…' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
