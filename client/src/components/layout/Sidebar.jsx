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
} from "lucide-react";

import { NavLink } from "react-router-dom";

const NAV = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Products",
    icon: Package,
    path: "/products",
  },
  {
    label: "Vendors",
    icon: Truck,
    path: "/vendors",
  },
  {
    label: "Purchase Orders",
    icon: ShoppingCart,
    path: "/purchase",
  },
  {
    label: "Pricing",
    icon: Tag,
    path: "/pricing",
  },
  {
    label: "Inventory",
    icon: Boxes,
    path: "/inventory",
  },
  {
    label: "Reports",
    icon: FileBarChart,
    path: "/reports",
  },
  {
    label: "Forecasting",
    icon: TrendingUp,
    path: "/forecasting",
  },
  {
    label: "Channel Orders",
    icon: ShoppingBag,
    path: "/channel-orders",
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface p-4">
      
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white font-display text-sm">
          GF
        </span>

        <span className="font-display text-sm font-semibold text-ink">
          Green Fibre
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "sidebar-link-active"
                  : "sidebar-link"
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-auto pt-4 flex flex-col gap-1">

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link-active"
              : "sidebar-link"
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link-active"
              : "sidebar-link"
          }
        >
          <Sparkles className="h-4 w-4" />
          Ask AI
        </NavLink>

      </div>
    </aside>
  );
}