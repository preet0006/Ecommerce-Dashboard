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
  User,
  Shield,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth, getUserInitials } from "../../context/AuthContext";
import greenfibreLeaves from "../../assets/greenfibre-leaves.png";

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

// Route prefetch map for ultra-fast instant hover loading
const routePrefetchMap = {
  "/": () => import("../../pages/Home"),
  "/products": () => import("../../pages/ProductMaster"),
  "/vendors": () => import("../../pages/Vendors"),
  "/purchase": () => import("../../pages/Purchase"),
  "/pricing": () => import("../../pages/PricingDiscount"),
  "/inventory": () => import("../../pages/Inventory"),
  "/reports": () => import("../../pages/Reports"),
  "/forecasting": () => import("../../pages/Forecasting"),
  "/channel-orders": () => import("../../pages/ChannelOrders"),
  "/ai": () => import("../../pages/AskAI"),
  "/settings": () => import("../../pages/Settings"),
};

const prefetchRoute = (path) => {
  try {
    routePrefetchMap[path]?.();
  } catch {}
};

export default function Sidebar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, openLogoutConfirm, openUserInfoModal } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    openLogoutConfirm();
  };

  const userInitials = getUserInitials(user);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface p-4 sticky top-0 h-screen overflow-y-auto z-30 select-none transition-colors">
      {/* Logo */}
      <div className="flex items-center justify-between px-2 mb-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-2 border border-border/80 shadow-xs overflow-hidden shrink-0">
            <img
              src={greenfibreLeaves}
              alt="Green Fibre Leaves"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-display text-base font-bold tracking-tight text-ink flex items-center gap-1 leading-tight">
              <span className="text-primary font-extrabold">Green</span>
              <span className="text-ink font-semibold">Fibre</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-muted font-medium">
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
              onMouseEnter={() => prefetchRoute(item.path)}
              onFocus={() => prefetchRoute(item.path)}
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
        {/* Clickable User Info Card in Sidebar */}
        {user && (
          <button
            type="button"
            onClick={openUserInfoModal}
            className="flex items-center gap-2.5 p-2 rounded-xl border border-border bg-surface-raised/80 hover:bg-surface-raised hover:border-primary/40 transition-all text-left mb-1 group"
            title="Click to view user information"
          >
            <div className="h-8 w-8 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate leading-tight flex items-center justify-between">
                <span>{user.name}</span>
              </div>
              <span className="text-[10px] text-ink-muted capitalize">
                {user.role} · {user.department ? user.department.split(' ')[0] : 'Admin'}
              </span>
            </div>
          </button>
        )}

        <NavLink
          to="/ai"
          onMouseEnter={() => prefetchRoute("/ai")}
          onFocus={() => prefetchRoute("/ai")}
          className={({ isActive }) =>
            isActive ? "sidebar-link-active" : "sidebar-link"
          }
        >
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold">Ask AI</span>
        </NavLink>

        <NavLink
          to="/settings"
          onMouseEnter={() => prefetchRoute("/settings")}
          onFocus={() => prefetchRoute("/settings")}
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
          className="sidebar-link !justify-between mt-1 text-xs cursor-pointer"
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
  const { user, openLogoutConfirm, openUserInfoModal } = useAuth();

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

  const userInitials = getUserInitials(user);

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
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-2 border border-border/80 shadow-xs overflow-hidden shrink-0">
              <img
                src={greenfibreLeaves}
                alt="Green Fibre Leaves"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="font-display text-base font-bold tracking-tight text-ink flex items-center gap-1 leading-tight">
                <span className="text-primary font-extrabold">Green</span>
                <span className="text-ink font-semibold">Fibre</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted font-medium">
                E-Commerce Hub
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card in Mobile Drawer */}
        {user && (
          <button
            type="button"
            onClick={() => {
              onClose();
              openUserInfoModal();
            }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface-raised mb-4 text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate">{user.name}</div>
              <span className="text-[10px] text-ink-muted capitalize">
                {user.role} · View profile
              </span>
            </div>
          </button>
        )}

        {/* Navigation links */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onClose}
                onMouseEnter={() => prefetchRoute(item.path)}
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
            onMouseEnter={() => prefetchRoute("/ai")}
            className={({ isActive }) =>
              isActive ? "sidebar-link-active" : "sidebar-link"
            }
          >
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold">Ask AI Workspace</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={onClose}
            onMouseEnter={() => prefetchRoute("/settings")}
            className={({ isActive }) =>
              isActive ? "sidebar-link-active" : "sidebar-link"
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </NavLink>

          <button
            type="button"
            onClick={toggleTheme}
            className="sidebar-link !justify-between text-xs cursor-pointer"
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
              openLogoutConfirm();
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