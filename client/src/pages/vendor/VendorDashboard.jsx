import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  LogOut,
  Briefcase,
  Box,
  List,
  TrendingUp,
  ShoppingBag,
  Plus,
  Copy,
  Check,
  Edit2,
  MapPin,
  Phone,
  CreditCard,
  Bell,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Calendar,
  Printer,
  CheckCircle2,
  Clock,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import {
  vendorGetMe,
  vendorUpdateProfile,
  vendorDeleteAccount,
  vendorSendEmailOtp,
  vendorVerifyEmailOtp,
  vendorSendPhoneOtp,
  vendorVerifyPhoneOtp,
  logout,
} from "../../services/authService";
import { deleteMyShop } from "../../services/shopService";
import { getNotifications, markAsRead, markAllAsRead } from "../../services/notificationService";
import { getVendorDashboardSummary } from "../../services/dashboardService";
import BillModal from "../../components/BillModal";
import ReportIssueModal from "../../components/ReportIssueModal";
import ShopFlowRoleLogo from "../../components/ShopFlowRoleLogo";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/table";

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
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpDevCode, setEmailOtpDevCode] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailVerificationMsg, setEmailVerificationMsg] = useState({ type: "", text: "" });
  const [editingPhone, setEditingPhone] = useState(false);
  const [newMobile, setNewMobile] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneOtpDevCode, setPhoneOtpDevCode] = useState("");
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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

  const handleSendVendorEmailOtp = async () => {
    const targetEmail = (editForm.email || vendorData?.email || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setEditError("Please enter a valid email address first.");
      return;
    }
    try {
      setSendingEmailOtp(true);
      setEditError("");
      setEmailVerificationMsg({ type: "", text: "" });
      const res = await vendorSendEmailOtp({ email: targetEmail });
      setEmailOtpSent(true);
      setEmailOtpDevCode(res.devCode || "");
      setEmailVerificationMsg({
        type: "success",
        text: res.message || `Verification code sent to ${targetEmail}`,
      });
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to send verification code.");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyVendorEmailOtp = async () => {
    const targetEmail = (editForm.email || vendorData?.email || "").trim();
    if (!emailOtpCode.trim()) {
      setEditError("Please enter the 6-digit verification code.");
      return;
    }
    try {
      setVerifyingEmailOtp(true);
      setEditError("");
      const res = await vendorVerifyEmailOtp({
        email: targetEmail,
        code: emailOtpCode.trim(),
      });
      setVendorData(res.vendor);
      setEditForm((prev) => ({
        ...prev,
        email: res.vendor.email || "",
      }));
      localStorage.setItem("user", JSON.stringify(res.vendor));
      setEmailOtpSent(false);
      setEmailOtpCode("");
      setEmailOtpDevCode("");
      setEmailVerificationMsg({
        type: "success",
        text: "Email verified successfully! You can now log in using either your mobile number or this verified email.",
      });
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to verify email code.");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSendVendorPhoneOtp = async () => {
    if (!newMobile || !/^\d{10}$/.test(newMobile.trim())) {
      setEditError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (newMobile.trim() === vendorData?.mobile) {
      setEditError("New mobile number must be different from your current registered number.");
      return;
    }
    try {
      setSendingPhoneOtp(true);
      setEditError("");
      const res = await vendorSendPhoneOtp({ newMobile: newMobile.trim() });
      setPhoneOtpSent(true);
      setPhoneOtpDevCode(res.devCode || "");
      alert(`Verification code sent to ${newMobile.trim()}`);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to send verification code.");
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyVendorPhoneOtp = async () => {
    if (!phoneOtpCode.trim()) {
      setEditError("Please enter the 6-digit verification code.");
      return;
    }
    try {
      setVerifyingPhoneOtp(true);
      setEditError("");
      const res = await vendorVerifyPhoneOtp({
        newMobile: newMobile.trim(),
        code: phoneOtpCode.trim(),
      });
      setVendorData(res.vendor);
      setEditForm((prev) => ({
        ...prev,
        contactNumber: prev.contactNumber === vendorData?.mobile || !prev.contactNumber ? res.vendor.mobile : prev.contactNumber,
      }));
      localStorage.setItem("user", JSON.stringify(res.vendor));
      setEditingPhone(false);
      setPhoneOtpSent(false);
      setPhoneOtpCode("");
      setPhoneOtpDevCode("");
      setNewMobile("");
      alert("Phone number updated and verified successfully! You can now use your new phone number to sign in.");
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to verify phone number.");
    } finally {
      setVerifyingPhoneOtp(false);
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
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-3">
          <ShopFlowRoleLogo
            role="VENDOR"
            isDirty={isEditing || editingPhone || savingShop}
            customWarningMessage="You have an active profile or shop editing task in progress. Do you want to leave without saving? Click Cancel to stay."
            onNavigate={() => {
              setIsEditing(false);
              setEditingPhone(false);
            }}
          />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative h-9 w-9 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Notification Dropdown Menu */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>Alerts & Notifications</span>
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer font-semibold"
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
                                ? "bg-rose-100 text-rose-700"
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

          <div className="text-right hidden md:block px-2">
            <p className="text-xs font-bold text-slate-800">{vendorData?.ownerName || "Shop Owner"}</p>
            <p className="text-[10px] text-slate-400 font-mono">{vendorData?.mobile}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            className="h-9 text-rose-700 bg-rose-50/70 hover:bg-rose-100 border-rose-200 text-xs font-bold rounded-xl gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Report Issue</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-9 text-slate-700 hover:bg-slate-100 border-slate-200 text-xs font-bold rounded-xl gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{isEditing ? "Close Editor" : "Profile & Shop"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-9 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Out of stock alert banner if any */}
        {inventory.outOfStockProducts > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm font-semibold">
                You have <strong>{inventory.outOfStockProducts} product{inventory.outOfStockProducts > 1 ? "s" : ""}</strong> currently out of stock. Customers cannot place orders for them.
              </p>
            </div>
            <Link
              to="/vendor/products"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition whitespace-nowrap shadow-xs"
            >
              Update Stock
            </Link>
          </div>
        )}

        {/* Shop Status Banner or Active Shop Card */}
        {!shop ? (
          <div className="space-y-6">
            <Card className="rounded-3xl border-amber-200/90 bg-amber-50/40 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <Badge variant="warning" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2">
                    Action Required
                  </Badge>
                  <h2 className="text-2xl font-black text-amber-950 mt-2 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-amber-700" /> Register Your Shop Profile
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-900/80 mt-1 max-w-xl leading-relaxed">
                    You have authenticated your vendor account. Register your physical shop name, address, GPS location, and UPI ID to unlock product management, inventory, and incoming orders.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs h-10 rounded-xl"
                  >
                    {isEditing ? "Close Profile Editor" : "Manage Profile"}
                  </Button>
                  <Button
                    onClick={() => navigate("/vendor/register-shop")}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-5 rounded-xl gap-2 text-xs shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Shop Now</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Profile editor when no shop is registered */}
            {isEditing && (
              <Card className="rounded-3xl border-slate-200/90 p-6 sm:p-8 shadow-sm bg-white">
                <form onSubmit={handleSaveShop} className="space-y-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Edit Vendor Profile</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials.</p>
                  </div>

                  {editError && (
                    <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-200">{editError}</div>
                  )}

                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Owner Full Name</label>
                        <Input
                          type="text"
                          value={editForm.ownerName}
                          onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                          className="text-xs bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Account Email</label>
                          {vendorData?.email && vendorData?.emailVerified && vendorData?.email.toLowerCase() === editForm.email.toLowerCase() ? (
                            <Badge variant="success" className="text-[10px] font-bold gap-1 py-0 px-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200">
                              Unverified
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="vendor@example.com"
                            className="text-xs bg-white flex-1"
                          />
                          {(!vendorData?.emailVerified || vendorData?.email !== editForm.email) && editForm.email && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleSendVendorEmailOtp}
                              disabled={sendingEmailOtp}
                              className="text-xs font-bold h-9 px-3 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0"
                            >
                              {sendingEmailOtp ? "Sending..." : "Verify (Optional)"}
                            </Button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {vendorData?.emailVerified && vendorData?.email.toLowerCase() === editForm.email.toLowerCase()
                            ? "✓ Verified email can be used alongside your mobile number to sign in."
                            : "Optional: Verify your email to enable dual sign-in with email and password."}
                        </p>

                        {/* Email OTP Input if sent */}
                        {emailOtpSent && (
                          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-blue-950">Enter 6-Digit Email Code</span>
                              {emailOtpDevCode && (
                                <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded">
                                  Dev OTP: {emailOtpDevCode}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                maxLength={6}
                                placeholder="e.g. 123456"
                                value={emailOtpCode}
                                onChange={(e) => setEmailOtpCode(e.target.value)}
                                className="text-xs bg-white border-blue-200 h-8 font-mono tracking-widest text-center"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleVerifyVendorEmailOtp}
                                disabled={verifyingEmailOtp || !emailOtpCode.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0"
                              >
                                {verifyingEmailOtp ? "Verifying..." : "Confirm OTP"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Registered Mobile Number</label>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={vendorData?.mobileVerified ? "success" : "warning"} className="text-[10px] font-bold gap-1 py-0 px-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {vendorData?.mobileVerified ? "Verified" : "Unverified"}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPhone(!editingPhone);
                                setPhoneOtpSent(false);
                                setNewMobile("");
                                setPhoneOtpCode("");
                              }}
                              className="h-6 px-2 text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                            >
                              {editingPhone ? "Cancel Change" : "Change Number"}
                            </Button>
                          </div>
                        </div>

                        {!editingPhone ? (
                          <Input
                            type="text"
                            disabled
                            value={vendorData?.mobile || ""}
                            className="text-xs bg-slate-100 border-slate-200 font-mono text-slate-600 cursor-not-allowed"
                          />
                        ) : (
                          <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-2xl">
                            <div className="flex gap-2">
                              <Input
                                type="tel"
                                maxLength={10}
                                placeholder="Enter new 10-digit number"
                                value={newMobile}
                                onChange={(e) => setNewMobile(e.target.value)}
                                className="text-xs bg-white border-slate-300 flex-1 font-mono"
                              />
                              {!phoneOtpSent ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleSendVendorPhoneOtp}
                                  disabled={sendingPhoneOtp || newMobile.length !== 10}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-3 rounded-xl shrink-0"
                                >
                                  {sendingPhoneOtp ? "Sending..." : "Send OTP"}
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={handleSendVendorPhoneOtp}
                                  disabled={sendingPhoneOtp}
                                  className="text-xs h-9 px-2 text-slate-600"
                                >
                                  Resend
                                </Button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              A 6-digit OTP will be sent to verify your new mobile number. After change, you must use this verified number to log in.
                            </p>

                            {phoneOtpSent && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-blue-950">Enter Verification Code</span>
                                  {phoneOtpDevCode && (
                                    <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded">
                                      Dev OTP: {phoneOtpDevCode}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    maxLength={6}
                                    placeholder="e.g. 123456"
                                    value={phoneOtpCode}
                                    onChange={(e) => setPhoneOtpCode(e.target.value)}
                                    className="text-xs bg-white border-blue-300 h-8 font-mono tracking-widest text-center"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleVerifyVendorPhoneOtp}
                                    disabled={verifyingPhoneOtp || !phoneOtpCode.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0"
                                  >
                                    {verifyingPhoneOtp ? "Verifying..." : "Verify & Save"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="text-xs font-bold h-9"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingShop}
                      className="bg-slate-900 text-white font-bold px-5 h-9 rounded-xl text-xs hover:bg-emerald-600 shadow-xs"
                    >
                      {savingShop ? "Saving Changes..." : "Save Profile Changes"}
                    </Button>
                  </div>

                  {/* Danger Zone: Delete Account */}
                  <div className="pt-6 border-t border-rose-200 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Danger Zone</p>
                    <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-rose-950">Delete Entire Vendor Account</p>
                        <p className="text-[10px] text-rose-700 mt-0.5">
                          Permanently purge your vendor credentials and records.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={savingShop}
                        className="h-8 text-xs font-bold px-3 rounded-xl gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Entire Account</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            )}
          </div>
        ) : (
          <Card className="rounded-3xl border-slate-200/90 p-6 sm:p-8 shadow-sm bg-white">
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
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : <Copy className="w-3.5 h-3.5 inline" />}
                    </button>
                  </span>
                  {copied && <span className="text-xs text-emerald-600 font-bold">Copied!</span>}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                  {shop.shopName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{shop.address}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-1.5 h-9 text-xs font-bold text-slate-700 hover:bg-slate-100 border-slate-200 rounded-xl"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isEditing ? "Close Editor" : "Edit Shop Details"}</span>
                </Button>
              </div>
            </div>

            {/* Quick Details Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Contact</p>
                  <p className="font-semibold text-xs text-slate-800 font-mono">{shop.contactNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Direct UPI Destination</p>
                  <p className="font-bold font-mono text-xs text-purple-900">{shop.upiId || "Not Configured"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">GPS Coordinates</p>
                  <p className="font-semibold text-xs text-slate-800 font-mono">
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
                  <h3 className="text-base font-black text-slate-900">Edit Vendor Profile & Shop Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials and public store settings.</p>
                </div>

                {editError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-200">{editError}</div>
                )}

                {/* Section A: Vendor Personal Info */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1. Vendor Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Owner Full Name</label>
                      <Input
                        type="text"
                        value={editForm.ownerName}
                        onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                        className="text-xs bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Account Email</label>
                        {vendorData?.email && vendorData?.emailVerified && vendorData?.email.toLowerCase() === editForm.email.toLowerCase() ? (
                          <Badge variant="success" className="text-[10px] font-bold gap-1 py-0 px-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200">
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="vendor@example.com"
                          className="text-xs bg-white flex-1"
                        />
                        {(!vendorData?.emailVerified || vendorData?.email !== editForm.email) && editForm.email && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendVendorEmailOtp}
                            disabled={sendingEmailOtp}
                            className="text-xs font-bold h-9 px-3 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0"
                          >
                            {sendingEmailOtp ? "Sending..." : "Verify (Optional)"}
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {vendorData?.emailVerified && vendorData?.email.toLowerCase() === editForm.email.toLowerCase()
                          ? "✓ Verified email can be used alongside your mobile number to sign in."
                          : "Optional: Verify your email to enable dual sign-in with email and password."}
                      </p>

                      {/* Email OTP Input if sent */}
                      {emailOtpSent && (
                        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-950">Enter 6-Digit Email Code</span>
                            {emailOtpDevCode && (
                              <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded">
                                Dev OTP: {emailOtpDevCode}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 123456"
                              value={emailOtpCode}
                              onChange={(e) => setEmailOtpCode(e.target.value)}
                              className="text-xs bg-white border-blue-200 h-8 font-mono tracking-widest text-center"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleVerifyVendorEmailOtp}
                              disabled={verifyingEmailOtp || !emailOtpCode.trim()}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0"
                            >
                              {verifyingEmailOtp ? "Verifying..." : "Confirm OTP"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Registered Mobile Number</label>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={vendorData?.mobileVerified ? "success" : "warning"} className="text-[10px] font-bold gap-1 py-0 px-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {vendorData?.mobileVerified ? "Verified" : "Unverified"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPhone(!editingPhone);
                              setPhoneOtpSent(false);
                              setNewMobile("");
                              setPhoneOtpCode("");
                            }}
                            className="h-6 px-2 text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                          >
                            {editingPhone ? "Cancel Change" : "Change Number"}
                          </Button>
                        </div>
                      </div>

                      {!editingPhone ? (
                        <Input
                          type="text"
                          disabled
                          value={vendorData?.mobile || ""}
                          className="text-xs bg-slate-100 border-slate-200 font-mono text-slate-600 cursor-not-allowed"
                        />
                      ) : (
                        <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-2xl">
                          <div className="flex gap-2">
                            <Input
                              type="tel"
                              maxLength={10}
                              placeholder="Enter new 10-digit number"
                              value={newMobile}
                              onChange={(e) => setNewMobile(e.target.value)}
                              className="text-xs bg-white border-slate-300 flex-1 font-mono"
                            />
                            {!phoneOtpSent ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSendVendorPhoneOtp}
                                disabled={sendingPhoneOtp || newMobile.length !== 10}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-3 rounded-xl shrink-0"
                              >
                                {sendingPhoneOtp ? "Sending..." : "Send OTP"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleSendVendorPhoneOtp}
                                disabled={sendingPhoneOtp}
                                className="text-xs h-9 px-2 text-slate-600"
                              >
                                Resend
                              </Button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            A 6-digit OTP will be sent to verify your new mobile number. After change, you must use this verified number to log in.
                          </p>

                          {phoneOtpSent && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-blue-950">Enter Verification Code</span>
                                {phoneOtpDevCode && (
                                  <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded">
                                    Dev OTP: {phoneOtpDevCode}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  maxLength={6}
                                  placeholder="e.g. 123456"
                                  value={phoneOtpCode}
                                  onChange={(e) => setPhoneOtpCode(e.target.value)}
                                  className="text-xs bg-white border-blue-300 h-8 font-mono tracking-widest text-center"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleVerifyVendorPhoneOtp}
                                  disabled={verifyingPhoneOtp || !phoneOtpCode.trim()}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0"
                                >
                                  {verifyingPhoneOtp ? "Verifying..." : "Verify & Save"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section B: Shop Details */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2. Registered Shop Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700">Store / Shop Name</label>
                      <Input
                        type="text"
                        value={editForm.shopName}
                        onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                        className="text-xs bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Shop Reg / Number (Optional)</label>
                      <Input
                        type="text"
                        value={editForm.shopNumber}
                        onChange={(e) => setEditForm({ ...editForm, shopNumber: e.target.value })}
                        placeholder="e.g. SHOP-123"
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Public Contact Number</label>
                      <Input
                        type="text"
                        value={editForm.contactNumber}
                        onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                        className="text-xs bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Direct Merchant UPI ID</label>
                      <Input
                        type="text"
                        value={editForm.upiId}
                        onChange={(e) => setEditForm({ ...editForm, upiId: e.target.value })}
                        placeholder="merchant@okhdfcbank"
                        className="text-xs font-mono bg-white"
                        required
                      />
                      <p className="text-[10px] text-slate-400">Where customer UPI payments are directly transferred.</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Store Address & Neighborhood</label>
                    <textarea
                      rows={2}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">GPS Latitude</label>
                      <Input
                        type="number"
                        step="any"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">GPS Longitude</label>
                      <Input
                        type="number"
                        step="any"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-bold h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingShop}
                    className="bg-slate-900 text-white font-bold px-5 h-9 rounded-xl text-xs hover:bg-emerald-600 shadow-xs"
                  >
                    {savingShop ? "Saving Changes..." : "Save Profile & Shop Changes"}
                  </Button>
                </div>

                {/* Section C: Danger Zone */}
                <div className="pt-6 border-t border-rose-200 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Danger Zone</p>
                  <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-rose-950">Delete Registered Shop</p>
                      <p className="text-[10px] text-rose-700 mt-0.5">
                        Permanently delete this shop and all its catalog products, categories, and past orders.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeleteShop}
                      disabled={savingShop}
                      className="border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold h-8 px-3 rounded-xl gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Shop</span>
                    </Button>
                  </div>

                  <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-rose-950">Delete Entire Vendor Account</p>
                      <p className="text-[10px] text-rose-700 mt-0.5">
                        Permanently purge your vendor credentials, registered shop, and all records.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={savingShop}
                      className="text-xs font-bold h-8 px-3 rounded-xl gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Entire Account</span>
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Section 1: Sales & Financial Performance */}
        {shop && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Sales & Revenue Performance</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated strictly from verified bank payments (0% gateway fees)
                </p>
              </div>
              <Badge variant="success" className="text-xs font-bold py-1 px-3">
                Live Analytics
              </Badge>
            </div>

            {/* 4 Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                    <span>Today's Sales</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    ₹{parseFloat(sales.today || 0).toFixed(2)}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {sales.todayOrdersCount} verified order{sales.todayOrdersCount === 1 ? "" : "s"} today
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                    <span>This Week</span>
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    ₹{parseFloat(sales.weekly || 0).toFixed(2)}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">Last 7 rolling days</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                    <span>This Month</span>
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    ₹{parseFloat(sales.monthly || 0).toFixed(2)}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">Last 30 rolling days</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                    <span>Total Sales</span>
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    ₹{parseFloat(sales.total || 0).toFixed(2)}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {orderStatus.totalVerifiedOrders} lifetime completed sale{orderStatus.totalVerifiedOrders === 1 ? "" : "s"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Channel Ratio Bar */}
            <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                      <Zap className="w-3.5 h-3.5" />
                      <span>{orderStatus.pendingPaymentCount} UPI payments awaiting verification</span>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section 2: Action Control Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Products & Inventory Card */}
          <Link
            to="/vendor/products"
            className="group"
          >
            <Card className="h-full rounded-2xl border-slate-200/90 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between p-5 bg-white">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Box className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="font-bold text-[11px] bg-blue-50 text-blue-700">
                    {inventory.totalProducts} items
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition text-sm">
                  Products & Inventory
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Add products, set cost/selling prices, and update stock counts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Manage Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Card>
          </Link>

          {/* Categories Card */}
          <Link
            to="/vendor/categories"
            className="group"
          >
            <Card className="h-full rounded-2xl border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between p-5 bg-white">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <List className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="font-bold text-[11px] bg-indigo-50 text-indigo-700">
                    {inventory.totalCategories} categories
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-sm">
                  Categories
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Organize products into shop-specific categories.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Manage Categories</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Card>
          </Link>

          {/* Incoming Orders Card */}
          <Link
            to="/vendor/orders"
            className="group"
          >
            <Card className="h-full rounded-2xl border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between p-5 bg-white">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <Badge
                    variant={orderStatus.awaitingPickupCount > 0 ? "warning" : "success"}
                    className="font-bold text-[11px]"
                  >
                    {orderStatus.awaitingPickupCount} ready for pickup
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition text-sm">
                  Incoming Orders & Pickups
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Verify customer direct UPI payments and match pickup IDs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>View Order Queue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Card>
          </Link>

          {/* Walk-in POS Billing Card */}
          <Link
            to="/vendor/pos"
            className="group"
          >
            <Card className="h-full rounded-2xl border-slate-200/90 hover:border-purple-400 hover:shadow-md transition flex flex-col justify-between p-5 bg-white">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <Badge variant="purple" className="font-bold text-[11px]">
                    Quick POS
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition text-sm">
                  Walk-in POS Billing
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Point of sale counter terminal with instant receipt printing.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                <span>Open POS Counter</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Section 3: Recent Verified Sales Activity */}
        {recentSales.length > 0 && (
          <Card className="rounded-3xl border-slate-200/90 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-5 sm:p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Recent Sales Transactions</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Latest verified purchases and in-store walk-in orders
                </CardDescription>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate("/vendor/orders")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View all orders
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                      <TableHead className="py-3 px-6 font-bold">Order / Pickup ID</TableHead>
                      <TableHead className="py-3 px-4 font-bold">Channel</TableHead>
                      <TableHead className="py-3 px-4 font-bold">Customer</TableHead>
                      <TableHead className="py-3 px-4 font-bold">Items</TableHead>
                      <TableHead className="py-3 px-4 text-right font-bold">Amount</TableHead>
                      <TableHead className="py-3 px-6 text-right font-bold">Bill</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {recentSales.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50/70 transition">
                        <TableCell className="py-3.5 px-6 font-medium">
                          <span className="font-bold text-slate-900">{s.orderNumber}</span>
                          {s.pickupId && (
                            <span className="ml-2 text-[10px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200/60 inline-block">
                              {s.pickupId}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <Badge
                            variant={s.orderType === "ONLINE" ? "secondary" : "purple"}
                            className="text-[10px] font-bold uppercase py-0.5 px-2"
                          >
                            {s.orderType === "ONLINE" ? "Online" : "Walk-in"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {s.customerMobile}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            {s.itemCount} items
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right font-black text-slate-900">
                          ₹{parseFloat(s.totalAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3.5 px-6 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/vendor/orders")}
                            className="h-8 px-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-200 rounded-lg gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Receipt</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
