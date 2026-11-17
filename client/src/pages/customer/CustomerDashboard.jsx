import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiLogOut,
  FiShoppingBag,
  FiClock,
  FiSearch,
  FiCopy,
  FiCheck,
  FiPrinter,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import { customerGetMe, logout } from "../../services/authService";
import { getCustomerOrders } from "../../services/orderService";
import BillModal from "../../components/BillModal";

function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [activeBill, setActiveBill] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      const [meRes, ordersRes] = await Promise.all([
        customerGetMe().catch(() => null),
        getCustomerOrders().catch(() => ({ orders: [] })),
      ]);

      if (meRes?.customer) {
        setCustomer(meRes.customer);
      } else {
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) setCustomer(JSON.parse(cachedUser));
      }

      setOrders(ordersRes?.orders || []);
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
  }, [navigate, fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = () => {
    logout();
    navigate("/customer/login");
  };

  const copyPickupId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading customer account...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === "AWAITING_PICKUP");
  const pastOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2"
          >
            <span>🛍️</span> ShopFlow{" "}
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
              Customer
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-slate-500 hover:text-slate-800 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Orders"
          >
            <FiRefreshCw size={15} className={refreshing ? "animate-spin text-emerald-600" : ""} />
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{customer?.mobile}</p>
            <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
              ✓ Mobile Verified
            </span>
          </div>
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
        {/* Banner to Discover Shops */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              Explore Local Stores
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
              Find shops near your current location
            </h2>
            <p className="mt-2 text-white/85 text-xs sm:text-sm max-w-xl leading-relaxed">
              Browse products from your favorite neighborhood vendor, pay securely through your preferred UPI app, and pick up using your unique Pickup ID.
            </p>
          </div>
          <button
            onClick={() => navigate("/shops")}
            className="bg-white text-emerald-800 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition shadow-sm flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer"
          >
            <FiSearch size={18} /> Discover Shops
          </button>
        </div>

        {/* Section 1: Active Pickup Orders */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <FiShoppingBag size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">Active Pickup Orders</h3>
                <p className="text-xs text-slate-400">
                  Orders waiting for store counter pickup
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              {activeOrders.length} Ready
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
              <FiPackage size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No active pickup orders</p>
              <p className="text-xs text-slate-400 mt-1">
                Browse nearby shops and order your groceries or essentials online!
              </p>
              <button
                onClick={() => navigate("/shops")}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Browse Shops Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((o) => (
                <div
                  key={o.id}
                  className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 flex flex-col justify-between shadow-2xs space-y-4"
                >
                  <div>
                    {/* Header: Shop & Order Meta */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">
                          {o.shop?.shopName}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <FiMapPin size={12} className="text-emerald-600 shrink-0" />
                          <span className="line-clamp-1">{o.shop?.address}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {o.orderNumber}
                      </span>
                    </div>

                    {/* Big Highlight: Pickup ID */}
                    <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Counter Pickup ID
                        </p>
                        <p className="text-2xl font-mono font-black text-emerald-400 tracking-wider mt-0.5">
                          {o.pickupId || "PENDING"}
                        </p>
                      </div>
                      {o.pickupId && (
                        <button
                          onClick={() => copyPickupId(o.pickupId)}
                          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Copy Pickup ID"
                        >
                          {copiedId === o.pickupId ? (
                            <FiCheck className="text-emerald-400" size={16} />
                          ) : (
                            <FiCopy size={16} />
                          )}
                          <span className="text-[11px] font-semibold">
                            {copiedId === o.pickupId ? "Copied" : "Copy"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Item list */}
                    <div className="mt-3 divide-y divide-slate-100 text-xs">
                      {o.items?.map((item) => (
                        <div key={item.id} className="py-1.5 flex justify-between text-slate-600">
                          <span>
                            {item.productName} × {item.quantity} {item.unit}
                          </span>
                          <span className="font-bold text-slate-800">
                            ₹{item.lineTotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Total & Bill Button */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</p>
                      <p className="text-lg font-black text-emerald-700">
                        ₹{o.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    {o.bill && (
                      <button
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
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <FiPrinter size={14} /> Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Order History & Completed Receipts */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <FiClock size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">Order History & Receipts</h3>
                <p className="text-xs text-slate-400">
                  Completed orders and printable purchase receipts
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {pastOrders.length} Past Order{pastOrders.length === 1 ? "" : "s"}
            </span>
          </div>

          {pastOrders.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
              <FiClock size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No past orders found</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed purchases and downloadable bills will show up here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 font-semibold">Order / Pickup ID</th>
                    <th className="py-3 font-semibold">Shop</th>
                    <th className="py-3 font-semibold">Date Completed</th>
                    <th className="py-3 font-semibold">Items</th>
                    <th className="py-3 text-right font-semibold">Amount</th>
                    <th className="py-3 text-right font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 font-medium text-slate-900">
                        <p className="font-bold">{o.orderNumber}</p>
                        {o.pickupId && (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                            {o.pickupId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-700 font-medium">
                        {o.shop?.shopName}
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {o.completedAt
                          ? new Date(o.completedAt).toLocaleDateString()
                          : new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {o.items?.length || 0} item{o.items?.length === 1 ? "" : "s"}
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900">
                        ₹{o.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right">
                        {o.bill ? (
                          <button
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
                            className="inline-flex items-center gap-1 border border-slate-200 hover:border-slate-300 bg-white px-2.5 py-1 rounded-lg text-slate-700 font-semibold text-xs transition cursor-pointer"
                          >
                            <FiPrinter size={12} /> Bill
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Printable Bill Modal */}
      {activeBill && (
        <BillModal bill={activeBill} onClose={() => setActiveBill(null)} />
      )}
    </div>
  );
}

export default CustomerDashboard;
