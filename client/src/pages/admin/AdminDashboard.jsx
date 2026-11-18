import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  isAdminAuthenticated,
  getAdminUser,
  adminLogout,
  getAdminStats,
  getAdminReports,
  updateReportStatus,
  getAdminShops,
  toggleShopStatus,
} from "../../services/adminService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("reports"); // "overview" | "reports" | "shops"

  // Data states
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Filter states
  const [reportFilter, setReportFilter] = useState("ALL");
  const [reportSearch, setReportSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [shopFilter, setShopFilter] = useState("all");

  // Report detail / editing state
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [statusInput, setStatusInput] = useState("PENDING");

  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, shopsRes] = await Promise.all([
        getAdminStats(),
        getAdminReports({ status: reportFilter, search: reportSearch }),
        getAdminShops({ status: shopFilter, search: shopSearch }),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
      if (shopsRes.success) setShops(shopsRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        adminLogout();
        navigate("/admin/login");
      } else {
        showToast("Failed to fetch admin data", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, reportFilter, reportSearch, shopFilter, shopSearch]);

  // Check auth
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    setAdmin(getAdminUser());
    loadAllData();
  }, [navigate, loadAllData]);

  // Trigger search / filters
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
        showToast("Report status updated successfully");
        setSelectedReport(res.data);
        // Refresh reports list & stats
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

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                ShopFlow <span className="text-indigo-400">Admin</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                MASTER PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={loadAllData}
              title="Refresh Live Data"
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors flex items-center space-x-1"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">
                {admin?.name || "Platform Admin"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {admin?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white px-3.5 py-1.5 rounded-lg border border-rose-500/30 transition-all font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 sm:space-x-4 border-t border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "reports"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>⚠️</span>
            <span>Reports & Misbehaviour Desk</span>
            {stats?.reports?.pending > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.reports.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("shops")}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "shops"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🏪</span>
            <span>Shop Moderation</span>
            <span className="text-xs text-slate-500">({shops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📊</span>
            <span>Platform Overview & KPIs</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {message.text && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold border animate-in slide-in-from-bottom-5 ${
            message.type === "error"
              ? "bg-rose-900/90 text-rose-100 border-rose-500"
              : "bg-emerald-900/90 text-emerald-100 border-emerald-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading admin resources...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: REPORTS & MISBEHAVIOUR */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Report & Incident Resolution Desk</span>
                      {stats?.reports?.pending > 0 && (
                        <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-normal">
                          {stats.reports.pending} pending action
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Investigate reported disputes, customer misbehaviour, or
                      vendor infractions
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap gap-2">
                    {["ALL", "PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"].map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => handleFilterReports(st)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                            reportFilter === st
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                          }`}
                        >
                          {st.replace("_", " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchReports} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by Report ID, subject, order # or keywords..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Search
                  </button>
                </form>

                {/* Reports List */}
                {reports.length === 0 ? (
                  <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-12 text-center">
                    <span className="text-4xl block mb-3">✅</span>
                    <h3 className="text-base font-bold text-white">
                      No reports found
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      No incident tickets match the selected filter.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                              {report.reportNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                report.reporterType === "CUSTOMER"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              BY {report.reporterType}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                report.status === "PENDING"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : report.status === "UNDER_REVIEW"
                                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                  : report.status === "RESOLVED"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              {report.status.replace("_", " ")}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(report.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white">
                            {report.subject}
                          </h3>

                          <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                            {report.reporterType === "CUSTOMER" && report.customer && (
                              <span>
                                <span className="text-slate-500">Reporter:</span>{" "}
                                <strong className="text-white">
                                  {report.customer.name}
                                </strong>{" "}
                                ({report.customer.mobile})
                              </span>
                            )}
                            {report.reporterType === "VENDOR" && report.vendor && (
                              <span>
                                <span className="text-slate-500">Reporter:</span>{" "}
                                <strong className="text-white">
                                  {report.vendor.name}
                                </strong>{" "}
                                ({report.vendor.mobile})
                              </span>
                            )}
                            {report.shop && (
                              <span>
                                <span className="text-slate-500">Shop:</span>{" "}
                                <strong className="text-white">
                                  {report.shop.name}
                                </strong>
                              </span>
                            )}
                            {report.orderNumber && (
                              <span>
                                <span className="text-slate-500">Order:</span>{" "}
                                <strong className="text-white">
                                  {report.orderNumber}
                                </strong>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2">
                            {report.description}
                          </p>

                          {report.adminNotes && (
                            <div className="text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40 text-slate-300 mt-2">
                              <span className="font-bold text-indigo-400 block mb-0.5">
                                Admin Resolution Note:
                              </span>
                              {report.adminNotes}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col items-center gap-2">
                          <button
                            onClick={() => handleOpenReport(report)}
                            className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                          >
                            Manage Ticket
                          </button>
                          {report.shop && (
                            <button
                              onClick={() =>
                                handleToggleShop(
                                  report.shop.id,
                                  report.shop.name,
                                  report.shop.isActive
                                )
                              }
                              className={`w-full text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                                report.shop.isActive
                                  ? "border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
                                  : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                              }`}
                            >
                              {report.shop.isActive
                                ? "Suspend Shop"
                                : "Activate Shop"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SHOP MODERATION */}
            {activeTab === "shops" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Shop Moderation & Registry
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Monitor all registered merchant storefronts, product
                      counts, and toggle platform active status
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {["all", "active", "inactive"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleFilterShops(st)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all uppercase ${
                          shopFilter === st
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shop Search Bar */}
                <form onSubmit={handleSearchShops} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by shop name, address, or vendor name..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Search
                  </button>
                </form>

                {/* Shops Table / Grid */}
                <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/90 text-slate-400 border-b border-slate-700 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-4">Shop Details</th>
                          <th className="py-3 px-4">Vendor Info</th>
                          <th className="py-3 px-4 text-center">Products</th>
                          <th className="py-3 px-4 text-center">Orders</th>
                          <th className="py-3 px-4 text-center">Reports</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Moderation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {shops.map((shop) => (
                          <tr
                            key={shop.id}
                            className="hover:bg-slate-750 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-sm">
                                {shop.name}
                              </div>
                              <div className="text-slate-400 text-[11px] truncate max-w-xs">
                                {shop.address || "No address provided"}
                              </div>
                              <div className="text-slate-500 text-[11px] font-mono">
                                {shop.phone}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-200">
                                {shop.vendor?.name}
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {shop.vendor?.email}
                              </div>
                              <div className="text-slate-500 text-[11px] font-mono">
                                {shop.vendor?.mobile}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                              {shop._count?.products || 0}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                              {shop._count?.orders || 0}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {shop._count?.reports > 0 ? (
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                                  {shop._count.reports}
                                </span>
                              ) : (
                                <span className="text-slate-500">0</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  shop.isActive
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}
                              >
                                {shop.isActive ? "ACTIVE" : "SUSPENDED"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() =>
                                  handleToggleShop(
                                    shop.id,
                                    shop.name,
                                    shop.isActive
                                  )
                                }
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                  shop.isActive
                                    ? "border-rose-500/50 text-rose-300 hover:bg-rose-600 hover:text-white"
                                    : "border-emerald-500/50 text-emerald-300 hover:bg-emerald-600 hover:text-white"
                                }`}
                              >
                                {shop.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PLATFORM OVERVIEW & KPIS */}
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Platform Operational Metrics
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time aggregated health statistics across all shops,
                    vendors, customers and orders
                  </p>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Revenue */}
                  <div className="bg-slate-800/70 border border-slate-700/60 p-5 rounded-2xl">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Sales (GMV)
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
                      ₹{stats.orders.totalRevenue.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      From {stats.orders.completed} completed orders
                    </div>
                  </div>

                  {/* Registered Shops */}
                  <div className="bg-slate-800/70 border border-slate-700/60 p-5 rounded-2xl">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Merchant Shops
                    </div>
                    <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                      {stats.shops.total}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex space-x-2">
                      <span className="text-emerald-400">
                        ● {stats.shops.active} Active
                      </span>
                      {stats.shops.inactive > 0 && (
                        <span className="text-rose-400">
                          ● {stats.shops.inactive} Suspended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total Customers */}
                  <div className="bg-slate-800/70 border border-slate-700/60 p-5 rounded-2xl">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Customers & Buyers
                    </div>
                    <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                      {stats.customers.total}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {stats.orders.total} total orders placed
                    </div>
                  </div>

                  {/* Pending Reports */}
                  <div className="bg-slate-800/70 border border-slate-700/60 p-5 rounded-2xl">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Incident Reports
                    </div>
                    <div className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">
                      {stats.reports.pending}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {stats.reports.total} total tickets registered
                    </div>
                  </div>
                </div>

                {/* Additional Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                      Order Fulfillment Ratio
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Orders:</span>
                        <strong className="text-white">
                          {stats.orders.total}
                        </strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">
                          Completed Orders:
                        </span>
                        <strong className="text-emerald-400">
                          {stats.orders.completed}
                        </strong>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{
                            width: `${
                              stats.orders.total > 0
                                ? Math.round(
                                    (stats.orders.completed /
                                      stats.orders.total) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 text-right">
                        {stats.orders.total > 0
                          ? Math.round(
                              (stats.orders.completed / stats.orders.total) *
                                100
                            )
                          : 0}
                        % completion rate
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                      Report Resolution Status
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-700/50">
                        <span className="text-amber-400">Pending:</span>
                        <span className="font-bold text-white">
                          {stats.reports.pending}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/50">
                        <span className="text-sky-400">Under Review:</span>
                        <span className="font-bold text-white">
                          {stats.reports.underReview}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-700/50">
                        <span className="text-emerald-400">Resolved:</span>
                        <span className="font-bold text-white">
                          {stats.reports.resolved}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Dismissed:</span>
                        <span className="font-bold text-white">
                          {stats.reports.dismissed}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Ticket Details & Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-750 px-6 py-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-indigo-400 font-bold block">
                  {selectedReport.reportNumber}
                </span>
                <h3 className="font-bold text-white text-base">
                  Ticket Resolution Console
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Subject
                </span>
                <p className="text-sm font-bold text-white">
                  {selectedReport.subject}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Description
                </span>
                <div className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-700 whitespace-pre-wrap">
                  {selectedReport.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/40 p-3 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-slate-500 block">Reporter Type</span>
                  <span className="font-bold text-white">
                    {selectedReport.reporterType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-bold text-white">
                    {selectedReport.category}
                  </span>
                </div>
                {selectedReport.shop && (
                  <div>
                    <span className="text-slate-500 block">Shop</span>
                    <span className="font-bold text-indigo-300">
                      {selectedReport.shop.name}
                    </span>
                  </div>
                )}
                {selectedReport.orderNumber && (
                  <div>
                    <span className="text-slate-500 block">Order #</span>
                    <span className="font-bold text-indigo-300">
                      {selectedReport.orderNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Update Form */}
              <div className="pt-2 border-t border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Update Ticket Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>

                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mt-3">
                  Admin Resolution Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes explaining resolution or disciplinary actions taken..."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-750 px-6 py-4 border-t border-slate-700 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveReportStatus}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Status & Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
