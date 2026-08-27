import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset } from '../lib/api';
import greenfibreLogo from '../assets/greenfibre-logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
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
            <span className="text-[10px] text-ink-muted font-medium uppercase tracking-[0.2em]">Account Recovery</span>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="font-display text-xl font-bold">Check your inbox</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              If an account exists for <strong className="text-ink">{email}</strong>, we have sent instructions to reset your password. The link is valid for 1 hour.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 text-sm w-full justify-center"
              >
                <ArrowLeft size={16} /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-2xl font-bold mb-1.5">Forgot Password</h2>
            <p className="text-sm text-ink-muted mb-6">
              Enter your registered team email address and we'll send you a link to reset your password.
            </p>

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
                {loading ? 'Sending Link…' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
