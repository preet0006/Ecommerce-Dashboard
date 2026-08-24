import { Search, Bell } from 'lucide-react';

export default function Topbar() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-ink">Dashboard</h1>
        <p className="text-xs text-ink-muted">{today} · All channels</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9 w-64" placeholder="Search SKU, vendor, order…" />
        </div>
        <button className="btn-ghost" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-8 w-8 rounded-full bg-primary-soft flex items-center justify-center text-xs font-semibold text-primary-strong">
          RJ
        </div>
      </div>
    </header>
  );
}
