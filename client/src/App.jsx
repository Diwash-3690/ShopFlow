import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";

// Vendor Pages
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorRegister from "./pages/vendor/VendorRegister";
import VendorForgotPassword from "./pages/vendor/VendorForgotPassword";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import ShopRegistration from "./pages/vendor/ShopRegistration";
import Products from "./pages/vendor/Products";
import Categories from "./pages/vendor/Categories";
import VendorOrders from "./pages/vendor/VendorOrders";
import WalkInPos from "./pages/vendor/WalkInPos";

// Customer Pages
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerRegister from "./pages/customer/CustomerRegister";
import CustomerForgotPassword from "./pages/customer/CustomerForgotPassword";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ShopDiscovery from "./pages/customer/ShopDiscovery";
import ShopStorefront from "./pages/customer/ShopStorefront";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Home />} />

      {/* Vendor Routes */}
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/register" element={<VendorRegister />} />
      <Route path="/vendor/forgot-password" element={<VendorForgotPassword />} />
      <Route path="/vendor/register-shop" element={<ShopRegistration />} />
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/vendor/products" element={<Products />} />
      <Route path="/vendor/categories" element={<Categories />} />
      <Route path="/vendor/orders" element={<VendorOrders />} />
      <Route path="/vendor/pos" element={<WalkInPos />} />

      {/* Customer Routes */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/register" element={<CustomerRegister />} />
      <Route path="/customer/forgot-password" element={<CustomerForgotPassword />} />
      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      <Route path="/shops" element={<ShopDiscovery />} />
      <Route path="/shops/:shopId" element={<ShopStorefront />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* Backwards-Compatibility Aliases */}
      <Route path="/login" element={<Navigate to="/vendor/login" replace />} />
      <Route path="/register" element={<Navigate to="/vendor/register" replace />} />
      <Route path="/dashboard" element={<Navigate to="/vendor/dashboard" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
