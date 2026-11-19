import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  LogOut,
  ShoppingBag,
  Clock,
  Search,
  Copy,
  Check,
  Printer,
  MapPin,
  Package,
  RefreshCw,
  User,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  customerGetMe,
  customerUpdateProfile,
  customerDeleteAccount,
  customerSendEmailOtp,
  customerVerifyEmailOtp,
  customerSendPhoneOtp,
  customerVerifyPhoneOtp,
  logout,
} from "../../services/authService";
import { getCustomerOrders } from "../../services/orderService";
import { getCustomerDashboardSummary } from "../../services/dashboardService";
import BillModal from "../../components/BillModal";
import ReportIssueModal from "../../components/ReportIssueModal";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Alert, AlertDescription } from "../../components/ui/alert";

function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [activeBill, setActiveBill] = useState(null);

  // Profile Edit & Settings Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpDevCode, setEmailOtpDevCode] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newMobile, setNewMobile] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneOtpDevCode, setPhoneOtpDevCode] = useState("");
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [reportModalData, setReportModalData] = useState({
    isOpen: false,
    shopId: null,
    shopName: null,
    orderNumber: "",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const fetchDashboardData = useCallback(async () => {
    try {
      const [meRes, ordersRes, sumRes] = await Promise.all([
        customerGetMe().catch(() => null),
        getCustomerOrders().catch(() => ({ orders: [] })),
        getCustomerDashboardSummary().catch(() => ({ summary: null })),
      ]);

      if (meRes?.customer) {
        setCustomer(meRes.customer);
      } else {
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) setCustomer(JSON.parse(cachedUser));
      }

      setOrders(ordersRes?.orders || []);
      setSummary(sumRes?.summary || null);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "CUSTOMER") {
      navigate("/customer/login");
      return;
    }

    fetchDashboardData();

    const handleFocus = () => fetchDashboardData();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
    };
  }, [navigate, fetchDashboardData, location.key]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = () => {
    logout();
    navigate("/customer/login");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMsg({ type: "", text: "" });
      const res = await customerUpdateProfile({ email: profileForm.email });
      setCustomer(res.customer);
      localStorage.setItem("user", JSON.stringify(res.customer));
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendEmailOtp = async () => {
    const targetEmail = (profileForm.email || customer?.email || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setProfileMsg({ type: "error", text: "Please enter a valid email address first." });
      return;
    }
    try {
      setSendingEmailOtp(true);
      setProfileMsg({ type: "", text: "" });
      const res = await customerSendEmailOtp({ email: targetEmail });
      setEmailOtpSent(true);
      setEmailOtpDevCode(res.devCode || "");
      setProfileMsg({
        type: "success",
        text: res.message || `Verification code sent to ${targetEmail}`,
      });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to send verification code.",
      });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const targetEmail = (profileForm.email || customer?.email || "").trim();
    if (!emailOtpCode.trim()) {
      setProfileMsg({ type: "error", text: "Please enter the 6-digit verification code." });
      return;
    }
    try {
      setVerifyingEmailOtp(true);
      setProfileMsg({ type: "", text: "" });
      const res = await customerVerifyEmailOtp({
        email: targetEmail,
        code: emailOtpCode.trim(),
      });
      setCustomer(res.customer);
      localStorage.setItem("user", JSON.stringify(res.customer));
      setEmailOtpSent(false);
      setEmailOtpCode("");
      setEmailOtpDevCode("");
      setProfileMsg({
        type: "success",
        text: "Email verified successfully! You can now log in using either your mobile number or this verified email.",
      });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to verify email code.",
      });
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!newMobile || !/^\d{10}$/.test(newMobile.trim())) {
      setProfileMsg({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      return;
    }
    if (newMobile.trim() === customer?.mobile) {
      setProfileMsg({ type: "error", text: "New mobile number must be different from your current number." });
      return;
    }
    try {
      setSendingPhoneOtp(true);
      setProfileMsg({ type: "", text: "" });
      const res = await customerSendPhoneOtp({ newMobile: newMobile.trim() });
      setPhoneOtpSent(true);
      setPhoneOtpDevCode(res.devCode || "");
      setProfileMsg({
        type: "success",
        text: res.message || `Verification code sent to ${newMobile.trim()}`,
      });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to send verification code.",
      });
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpCode.trim()) {
      setProfileMsg({ type: "error", text: "Please enter the 6-digit verification code." });
      return;
    }
    try {
      setVerifyingPhoneOtp(true);
      setProfileMsg({ type: "", text: "" });
      const res = await customerVerifyPhoneOtp({
        newMobile: newMobile.trim(),
        code: phoneOtpCode.trim(),
      });
      setCustomer(res.customer);
      localStorage.setItem("user", JSON.stringify(res.customer));
      setEditingPhone(false);
      setPhoneOtpSent(false);
      setPhoneOtpCode("");
      setPhoneOtpDevCode("");
      setNewMobile("");
      setProfileMsg({
        type: "success",
        text: "Phone number updated and verified successfully! You can now use your new number to sign in.",
      });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to verify phone number.",
      });
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Type "DELETE" to permanently delete your customer account and clear your data:'
    );
    if (confirmation !== "DELETE") {
      if (confirmation !== null) alert("Confirmation did not match. Account was not deleted.");
      return;
    }

    try {
      setSavingProfile(true);
      await customerDeleteAccount();
      logout();
      alert("Your customer account has been permanently deleted.");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete account.");
    } finally {
      setSavingProfile(false);
    }
  };

  const copyPickupId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === "AWAITING_PICKUP");
  const pastOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-3">
          <Link
            to="/customer/dashboard"
            className="text-slate-900 font-black text-xl tracking-tight flex items-center gap-2 group"
          >
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-black shadow-xs group-hover:scale-105 transition">
              🛍️
            </span>
            <span className="hidden sm:inline">ShopFlow</span>
            <Badge variant="success" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2">
              Customer
            </Badge>
          </Link>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 w-9 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
          </Button>

          <div className="text-right hidden md:block px-2">
            <p className="text-xs font-bold text-slate-800 font-mono">{customer?.mobile}</p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3" /> {customer?.emailVerified ? "Mobile & Email Verified" : "Mobile Verified"}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setReportModalData({
                isOpen: true,
                shopId: null,
                shopName: null,
                orderNumber: "",
              })
            }
            className="h-9 text-rose-700 bg-rose-50/80 hover:bg-rose-100 border-rose-200 text-xs font-bold rounded-xl gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Issue</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setProfileForm({ email: customer?.email || "" });
              setProfileMsg({ type: "", text: "" });
              setShowProfileModal(true);
            }}
            className="h-9 text-slate-700 hover:bg-slate-100 border-slate-200 text-xs font-bold rounded-xl gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Profile</span>
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
        {/* Banner to Discover Shops */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 sm:p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs font-bold border-0">
                Explore Local Stores
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Find shops near your current location
              </h2>
              <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
                Browse products from your favorite neighborhood vendor, pay securely through your preferred UPI app, and pick up using your unique Pickup ID.
              </p>
            </div>
            <Button
              onClick={() => navigate("/shops")}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-black px-6 h-12 rounded-2xl shadow-md text-sm gap-2 shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4 text-emerald-700" />
              <span>Discover Shops</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {/* Subtle background ambient shape */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        </div>

        {/* Customer Shopping Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-200/80 shadow-2xs bg-white">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                  ₹{parseFloat(summary.totalSpent || 0).toFixed(2)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Across local stores</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-amber-200/70 shadow-2xs bg-amber-50/30">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Active Pickups</p>
                <h3 className="text-2xl font-black text-amber-700 mt-1 tracking-tight">
                  {summary.activePickupsCount}
                </h3>
                <p className="text-[11px] text-amber-700/80 mt-0.5">Ready at counters</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-emerald-200/70 shadow-2xs bg-emerald-50/30">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Completed Orders</p>
                <h3 className="text-2xl font-black text-emerald-700 mt-1 tracking-tight">
                  {summary.completedCount}
                </h3>
                <p className="text-[11px] text-emerald-700/80 mt-0.5">Collected purchases</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-blue-200/70 shadow-2xs bg-blue-50/30">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Shops Visited</p>
                <h3 className="text-2xl font-black text-blue-700 mt-1 tracking-tight">
                  {summary.shopsCount}
                </h3>
                <p className="text-[11px] text-blue-700/80 mt-0.5">Supported vendors</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section 1: Active Pickup Orders */}
        <Card className="rounded-3xl border-slate-200/90 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-5 sm:p-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900">Active Pickup Orders</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Orders ready for verification or waiting for counter pickup
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" className="font-bold text-xs px-2.5 py-1">
              {activeOrders.length} Ready
            </Badge>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            {activeOrders.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <p className="font-bold text-slate-700 text-sm">No active pickup orders</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Browse nearby shops and order groceries or essentials online!
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/shops")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-4 gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Browse Shops Now</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {activeOrders.map((o) => (
                  <div
                    key={o.id}
                    className="border border-slate-200/90 rounded-2xl p-5 bg-gradient-to-b from-white to-slate-50/60 flex flex-col justify-between shadow-2xs space-y-4 hover:border-slate-300 transition"
                  >
                    <div>
                      {/* Shop Header & Order Number */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-black text-slate-900 text-base leading-snug">
                            {o.shop?.shopName}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="line-clamp-1">{o.shop?.address}</span>
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold border border-slate-200">
                          {o.orderNumber}
                        </span>
                      </div>

                      {/* Pickup ID or Verification Notice */}
                      {o.pickupId ? (
                        <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                              Counter Pickup ID
                            </p>
                            <p className="text-2xl font-mono font-black text-emerald-400 tracking-wider mt-0.5">
                              {o.pickupId}
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyPickupId(o.pickupId)}
                            className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 px-3 rounded-lg border-0 gap-1.5"
                          >
                            {copiedId === o.pickupId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="font-semibold text-[11px]">
                              {copiedId === o.pickupId ? "Copied" : "Copy"}
                            </span>
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-purple-900 text-xs space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-purple-950">
                            ⏳ Direct UPI Payment Awaiting Merchant Verification
                          </p>
                          <p className="text-[11px] text-purple-700 leading-relaxed">
                            The shopkeeper is matching your transaction reference in their UPI/bank account. Your unique Pickup ID will appear here once verified.
                          </p>
                        </div>
                      )}

                      {/* Item list */}
                      <div className="mt-4 divide-y divide-slate-100 text-xs bg-white rounded-xl p-3 border border-slate-100">
                        {o.items?.map((item) => (
                          <div key={item.id} className="py-1.5 flex justify-between text-slate-600 first:pt-0 last:pb-0">
                            <span>
                              {item.productName} <span className="text-slate-400 font-mono">× {item.quantity} {item.unit}</span>
                            </span>
                            <span className="font-bold text-slate-800">
                              ₹{parseFloat(item.lineTotal || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Total Paid & Quick Action Buttons */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</p>
                        <p className="text-lg font-black text-emerald-700">
                          ₹{parseFloat(o.totalAmount || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setReportModalData({
                              isOpen: true,
                              shopId: o.shop?.id,
                              shopName: o.shop?.name || o.shop?.shopName,
                              orderNumber: o.orderNumber,
                            })
                          }
                          className="h-8 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold px-2 rounded-lg"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-500 mr-1" />
                          <span>Report</span>
                        </Button>

                        {o.bill && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setActiveBill({
                                ...o.bill,
                                orderNumber: o.orderNumber,
                                pickupId: o.pickupId,
                                shop: o.shop,
                                items: o.items,
                                totalAmount: o.totalAmount,
                                status: o.status,
                                payment: o.payment,
                              })
                            }
                            className="h-8 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 rounded-lg text-xs font-bold gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Receipt</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Order History & Completed Receipts */}
        <Card className="rounded-3xl border-slate-200/90 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-5 sm:p-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900">Order History & Receipts</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Completed orders and printable purchase receipts
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-slate-600 font-semibold text-xs">
              {pastOrders.length} Past Order{pastOrders.length === 1 ? "" : "s"}
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {pastOrders.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700 text-sm">No past orders found</p>
                <p className="text-xs text-slate-400">
                  Completed purchases and downloadable bills will show up here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                      <TableHead className="py-3 px-6 font-bold">Order / Pickup ID</TableHead>
                      <TableHead className="py-3 px-4 font-bold">Shop</TableHead>
                      <TableHead className="py-3 px-4 font-bold">Date Completed</TableHead>
                      <TableHead className="py-3 px-4 font-bold">Items</TableHead>
                      <TableHead className="py-3 px-4 text-right font-bold">Amount</TableHead>
                      <TableHead className="py-3 px-6 text-right font-bold">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {pastOrders.map((o) => (
                      <TableRow key={o.id} className="hover:bg-slate-50/70 transition">
                        <TableCell className="py-3.5 px-6 font-medium text-slate-900">
                          <p className="font-bold text-slate-900">{o.orderNumber}</p>
                          {o.pickupId && (
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200/60 inline-block mt-0.5">
                              {o.pickupId}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 font-semibold text-slate-800">
                          {o.shop?.shopName}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-slate-500">
                          {o.completedAt
                            ? new Date(o.completedAt).toLocaleDateString()
                            : new Date(o.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            {o.items?.length || 0} item{o.items?.length === 1 ? "" : "s"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right font-black text-slate-900">
                          ₹{parseFloat(o.totalAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3.5 px-6 text-right">
                          {o.bill ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setActiveBill({
                                  ...o.bill,
                                  orderNumber: o.orderNumber,
                                  pickupId: o.pickupId,
                                  shop: o.shop,
                                  items: o.items,
                                  totalAmount: o.totalAmount,
                                  status: o.status,
                                  payment: o.payment,
                                })
                              }
                              className="h-8 px-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-200 rounded-lg gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              <span>Bill</span>
                            </Button>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Printable Compact Bill Modal */}
      {activeBill && (
        <BillModal bill={activeBill} onClose={() => setActiveBill(null)} />
      )}

      {/* Customer Profile & Settings Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-md p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                👤
              </div>
              <DialogTitle className="text-lg font-black text-slate-900">Customer Profile</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Manage your verified customer details and communication preferences.
            </DialogDescription>
          </DialogHeader>

          {profileMsg.text && (
            <Alert
              variant={profileMsg.type === "success" ? "success" : "destructive"}
              className="py-2.5 text-xs font-medium"
            >
              <AlertDescription className="flex items-center gap-1.5">
                {profileMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{profileMsg.text}</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Registered Mobile Number
                </label>
                <div className="flex items-center gap-1.5">
                  <Badge variant={customer?.mobileVerified ? "success" : "warning"} className="text-[10px] font-bold gap-1 py-0 px-2">
                    <ShieldCheck className="w-3 h-3" /> {customer?.mobileVerified ? "Verified" : "Unverified"}
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
                    className="h-6 px-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                  >
                    {editingPhone ? "Cancel Change" : "Change Number"}
                  </Button>
                </div>
              </div>

              {!editingPhone ? (
                <Input
                  type="text"
                  disabled
                  value={customer?.mobile || ""}
                  className="bg-slate-100 border-slate-200 font-mono text-xs cursor-not-allowed text-slate-600"
                />
              ) : (
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
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
                        onClick={handleSendPhoneOtp}
                        disabled={sendingPhoneOtp || newMobile.length !== 10}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3 rounded-xl shrink-0"
                      >
                        {sendingPhoneOtp ? "Sending..." : "Send OTP"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSendPhoneOtp}
                        disabled={sendingPhoneOtp}
                        className="text-xs h-9 px-2 text-slate-600"
                      >
                        Resend
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    A 6-digit OTP will be sent to verify your new number. After change, you must use this verified number to log in.
                  </p>

                  {phoneOtpSent && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-950">Enter Verification Code</span>
                        {phoneOtpDevCode && (
                          <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
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
                          className="text-xs bg-white border-emerald-300 h-8 font-mono tracking-widest text-center"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleVerifyPhoneOtp}
                          disabled={verifyingPhoneOtp || !phoneOtpCode.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0"
                        >
                          {verifyingPhoneOtp ? "Verifying..." : "Verify & Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Email Address
                </label>
                {customer?.email && customer?.emailVerified && customer?.email.toLowerCase() === profileForm.email.toLowerCase() ? (
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
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="e.g. customer@example.com"
                  className="text-xs border-slate-300 flex-1"
                />
                {(!customer?.emailVerified || customer?.email !== profileForm.email) && profileForm.email && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendEmailOtp}
                    disabled={sendingEmailOtp}
                    className="text-xs font-bold h-9 px-3 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"
                  >
                    {sendingEmailOtp ? "Sending..." : "Verify (Optional)"}
                  </Button>
                )}
              </div>

              <p className="text-[10px] text-slate-400">
                {customer?.emailVerified && customer?.email.toLowerCase() === profileForm.email.toLowerCase()
                  ? "✓ Verified email can be used alongside your mobile number to sign in."
                  : "Optional: Verify your email to enable dual sign-in with email and password."}
              </p>

              {/* OTP Verification Box */}
              {emailOtpSent && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950">Enter 6-Digit Email Code</span>
                    {emailOtpDevCode && (
                      <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
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
                      className="text-xs bg-white border-emerald-200 h-8 font-mono tracking-widest text-center"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleVerifyEmailOtp}
                      disabled={verifyingEmailOtp || !emailOtpCode.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0"
                    >
                      {verifyingEmailOtp ? "Verifying..." : "Confirm OTP"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProfileModal(false)}
                className="text-xs font-bold h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingProfile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </DialogFooter>
          </form>

          {/* Danger Zone: Delete Profile */}
          <div className="pt-4 mt-2 border-t border-rose-100 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Danger Zone
            </p>
            <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-rose-950">Delete Customer Account</p>
                <p className="text-[10px] text-rose-700 mt-0.5">
                  Permanently delete your profile and personal data.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={savingProfile}
                className="h-8 text-xs font-bold px-3 rounded-xl gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Incident / Misbehaviour Report Modal */}
      <ReportIssueModal
        isOpen={reportModalData.isOpen}
        onClose={() =>
          setReportModalData({
            isOpen: false,
            shopId: null,
            shopName: null,
            orderNumber: "",
          })
        }
        shopId={reportModalData.shopId}
        shopName={reportModalData.shopName}
        orderNumber={reportModalData.orderNumber}
      />
    </div>
  );
}

export default CustomerDashboard;
