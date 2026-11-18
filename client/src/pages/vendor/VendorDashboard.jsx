import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  FiLogOut,
  FiBriefcase,
  FiBox,
  FiList,
  FiTrendingUp,
  FiShoppingBag,
  FiPlus,
  FiCopy,
  FiCheck,
  FiEdit2,
  FiMapPin,
  FiPhone,
  FiCreditCard,
  FiBell,
  FiArrowRight,
  FiAlertTriangle,
  FiDollarSign,
  FiCalendar,
  FiPrinter,
  FiCheckCircle,
  FiClock,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import {
  vendorGetMe,
  vendorUpdateProfile,
  vendorDeleteAccount,
  logout,
} from "../../services/authService";
import { deleteMyShop } from "../../services/shopService";
import { getNotifications, markAsRead, markAllAsRead } from "../../services/notificationService";
import { getVendorDashboardSummary } from "../../services/dashboardService";
import BillModal from "../../components/BillModal";
import ReportIssueModal from "../../components/ReportIssueModal";

function VendorDashboard() {
  const [vendorData, setVendorData] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Summary Metrics from Backend
  const [dashboardSummary, setDashboardSummary] = useState(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Active Bill Modal state
  const [activeBill, setActiveBill] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Profile & Shop Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [editForm, setEditForm] = useState({
    ownerName: "",
    email: "",
    shopName: "",
    shopNumber: "",
    address: "",
    contactNumber: "",
    upiId: "",
    latitude: "",
    longitude: "",
  });
  const [editError, setEditError] = useState("");

  const navigate = useNavigate();

  const fetchAllData = useCallback(async () => {
    try {
      const [profRes, notifRes, summaryRes] = await Promise.all([
        vendorGetMe(),
        getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
        getVendorDashboardSummary().catch(() => ({ summary: null })),
      ]);

      setVendorData(profRes.vendor);
      setShop(profRes.shop);
      setNotifications(notifRes.notifications || []);
      setUnreadCount(notifRes.unreadCount || 0);
      setDashboardSummary(summaryRes?.summary || null);

      setEditForm({
        ownerName: profRes.vendor?.ownerName || "",
        email: profRes.vendor?.email || "",
        shopName: profRes.shop?.shopName || "",
        shopNumber: profRes.shop?.shopNumber || "",
        address: profRes.shop?.address || "",
        contactNumber: profRes.shop?.contactNumber || "",
        upiId: profRes.shop?.upiId || "",
        latitude:
          profRes.shop?.latitude !== null && profRes.shop?.latitude !== undefined
            ? profRes.shop.latitude.toString()
            : "",
        longitude:
          profRes.shop?.longitude !== null && profRes.shop?.longitude !== undefined
            ? profRes.shop.longitude.toString()
            : "",
      });
    } catch {
      const cachedUser = localStorage.getItem("user");
      const cachedShop = localStorage.getItem("shop");
      if (cachedUser) setVendorData(JSON.parse(cachedUser));
      if (cachedShop) setShop(JSON.parse(cachedShop));
    } finally {
      setLoading(false);
    }
  }, []);

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "VENDOR") {
      navigate("/vendor/login");
      return;
    }

    fetchAllData();

    const handleFocus = () => fetchAllData();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
    };
  }, [navigate, fetchAllData, location.key]);

  const handleLogout = () => {
    logout();
    navigate("/vendor/login");
  };

  const handleCopyShopId = () => {
    if (shop?.shopId) {
      navigator.clipboard.writeText(shop.shopId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      setSavingShop(true);
      setEditError("");

      const payload = {
        ownerName: editForm.ownerName,
        email: editForm.email || undefined,
        shopName: editForm.shopName,
        shopNumber: editForm.shopNumber || undefined,
        address: editForm.address,
        contactNumber: editForm.contactNumber,
        upiId: editForm.upiId || null,
        latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
        longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
      };

      const res = await vendorUpdateProfile(payload);
      setVendorData(res.vendor);
      setShop(res.shop);
      localStorage.setItem("user", JSON.stringify(res.vendor));
      if (res.shop) {
        localStorage.setItem("shop", JSON.stringify(res.shop));
      }
      setIsEditing(false);
      alert("Profile and shop information updated successfully!");
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update profile & shop.");
    } finally {
      setSavingShop(false);
    }
  };

  const handleDeleteShop = async () => {
    const confirmation = window.prompt(
      'Type "DELETE SHOP" to permanently delete your registered shop and all its products/orders:'
    );
    if (confirmation !== "DELETE SHOP") {
      if (confirmation !== null) alert("Confirmation mismatch. Shop was not deleted.");
      return;
    }

    try {
      setSavingShop(true);
      await deleteMyShop();
      localStorage.removeItem("shop");
      setShop(null);
      setIsEditing(false);
      alert("Your registered shop has been deleted. You can register a new shop anytime.");
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete shop.");
    } finally {
      setSavingShop(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Type "DELETE ACCOUNT" to permanently delete your Vendor Account, registered shop, and all records. This cannot be undone:'
    );
    if (confirmation !== "DELETE ACCOUNT") {
      if (confirmation !== null) alert("Confirmation mismatch. Account was not deleted.");
      return;
    }

    try {
      setSavingShop(true);
      await vendorDeleteAccount();
      logout();
      alert("Your vendor account has been permanently deleted.");
      navigate("/vendor/register");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete vendor account.");
    } finally {
      setSavingShop(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-semibold text-sm">Loading vendor control panel...</p>
        </div>
      </div>
    );
  }

  const sales = dashboardSummary?.sales || { today: 0, todayOrdersCount: 0, weekly: 0, monthly: 0, total: 0 };
  const channels = dashboardSummary?.channels || { onlineCount: 0, onlineAmount: 0, walkInCount: 0, walkInAmount: 0 };
  const orderStatus = dashboardSummary?.orderStatus || { pendingPaymentCount: 0, awaitingPickupCount: 0, completedOrdersCount: 0, totalVerifiedOrders: 0 };
  const inventory = dashboardSummary?.inventory || { totalProducts: 0, outOfStockProducts: 0, lowStockProducts: 0, totalCategories: 0 };
  const recentSales = dashboardSummary?.recentSales || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🛒</span> ShopFlow <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Vendor</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              title="Notifications"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <FiBell size={16} /> Alerts & Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                        className={`p-3.5 text-xs transition cursor-pointer ${
                          n.isRead ? "bg-white text-slate-600" : "bg-blue-50/70 text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              n.type === "OUT_OF_STOCK"
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {n.type === "OUT_OF_STOCK" ? "Stock Alert" : "Incoming Order"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="font-bold mt-1 text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{vendorData?.ownerName || "Shop Owner"}</p>
            <p className="text-xs text-slate-500">{vendorData?.mobile}</p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            <span>⚠️</span> <span>Report Issue</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm transition cursor-pointer"
          >
            <FiUser size={14} /> <span>{isEditing ? "Close Editor" : "Profile & Shop"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-lg text-sm transition cursor-pointer"
          >
            <FiLogOut size={16} /> <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Out of stock alert banner if any */}
        {inventory.outOfStockProducts > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <FiAlertTriangle size={18} />
              </div>
              <p className="text-sm font-medium">
                You have <strong>{inventory.outOfStockProducts} product{inventory.outOfStockProducts > 1 ? "s" : ""}</strong> currently out of stock. Customers cannot place orders for them.
              </p>
            </div>
            <Link
              to="/vendor/products"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition whitespace-nowrap"
            >
              Update Stock
            </Link>
          </div>
        )}

        {/* Shop Status Banner or Active Shop Card */}
        {!shop ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  Action Required
                </span>
                <h2 className="text-2xl font-black text-amber-950 mt-2 flex items-center gap-2">
                  <FiBriefcase /> Register Your Shop Profile
                </h2>
                <p className="text-sm text-amber-800/90 mt-1 max-w-xl">
                  You have authenticated your vendor account. Register your physical shop name, address, GPS location, and UPI ID to unlock product management, inventory, and incoming orders.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold px-4 py-3 rounded-xl transition text-sm cursor-pointer shadow-xs"
                >
                  {isEditing ? "Close Profile Editor" : "Manage Profile"}
                </button>
                <Link
                  to="/vendor/register-shop"
                  className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 text-sm whitespace-nowrap shadow-sm cursor-pointer"
                >
                  <FiPlus size={18} /> Register Shop Now
                </Link>
              </div>
            </div>

            {/* Profile editor when no shop is registered */}
            {isEditing && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSaveShop} className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Edit Vendor Profile</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials.</p>
                  </div>

                  {editError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{editError}</div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Owner Full Name</label>
                        <input
                          type="text"
                          value={editForm.ownerName}
                          onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Account Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="vendor@example.com"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingShop}
                      className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-emerald-600 transition cursor-pointer disabled:bg-slate-400 shadow-xs"
                    >
                      {savingShop ? "Saving Changes..." : "Save Profile Changes"}
                    </button>
                  </div>

                  {/* Danger Zone: Delete Account */}
                  <div className="pt-6 border-t border-red-200 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600">Danger Zone</p>
                    <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-red-950">Delete Entire Vendor Account</p>
                        <p className="text-[10px] text-red-700 mt-0.5">
                          Permanently purge your vendor credentials and records.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={savingShop}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        <FiTrash2 size={13} /> Delete Entire Account
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs px-3 py-1.5 rounded-lg">
                    Shop ID: {shop.shopId}
                    <button
                      onClick={handleCopyShopId}
                      title="Copy Shop ID"
                      className="text-blue-600 hover:text-blue-800 ml-1 cursor-pointer"
                    >
                      {copied ? <FiCheck size={14} className="text-emerald-600" /> : <FiCopy size={14} />}
                    </button>
                  </span>
                  {copied && <span className="text-xs text-emerald-600 font-semibold">Copied!</span>}
                </div>

                <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                  {shop.shopName}
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <FiMapPin size={14} className="text-slate-400" /> {shop.address}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition cursor-pointer"
                >
                  <FiEdit2 size={14} /> {isEditing ? "Close Editor" : "Edit Shop Details"}
                </button>
              </div>
            </div>

            {/* Quick Details Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FiPhone size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Contact</p>
                  <p className="font-semibold">{shop.contactNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <FiCreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Direct Vendor UPI Destination</p>
                  <p className="font-semibold font-mono text-xs">{shop.upiId || "Not Configured"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <FiMapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">GPS Coordinates</p>
                  <p className="font-semibold text-xs">
                    {shop.latitude && shop.longitude
                      ? `${parseFloat(shop.latitude).toFixed(4)}, ${parseFloat(shop.longitude).toFixed(4)}`
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Profile & Shop Editor */}
            {isEditing && (
              <form onSubmit={handleSaveShop} className="mt-6 pt-6 border-t border-slate-200 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Edit Vendor Profile & Shop Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials and public store settings.</p>
                </div>

                {editError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{editError}</div>
                )}

                {/* Section A: Vendor Personal Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Vendor Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Owner Full Name</label>
                      <input
                        type="text"
                        value={editForm.ownerName}
                        onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Account Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="vendor@example.com"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Shop Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Registered Shop Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Store / Shop Name</label>
                      <input
                        type="text"
                        value={editForm.shopName}
                        onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Shop Reg / Number (Optional)</label>
                      <input
                        type="text"
                        value={editForm.shopNumber}
                        onChange={(e) => setEditForm({ ...editForm, shopNumber: e.target.value })}
                        placeholder="e.g. SHOP-123"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Public Contact Number</label>
                      <input
                        type="text"
                        value={editForm.contactNumber}
                        onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Direct Merchant UPI ID</label>
                      <input
                        type="text"
                        value={editForm.upiId}
                        onChange={(e) => setEditForm({ ...editForm, upiId: e.target.value })}
                        placeholder="merchant@okhdfcbank"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">Where customer UPI payments are directly transferred.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Store Address & Neighborhood</label>
                    <textarea
                      rows={2}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">GPS Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">GPS Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingShop}
                    className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-emerald-600 transition cursor-pointer disabled:bg-slate-400 shadow-xs"
                  >
                    {savingShop ? "Saving Changes..." : "Save Profile & Shop Changes"}
                  </button>
                </div>

                {/* Section C: Danger Zone */}
                <div className="pt-6 border-t border-red-200 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600">Danger Zone</p>
                  <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-red-950">Delete Registered Shop</p>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        Permanently delete this shop and all its catalog products, categories, and past orders.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteShop}
                      disabled={savingShop}
                      className="bg-white border border-red-300 hover:bg-red-50 text-red-700 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FiTrash2 size={13} /> Delete Registered Shop
                    </button>
                  </div>

                  <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-red-950">Delete Entire Vendor Account</p>
                      <p className="text-[10px] text-red-700 mt-0.5">
                        Permanently purge your vendor credentials, registered shop, and all records.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={savingShop}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      <FiTrash2 size={13} /> Delete Entire Account
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Section 1: Sales & Financial Performance (Milestone 6) */}
        {shop && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FiTrendingUp className="text-emerald-600" /> Sales & Revenue Performance
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated strictly from verified bank payments (0% gateway fees)
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Live Analytics
              </span>
            </div>

            {/* 4 Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                  <span>Today's Sales</span>
                  <FiDollarSign className="text-emerald-600" size={16} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  ₹{parseFloat(sales.today || 0).toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  {sales.todayOrdersCount} verified order{sales.todayOrdersCount === 1 ? "" : "s"} today
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                  <span>This Week</span>
                  <FiCalendar className="text-blue-600" size={16} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  ₹{parseFloat(sales.weekly || 0).toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">Last 7 rolling days</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                  <span>This Month</span>
                  <FiTrendingUp className="text-indigo-600" size={16} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  ₹{parseFloat(sales.monthly || 0).toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">Last 30 rolling days</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                  <span>Total Sales</span>
                  <FiCheckCircle className="text-purple-600" size={16} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  ₹{parseFloat(sales.total || 0).toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  {orderStatus.totalVerifiedOrders} lifetime completed sale{orderStatus.totalVerifiedOrders === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Sales Channel Ratio Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs">
                <span className="font-bold text-slate-800">Sales Channels:</span>
                <span className="ml-2 text-slate-600">
                  Online Pre-orders: <strong>₹{parseFloat(channels.onlineAmount || 0).toFixed(2)}</strong> ({channels.onlineCount} orders) • Walk-in Counter: <strong>₹{parseFloat(channels.walkInAmount || 0).toFixed(2)}</strong> ({channels.walkInCount} sales)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {orderStatus.pendingPaymentCount > 0 && (
                  <Link
                    to="/vendor/orders"
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 animate-pulse"
                  >
                    <span>⚡ {orderStatus.pendingPaymentCount} UPI payments awaiting verification</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Action Control Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Products & Inventory Card */}
          <Link
            to="/vendor/products"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiBox size={20} />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {inventory.totalProducts} items
                </span>
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition">
                Products & Inventory
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Add products, set cost/selling prices, and update stock counts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Manage Products</span>
              <FiArrowRight />
            </div>
          </Link>

          {/* Categories Card */}
          <Link
            to="/vendor/categories"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FiList size={20} />
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {inventory.totalCategories} categories
                </span>
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition">
                Categories
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Organize products into shop-specific categories.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Manage Categories</span>
              <FiArrowRight />
            </div>
          </Link>

          {/* Incoming Orders Card */}
          <Link
            to="/vendor/orders"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FiShoppingBag size={20} />
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    orderStatus.awaitingPickupCount > 0
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {orderStatus.awaitingPickupCount} ready for pickup
                </span>
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition">
                Incoming Orders & Pickups
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Verify customer direct UPI payments and match pickup IDs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>View Order Queue</span>
              <FiArrowRight />
            </div>
          </Link>

          {/* Walk-in POS Billing Card */}
          <Link
            to="/vendor/pos"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <FiDollarSign size={20} />
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                  Quick POS
                </span>
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-purple-600 transition">
                Walk-in POS Billing
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Point of sale counter terminal with instant receipt printing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
              <span>Open POS Counter</span>
              <FiArrowRight />
            </div>
          </Link>
        </div>

        {/* Section 3: Recent Verified Sales Activity */}
        {recentSales.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FiClock className="text-slate-600" /> Recent Sales Transactions
                </h3>
                <p className="text-xs text-slate-400">
                  Latest verified purchases and in-store walk-in orders
                </p>
              </div>
              <Link
                to="/vendor/orders"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View all orders
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider pb-2">
                    <th className="py-2.5 font-semibold">Order / Pickup ID</th>
                    <th className="py-2.5 font-semibold">Channel</th>
                    <th className="py-2.5 font-semibold">Customer</th>
                    <th className="py-2.5 font-semibold">Items</th>
                    <th className="py-2.5 text-right font-semibold">Amount</th>
                    <th className="py-2.5 text-right font-semibold">Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium">
                        <span className="font-bold text-slate-900">{s.orderNumber}</span>
                        {s.pickupId && (
                          <span className="ml-2 text-[10px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {s.pickupId}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            s.orderType === "ONLINE"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {s.orderType === "ONLINE" ? "Online" : "Walk-in"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{s.customerMobile}</td>
                      <td className="py-3 text-slate-600">{s.itemCount} items</td>
                      <td className="py-3 text-right font-black text-slate-900">
                        ₹{parseFloat(s.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/vendor/orders"
                          className="inline-flex items-center gap-1 border border-slate-200 hover:border-slate-300 bg-white px-2.5 py-1 rounded-lg text-slate-700 font-semibold text-xs transition"
                        >
                          <FiPrinter size={12} /> Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Bill Receipt Modal if opened */}
      {activeBill && (
        <BillModal bill={activeBill} onClose={() => setActiveBill(null)} />
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        shopId={shop?.id}
        shopName={shop?.shopName}
      />
    </div>
  );
}

export default VendorDashboard;
