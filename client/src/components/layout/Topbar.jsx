import React from 'react';
import { Search, Bell, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-surface/95 backdrop-blur-sm px-4 sm:px-6 py-3 sticky top-0 z-20 shadow-2xs transition-colors">
      {/* Left: Mobile Menu Trigger + Title */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors lg:hidden"
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

      {/* Right: Search, Dark Mode Toggle, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-8.5 w-48 lg:w-64 text-xs h-8.5" placeholder="Search SKU, vendor, order…" />
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-raised transition-all duration-200 active:scale-95 shadow-2xs"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun size={16} className="text-amber-400 animate-enter" />
          ) : (
            <Moon size={16} className="text-emerald-800 animate-enter" />
          )}
        </button>

        {/* Notifications */}
        <button className="btn-ghost !p-2 text-ink-muted hover:text-ink" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>

        {/* Profile Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center text-xs font-semibold text-primary-strong shadow-xs shrink-0 border border-primary/20">
          RJ
        </div>
      </div>
    </header>
  );
}
