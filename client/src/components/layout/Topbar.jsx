import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  User,
  LogOut,
  Settings,
  Shield,
  KeyRound,
  ChevronDown,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  LogIn,
  PackageCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth, getUserInitials } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    user,
    isAuthenticated,
    openUserInfoModal,
    openLoginModal,
    openLogoutConfirm,
  } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [pendingDeliveryCount, setPendingDeliveryCount] = useState(0);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    api.getPendingDeliveries()
      .then((data) => {
        if (Array.isArray(data)) setPendingDeliveryCount(data.length);
      })
      .catch(() => {});
  }, []);

  const handleOpenDeliveryCheck = () => {
    window.dispatchEvent(new CustomEvent('open-delivery-modal'));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenProfile = () => {
    setDropdownOpen(false);
    openUserInfoModal();
  };

  const handleOpenSettings = () => {
    setDropdownOpen(false);
    navigate('/settings');
  };

  const handleSwitchAccount = () => {
    setDropdownOpen(false);
    openLoginModal();
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    openLogoutConfirm();
  };

  const userInitials = getUserInitials(user);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-surface/95 backdrop-blur-sm px-4 sm:px-6 py-3 sticky top-0 z-20 shadow-2xs transition-colors">
      {/* Left: Mobile Menu Trigger + Title */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors lg:hidden cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu size={18} />
          </button>
        )}

        <div>
          <h1 className="font-display text-base sm:text-lg font-semibold text-ink leading-tight">
            Dashboard
          </h1>
          <p className="text-[11px] sm:text-xs text-ink-muted hidden sm:block">
            {today} · All channels
          </p>
        </div>
      </div>

      {/* Right: Search, Dark Mode Toggle, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pending Delivery Arrival Check Button (if any exist) */}
        {pendingDeliveryCount > 0 && (
          <button
            type="button"
            onClick={handleOpenDeliveryCheck}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer animate-enter"
            title="Click to verify purchase orders due for delivery"
          >
            <PackageCheck size={13} className="text-amber-600 dark:text-amber-400" />
            <span>{pendingDeliveryCount} Delivery Due</span>
          </button>
        )}

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-8.5 w-48 lg:w-64 text-xs h-8.5" placeholder="Search SKU, vendor, order…" />
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun size={16} className="text-amber-400 animate-enter" />
          ) : (
            <Moon size={16} className="text-emerald-800 animate-enter" />
          )}
        </button>

        {/* Notifications / Bell Button */}
        <button
          type="button"
          onClick={handleOpenDeliveryCheck}
          className="btn-ghost !p-2 text-ink-muted hover:text-ink relative cursor-pointer"
          aria-label="Notifications"
          title={pendingDeliveryCount > 0 ? `${pendingDeliveryCount} delivery verifications pending` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {pendingDeliveryCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        {/* Profile Avatar & Interactive Dropdown */}
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="group flex items-center gap-2 p-0.5 rounded-full border border-border hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer bg-surface-raised"
              aria-expanded={dropdownOpen}
              aria-label="User Account Menu"
            >
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold tracking-tight shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  {userInitials}
                </div>
                {/* Active Session Indicator Dot */}
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface"
                  title="Online"
                />
              </div>

              {/* User Name Preview on Larger Screens */}
              <div className="hidden xl:flex flex-col text-left pr-2">
                <span className="text-xs font-semibold text-ink leading-tight truncate max-w-[110px]">
                  {user.name || 'User'}
                </span>
                <span className="text-[10px] text-ink-muted capitalize leading-none">
                  {user.role || 'Admin'}
                </span>
              </div>

              <ChevronDown
                size={14}
                className={`text-ink-muted transition-transform duration-200 mr-1 hidden sm:block ${
                  dropdownOpen ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Box */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-surface border border-border shadow-2xl z-50 overflow-hidden animate-enter transition-colors"
                style={{ transformOrigin: 'top right' }}
              >
                {/* User Info Header Card */}
                <div
                  className="p-4 border-b border-border/80"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-surface-raised) 0%, var(--color-surface) 100%)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary text-white font-display font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-ink truncate">{user.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-primary-strong border border-primary/20 shrink-0">
                          {user.role || 'Admin'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted truncate mt-0.5">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{user.department || 'Procurement & Logistics'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions List */}
                <div className="p-1.5 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink rounded-lg hover:bg-surface-raised hover:text-primary transition-colors text-left"
                  >
                    <User size={15} className="text-ink-muted" />
                    <div className="flex-1">
                      <div className="font-medium">User Information & Profile</div>
                      <div className="text-[10px] text-ink-muted">View roles, IDs, & system permissions</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink rounded-lg hover:bg-surface-raised hover:text-primary transition-colors text-left"
                  >
                    <Settings size={15} className="text-ink-muted" />
                    <div className="flex-1">
                      <div className="font-medium">Account Settings</div>
                      <div className="text-[10px] text-ink-muted">Fonts, preferences & team management</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink rounded-lg hover:bg-surface-raised hover:text-primary transition-colors text-left"
                  >
                    <KeyRound size={15} className="text-ink-muted" />
                    <div className="flex-1">
                      <div className="font-medium">Switch User Account</div>
                      <div className="text-[10px] text-ink-muted">Sign in with a different team role</div>
                    </div>
                  </button>
                </div>

                {/* Logout Divider & Action */}
                <div className="p-1.5 border-t border-border/80 bg-surface-raised/40">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-red rounded-lg hover:bg-red-soft/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut size={15} />
                      <span>Log Out of Green Fibre</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-70">End Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={openLoginModal}
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
