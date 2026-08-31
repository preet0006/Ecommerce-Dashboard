import React, { useState, lazy, Suspense } from "react";
import Sidebar, { MobileSidebarDrawer } from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import DeliveryArrivalModal from "./components/DeliveryArrivalModal";
import PageSkeleton from "./components/common/PageSkeleton";
import { BrowserRouter, Route, Routes, useLocation, NavLink } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { FontProvider } from "./context/FontContext";
import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/auth/LoginModal";
import UserInfoModal from "./components/auth/UserInfoModal";
import LogoutConfirmModal from "./components/auth/LogoutConfirmModal";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Sparkles
} from "lucide-react";

import RequireAuth from "./components/auth/RequireAuth";

// ── Auth Pages (Lazy-loaded) ────────────────────────────────────────────────
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// ── Dashboard Pages (Lazy-loaded) ───────────────────────────────────────────
const Home = lazy(() => import("./pages/Home"));
const ProductMaster = lazy(() => import("./pages/ProductMaster"));
const VendorMaster = lazy(() => import("./pages/Vendors"));
const PurchaseOrders = lazy(() => import("./pages/Purchase"));
const Reports = lazy(() => import("./pages/Reports"));
const Forecasting = lazy(() => import("./pages/Forecasting"));
const Inventory = lazy(() => import("./pages/Inventory"));
const PricingDiscounts = lazy(() => import("./pages/PricingDiscount"));
const ChannelOrders = lazy(() => import("./pages/ChannelOrders"));
const AskAI = lazy(() => import("./pages/AskAI"));
const Settings = lazy(() => import("./pages/Settings"));

const MOBILE_BOTTOM_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Orders", icon: ShoppingCart, path: "/purchase" },
  { label: "Inventory", icon: Boxes, path: "/inventory" },
  { label: "Ask AI", icon: Sparkles, path: "/ai" },
];

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAiPage = location.pathname === "/ai";

  return (
    <div className="flex min-h-screen bg-bg transition-colors">
      {/* Desktop Sticky Sidebar */}
      <Sidebar />

      {/* Mobile Slide-Over Drawer */}
      <MobileSidebarDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Conditional Topbar (hidden on full-height /ai page) */}
        {!isAiPage && <Topbar onMenuClick={() => setMobileMenuOpen(true)} />}

        {/* Automatic Delivery Arrival Verification Check on Homescreen / Dashboard */}
        <DeliveryArrivalModal />

        {/* Global User Authentication & Profile Dialog Modals */}
        <LoginModal />
        <UserInfoModal />
        <LogoutConfirmModal />

        <main className="flex-1">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductMaster />} />
              <Route path="/vendors" element={<VendorMaster />} />
              <Route path="/purchase" element={<PurchaseOrders />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/pricing" element={<PricingDiscounts />} />
              <Route path="/forecasting" element={<Forecasting />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/channel-orders" element={<ChannelOrders />} />
              <Route path="/ai" element={<AskAI />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Mobile Quick Bottom Navigation Bar (Hidden on Desktop) */}
      {!isAiPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around py-1.5 px-2 lg:hidden shadow-lg transition-colors">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
                    isActive
                      ? "text-primary font-bold bg-primary-soft/50"
                      : "text-ink-muted hover:text-ink"
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FontProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Unprotected Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/*"
                element={
                  <RequireAuth>
                    <AppContent />
                  </RequireAuth>
                }
              />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
