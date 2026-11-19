import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  RefreshCw,
  KeyRound,
  LogOut,
  AlertTriangle,
  Store,
  BarChart3,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  isAdminAuthenticated,
  getAdminUser,
  adminLogout,
  getAdminStats,
  getAdminReports,
  updateReportStatus,
  getAdminShops,
  toggleShopStatus,
  getAdminCustomers,
  toggleCustomerStatus,
  updateAdminPassword,
} from "../../services/adminService";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import ShopFlowRoleLogo from "../../components/ShopFlowRoleLogo";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("reports");

  // Data states
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [shops, setShops] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Filter states
  const [reportFilter, setReportFilter] = useState("ALL");
  const [reportSearch, setReportSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [shopFilter, setShopFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");

  // Report detail / editing state
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [statusInput, setStatusInput] = useState("PENDING");

  // Security / Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, shopsRes, customersRes] = await Promise.all([
        getAdminStats(),
        getAdminReports({ status: reportFilter, search: reportSearch }),
        getAdminShops({ status: shopFilter, search: shopSearch }),
        getAdminCustomers({ status: customerFilter, search: customerSearch }),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
      if (shopsRes.success) setShops(shopsRes.data);
      if (customersRes.success) setCustomers(customersRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        adminLogout();
        navigate("/admin/login");
      } else {
        showToast("Failed to fetch admin resources", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, reportFilter, reportSearch, shopFilter, shopSearch, customerFilter, customerSearch]);

  // Check auth
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    setAdmin(getAdminUser());
    loadAllData();
  }, [navigate, loadAllData]);

  const handleFilterReports = async (status) => {
    setReportFilter(status);
    try {
      const res = await getAdminReports({ status, search: reportSearch });
      if (res.success) setReports(res.data);
    } catch {
      showToast("Error filtering reports", "error");
    }
  };

  const handleSearchReports = async (e) => {
    e.preventDefault();
    try {
      const res = await getAdminReports({
        status: reportFilter,
        search: reportSearch,
      });
      if (res.success) setReports(res.data);
    } catch {
      showToast("Error searching reports", "error");
    }
  };

  const handleSearchShops = async (e) => {
    e.preventDefault();
    try {
      const res = await getAdminShops({
        status: shopFilter,
        search: shopSearch,
      });
      if (res.success) setShops(res.data);
    } catch {
      showToast("Error searching shops", "error");
    }
  };

  const handleFilterShops = async (filter) => {
    setShopFilter(filter);
    try {
      const res = await getAdminShops({
        status: filter,
        search: shopSearch,
      });
      if (res.success) setShops(res.data);
    } catch {
      showToast("Error filtering shops", "error");
    }
  };

  const handleOpenReport = (report) => {
    setSelectedReport(report);
    setStatusInput(report.status);
    setAdminNoteInput(report.adminNotes || "");
  };

  const handleSaveReportStatus = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      const res = await updateReportStatus(selectedReport.id, {
        status: statusInput,
        adminNotes: adminNoteInput,
      });
      if (res.success) {
        showToast("Ticket status updated successfully");
        setSelectedReport(res.data);
        const updatedReports = await getAdminReports({
          status: reportFilter,
          search: reportSearch,
        });
        if (updatedReports.success) setReports(updatedReports.data);
        const statsRes = await getAdminStats();
        if (statsRes.success) setStats(statsRes.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update report", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleShop = async (shopId, shopName, currentActive) => {
    const confirmAction = window.confirm(
      `Are you sure you want to ${
        currentActive ? "SUSPEND" : "ACTIVATE"
      } "${shopName}"?`
    );
    if (!confirmAction) return;

    try {
      const res = await toggleShopStatus(shopId);
      if (res.success) {
        showToast(res.message);
        const shopsRes = await getAdminShops({
          status: shopFilter,
          search: shopSearch,
        });
        if (shopsRes.success) setShops(shopsRes.data);
        const statsRes = await getAdminStats();
        if (statsRes.success) setStats(statsRes.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle shop status", "error");
    }
  };

  const handleToggleCustomerStatus = async (customerId, currentActive, mobile) => {
    const action = currentActive ? "suspend" : "activate";
    const confirmAction = window.confirm(
      `Are you sure you want to ${action} customer account (${mobile})? ${
        currentActive
          ? "The customer will be notified and will not be allowed to browse shops or place orders until further action is taken."
          : "The customer will be allowed to sign in and browse shops."
      }`
    );
    if (!confirmAction) return;

    try {
      const res = await toggleCustomerStatus(customerId);
      if (res.success) {
        showToast(res.message);
        const [custRes, statsRes] = await Promise.all([
          getAdminCustomers({ status: customerFilter, search: customerSearch }),
          getAdminStats(),
        ]);
        if (custRes.success) setCustomers(custRes.data);
        if (statsRes.success) setStats(statsRes.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle customer status", "error");
    }
  };

  const handleFilterCustomers = async (status) => {
    setCustomerFilter(status);
    try {
      const res = await getAdminCustomers({ status, search: customerSearch });
      if (res.success) setCustomers(res.data);
    } catch (err) {
      showToast("Failed to filter customers", "error");
    }
  };

  const handleSearchCustomers = async (e) => {
    e.preventDefault();
    try {
      const res = await getAdminCustomers({ status: customerFilter, search: customerSearch });
      if (res.success) setCustomers(res.data);
    } catch (err) {
      showToast("Failed to search customers", "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: "", type: "" });

    if (!currentPassword || !newPassword) {
      setPasswordMsg({ text: "Please enter all required fields", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: "New password must be at least 6 characters", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "New passwords do not match", type: "error" });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await updateAdminPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordMsg({ text: "Admin security password changed successfully!", type: "success" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setPasswordMsg({ text: "", type: "" });
        }, 1500);
      }
    } catch (err) {
      setPasswordMsg({
        text: err.response?.data?.message || "Failed to update password",
        type: "error",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <ShopFlowRoleLogo
            role="ADMIN"
            variant="dark"
            isDirty={showPasswordModal || !!selectedReport}
            customWarningMessage="You have an active admin modal or report review in progress. Do you want to leave without saving? Click Cancel to stay."
            onNavigate={() => {
              setShowPasswordModal(false);
              setSelectedReport(null);
            }}
          />

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              title="Refresh Live Data"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPasswordMsg({ text: "", type: "" });
                setShowPasswordModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Security</span>
            </Button>

            <div className="text-right hidden md:block px-2">
              <div className="text-xs font-bold text-white">
                {admin?.name || "Platform Admin"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {admin?.email}
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {message.text && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold border flex items-center gap-2 animate-in slide-in-from-bottom-5 ${
            message.type === "error"
              ? "bg-rose-950/95 text-rose-200 border-rose-600 shadow-rose-900/30"
              : "bg-emerald-950/95 text-emerald-200 border-emerald-600 shadow-emerald-900/30"
          }`}
        >
          {message.type === "error" ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {message.text}
        </div>
      )}

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-2xl">
              <TabsTrigger
                value="reports"
                className="gap-2 data-[state=active]:bg-rose-600 data-[state=active]:text-white text-slate-400"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Reports & Misbehaviour</span>
                {stats?.reports?.pending > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px] bg-rose-500">
                    {stats.reports.pending}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="shops"
                className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Shop Moderation</span>
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-slate-800 text-slate-300">
                  {shops.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="customers"
                className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Customer Accounts</span>
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-slate-800 text-slate-300">
                  {customers.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger
                value="overview"
                className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Metrics & KPIs</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: REPORTS & INCIDENTS DESK */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Incident Resolution Desk</span>
                  {stats?.reports?.pending > 0 && (
                    <Badge variant="warning" className="text-[11px]">
                      {stats.reports.pending} Pending Review
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Investigate customer complaints, merchant misbehaviour, or payment disputes
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"].map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={reportFilter === st ? "default" : "outline"}
                    onClick={() => handleFilterReports(st)}
                    className={`text-xs rounded-xl ${
                      reportFilter === st
                        ? "bg-indigo-600 text-white border-transparent"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchReports} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  type="text"
                  placeholder="Search by ticket #, subject, order # or keywords..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="pl-10 bg-slate-900/90 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500 rounded-xl"
                />
              </div>
              <Button type="submit" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl px-5">
                Search
              </Button>
            </form>

            {/* Reports List */}
            {reports.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800 text-center py-16">
                <CardContent className="space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Incident Reports</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    There are no unresolved tickets matching your current filter. The platform is running smoothly.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all shadow-sm"
                  >
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-800/60">
                            {report.reportNumber}
                          </span>
                          <Badge
                            variant={report.reporterType === "CUSTOMER" ? "info" : "success"}
                            className="text-[10px]"
                          >
                            BY {report.reporterType}
                          </Badge>
                          <Badge
                            variant={
                              report.status === "PENDING"
                                ? "warning"
                                : report.status === "UNDER_REVIEW"
                                ? "info"
                                : report.status === "RESOLVED"
                                ? "success"
                                : "outline"
                            }
                            className="text-[10px]"
                          >
                            {report.status.replace("_", " ")}
                          </Badge>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white tracking-tight">
                          {report.subject}
                        </h3>

                        <div className="text-xs text-slate-300 flex flex-wrap gap-x-5 gap-y-1.5 pt-1">
                          {report.reporterType === "CUSTOMER" && report.customer && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-slate-400">Reporter:</span>
                              <strong className="text-white font-mono">{report.customer.mobile}</strong>
                            </span>
                          )}
                          {report.reporterType === "VENDOR" && report.vendor && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-slate-400">Reporter:</span>
                              <strong className="text-white">{report.vendor.ownerName || report.vendor.mobile}</strong>
                            </span>
                          )}
                          {report.shop && (
                            <span className="flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-slate-400">Shop:</span>
                              <strong className="text-indigo-300">{report.shop.shopName}</strong>
                            </span>
                          )}
                          {report.orderNumber && (
                            <span className="flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-slate-400">Order:</span>
                              <strong className="text-indigo-300 font-mono">{report.orderNumber}</strong>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                          {report.description}
                        </p>

                        {report.adminNotes && (
                          <div className="text-xs bg-indigo-950/30 p-3 rounded-xl border border-indigo-900/40 text-indigo-200">
                            <span className="font-bold text-indigo-400 block mb-1">
                              Admin Resolution Notes:
                            </span>
                            {report.adminNotes}
                          </div>
                        )}
                      </div>

                      {/* Ticket Actions */}
                      <div className="flex md:flex-col items-stretch gap-2 shrink-0 md:w-36">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenReport(report)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold w-full rounded-xl"
                        >
                          Manage Ticket
                        </Button>
                        {report.shop && (
                          <Button
                            variant={report.shop.isActive ? "destructive" : "success"}
                            size="sm"
                            onClick={() =>
                              handleToggleShop(
                                report.shop.id,
                                report.shop.shopName,
                                report.shop.isActive
                              )
                            }
                            className={`w-full rounded-xl text-[11px] font-bold ${
                              report.shop.isActive
                                ? "bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30"
                                : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30"
                            }`}
                          >
                            {report.shop.isActive ? "Suspend Shop" : "Activate Shop"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: SHOP MODERATION */}
          <TabsContent value="shops" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Shop Moderation Directory
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Oversee all registered merchant storefronts, product catalogs, and enforcement actions
                </p>
              </div>

              <div className="flex gap-2">
                {["all", "active", "inactive"].map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={shopFilter === st ? "default" : "outline"}
                    onClick={() => handleFilterShops(st)}
                    className={`text-xs rounded-xl uppercase font-bold ${
                      shopFilter === st
                        ? "bg-indigo-600 text-white border-transparent"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </Button>
                ))}
              </div>
            </div>

            {/* Shop Search Bar */}
            <form onSubmit={handleSearchShops} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  type="text"
                  placeholder="Search by shop name, address, or vendor name..."
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  className="pl-10 bg-slate-900/90 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500 rounded-xl"
                />
              </div>
              <Button type="submit" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl px-5">
                Search
              </Button>
            </form>

            {/* Shops Table */}
            <Card className="bg-slate-900/60 border-slate-800 overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-900 border-b border-slate-800">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 py-3.5">Storefront Details</TableHead>
                    <TableHead className="text-slate-400 py-3.5">Vendor Account</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Products</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Orders</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Reports</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Status</TableHead>
                    <TableHead className="text-slate-400 text-right py-3.5">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800/60">
                  {shops.map((shop) => (
                    <TableRow key={shop.id} className="border-slate-800/60 hover:bg-slate-850/50">
                      <TableCell className="py-4">
                        <div className="font-bold text-white text-sm">
                          {shop.shopName}
                        </div>
                        <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 max-w-xs truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{shop.address || "No address provided"}</span>
                        </div>
                        <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{shop.contactNumber}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="font-semibold text-slate-200 text-xs">
                          {shop.vendor?.ownerName}
                        </div>
                        <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{shop.vendor?.email || "No email"}</span>
                        </div>
                        <div className="text-slate-400 text-xs font-mono mt-0.5">
                          {shop.vendor?.mobile}
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-bold text-slate-200">
                        {shop._count?.products || 0}
                      </TableCell>

                      <TableCell className="text-center font-bold text-slate-200">
                        {shop._count?.orders || 0}
                      </TableCell>

                      <TableCell className="text-center">
                        {shop._count?.reports > 0 ? (
                          <Badge variant="destructive" className="font-bold text-xs">
                            {shop._count.reports}
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">0</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={shop.isActive ? "success" : "destructive"}
                          className="font-bold text-[10px] tracking-wide"
                        >
                          {shop.isActive ? "ACTIVE" : "SUSPENDED"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant={shop.isActive ? "destructive" : "success"}
                          size="sm"
                          onClick={() =>
                            handleToggleShop(
                              shop.id,
                              shop.shopName,
                              shop.isActive
                            )
                          }
                          className="rounded-xl text-xs font-semibold"
                        >
                          {shop.isActive ? "Suspend" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB: CUSTOMER ACCOUNTS MODERATION */}
          <TabsContent value="customers" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Customer Account Governance</span>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                    {customers.length} Accounts
                  </Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage consumer privileges, view verification statuses, and suspend abusive accounts
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "inactive" },
                ].map((st) => (
                  <Button
                    key={st.value}
                    size="sm"
                    variant={customerFilter === st.value ? "default" : "outline"}
                    onClick={() => handleFilterCustomers(st.value)}
                    className={`rounded-xl text-xs font-semibold ${
                      customerFilter === st.value
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Customer Search Bar */}
            <form onSubmit={handleSearchCustomers} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <Input
                  type="text"
                  placeholder="Search by customer mobile number or registered email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 bg-slate-900/90 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-indigo-500 rounded-xl"
                />
              </div>
              <Button type="submit" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl px-5">
                Search
              </Button>
            </form>

            {/* Customers Table */}
            <Card className="bg-slate-900/60 border-slate-800 overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-900 border-b border-slate-800">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 py-3.5">Customer Identity</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Verification</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Orders Placed</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Reports Filed</TableHead>
                    <TableHead className="text-slate-400 py-3.5">Joined</TableHead>
                    <TableHead className="text-slate-400 text-center py-3.5">Status</TableHead>
                    <TableHead className="text-slate-400 text-right py-3.5">Moderation Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800/60">
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                        No customer accounts found matching criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((cust) => (
                      <TableRow key={cust.id} className="border-slate-800/60 hover:bg-slate-850/50">
                        <TableCell className="py-4">
                          <div className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{cust.mobile}</span>
                          </div>
                          <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{cust.email || "No email registered"}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {cust.mobileVerified ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                Phone Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
                                Phone Unverified
                              </Badge>
                            )}
                            {cust.email && (
                              cust.emailVerified ? (
                                <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30">
                                  Email Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  Email Pending
                                </Badge>
                              )
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-bold text-slate-200">
                          {cust._count?.orders || 0}
                        </TableCell>

                        <TableCell className="text-center">
                          {cust._count?.reports > 0 ? (
                            <Badge variant="destructive" className="font-bold text-xs">
                              {cust._count.reports}
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-xs">0</span>
                          )}
                        </TableCell>

                        <TableCell className="text-slate-400 text-xs">
                          {new Date(cust.createdAt).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant={cust.isActive !== false ? "success" : "destructive"}
                            className="font-bold text-[10px] tracking-wide"
                          >
                            {cust.isActive !== false ? "ACTIVE" : "SUSPENDED"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant={cust.isActive !== false ? "destructive" : "success"}
                            size="sm"
                            onClick={() =>
                              handleToggleCustomerStatus(
                                cust.id,
                                cust.isActive !== false,
                                cust.mobile
                              )
                            }
                            className="rounded-xl text-xs font-semibold"
                          >
                            {cust.isActive !== false ? "Suspend Customer" : "Activate Customer"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: PLATFORM OVERVIEW & KPIS */}
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Platform Operational Overview
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time aggregated health statistics across all shops, vendors, customers and orders
              </p>
            </div>

            {stats && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Revenue */}
                  <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Total Volume (GMV)
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                      ₹{stats.orders.totalRevenue.toLocaleString("en-IN")}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      From {stats.orders.completed} verified store pickups
                    </p>
                  </Card>

                  {/* Registered Shops */}
                  <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Merchant Storefronts
                      </span>
                      <Store className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2 font-mono">
                      {stats.shops.total}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex space-x-2">
                      <span className="text-emerald-400 font-semibold">
                        ● {stats.shops.active} Active
                      </span>
                      {stats.shops.inactive > 0 && (
                        <span className="text-rose-400 font-semibold">
                          ● {stats.shops.inactive} Suspended
                        </span>
                      )}
                    </div>
                  </Card>

                  {/* Customers */}
                  <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Verified Buyers
                      </span>
                      <Users className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2 font-mono">
                      {stats.customers.total}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {stats.orders.total} total pickup orders placed
                    </p>
                  </Card>

                  {/* Incident Reports */}
                  <Card className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Incident Reports
                      </span>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
                      {stats.reports.pending}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {stats.reports.total} total tickets registered
                    </p>
                  </Card>
                </div>

                {/* Additional KPI breakdown cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Fulfillment Performance
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Orders Placed:</span>
                        <strong className="text-white font-mono">{stats.orders.total}</strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Successfully Picked Up:</span>
                        <strong className="text-emerald-400 font-mono">{stats.orders.completed}</strong>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{
                            width: `${
                              stats.orders.total > 0
                                ? Math.round((stats.orders.completed / stats.orders.total) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 text-right">
                        {stats.orders.total > 0
                          ? Math.round((stats.orders.completed / stats.orders.total) * 100)
                          : 0}
                        % completion rate
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Ticket Resolution Breakdown
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                        <span className="text-amber-400">Pending Actions:</span>
                        <strong className="text-white font-mono">{stats.reports.pending}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                        <span className="text-sky-400">Under Review:</span>
                        <strong className="text-white font-mono">{stats.reports.underReview}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                        <span className="text-emerald-400">Resolved Cases:</span>
                        <strong className="text-white font-mono">{stats.reports.resolved}</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Dismissed:</span>
                        <strong className="text-white font-mono">{stats.reports.dismissed}</strong>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Ticket Management Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg" onClose={() => setSelectedReport(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                {selectedReport?.reportNumber}
              </span>
            </div>
            <DialogTitle className="text-white text-base font-bold">
              Ticket Resolution Console
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Review details and record disciplinary or resolution actions
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Subject
                </span>
                <p className="text-sm font-bold text-white">{selectedReport.subject}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Reporter</span>
                  <span className="font-bold text-white">{selectedReport.reporterType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-bold text-white">{selectedReport.category}</span>
                </div>
                {selectedReport.shop && (
                  <div>
                    <span className="text-slate-500 block">Shop</span>
                    <span className="font-bold text-indigo-300">{selectedReport.shop.shopName}</span>
                  </div>
                )}
                {selectedReport.orderNumber && (
                  <div>
                    <span className="text-slate-500 block">Order #</span>
                    <span className="font-bold text-indigo-300 font-mono">{selectedReport.orderNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Update Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>

                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mt-3">
                  Admin Resolution Notes
                </label>
                <Textarea
                  rows={3}
                  placeholder="Notes explaining resolution or disciplinary actions taken..."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-800 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReport(null)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={actionLoading}
              onClick={handleSaveReportStatus}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              {actionLoading ? "Saving..." : "Save Status & Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md" onClose={() => setShowPasswordModal(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-5 h-5 text-indigo-400" />
            </div>
            <DialogTitle className="text-white text-base font-bold">
              Change Master Security Password
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Update your administrator credentials for platform governance
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  passwordMsg.type === "error"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                New Password (min 6 characters)
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500"
              />
            </div>

            <DialogFooter className="border-t border-slate-800 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordLoading}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={passwordLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
