import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import ProductMaster from "./pages/ProductMaster";
import VendorMaster from "./pages/Vendors";
import PurchaseOrders from "./pages/Purchase";
import Reports from "./pages/Reports";
import Forecasting from "./pages/Forecasting";
import Inventory from "./pages/Inventory";
import PricingDiscounts from "./pages/PricingDiscount";
import ChannelOrders from "./pages/ChannelOrders";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />

          <main className="flex-1">
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
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}