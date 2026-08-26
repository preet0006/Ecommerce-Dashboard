import React, { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  Tag,
  Boxes,
  FileBarChart,
  TrendingUp,
  Settings,
  Sparkles,
  ShoppingBag,
  X,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { logout } from "../../lib/api";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Vendors", icon: Truck, path: "/vendors" },
  { label: "Purchase Orders", icon: ShoppingCart, path: "/purchase" },
  { label: "Pricing", icon: Tag, path: "/pricing" },
  { label: "Inventory", icon: Boxes, path: "/inventory" },
  { label: "Reports", icon: FileBarChart, path: "/reports" },
  { label: "Forecasting", icon: TrendingUp, path: "/forecasting" },
  { label: "Channel Orders", icon: ShoppingBag, path: "/channel-orders" },
];

export default function Sidebar() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface p-4 sticky top-0 h-screen overflow-y-auto z-30 select-none transition-colors">
      {/* Logo */}
      <div className="flex items-center justify-between px-2 mb-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <span className="font-display text-sm font-bold tracking-wider">GF</span>
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-tight text-ink">
              GREEN FIBRE
            </div>
            <div className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
              E-Commerce Hub
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link-active" : "sidebar-link"
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto pt-4 flex flex-col gap-1 shrink-0 border-t border-border/60">
        <NavLink
          to="/ai"
          className={({ isActive }) =>
            isActive ? "sidebar-link-active" : "sidebar-link"
          }
        >
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold">Ask AI</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "sidebar-link-active" : "sidebar-link"
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </NavLink>

        {/* Theme Quick Switcher in Sidebar Footer */}
        <button
          type="button"
          onClick={toggleTheme}
          className="sidebar-link !justify-between mt-1 text-xs"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </span>
          <span className="text-[10px] font-mono text-ink-muted uppercase">
            {isDark ? "Dark" : "Light"}
          </span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link !text-red hover:!bg-red-soft/30 transition-colors mt-1"
          title="Sign out of your account"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

/**
 * Mobile Slide-Over Navigation Drawer
 */
export function MobileSidebarDrawer({ open, onClose }) {
  const { isDark, toggleTheme } = useTheme();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex animate-enter">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="relative flex flex-col w-72 max-w-[80vw] h-full bg-surface border-r border-border p-4 shadow-2xl z-10 overflow-y-auto"
        style={{ animation: "slideRight 0.22s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-1 mb-5 shrink-0 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-display text-sm font-bold shadow-xs">
              GF
            </span>
            <span className="font-display text-sm font-bold text-ink">
              Green Fibre
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? "sidebar-link-active" : "sidebar-link"
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="mt-auto pt-4 flex flex-col gap-1.5 shrink-0 border-t border-border/60">
          <NavLink
            to="/ai"
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? "sidebar-link-active" : "sidebar-link"
            }
          >
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold">Ask AI Workspace</span>
          </NavLink>

          <button
            type="button"
            onClick={toggleTheme}
            className="sidebar-link !justify-between text-xs"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </span>
            <span className="text-[10px] font-mono text-ink-muted uppercase">
              {isDark ? "Dark" : "Light"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              handleLogout();
            }}
            className="sidebar-link !text-red hover:!bg-red-soft/30 transition-colors mt-1"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}