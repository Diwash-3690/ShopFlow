import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingBag,
  FiSearch,
  FiCheckCircle,
  FiPrinter,
  FiRefreshCw,
  FiDollarSign,
  FiClock,
  FiPackage,
  FiCheck,
} from "react-icons/fi";
import { getVendorOrders, markOrderCompleted } from "../../services/orderService";
import BillModal from "../../components/BillModal";

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBill, setActiveBill] = useState(null);
  const [completingId, setCompletingId] = useState("");
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getVendorOrders({
        status: statusFilter,
        search: searchQuery || undefined,
      });
      setOrders(res.orders || []);
    } catch (err) {
      console.error("Failed to load vendor orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "VENDOR") {
      navigate("/vendor/login");
      return;
    }

    fetchOrders();
  }, [navigate, fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setCompletingId(orderId);
      await markOrderCompleted(orderId);
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "COMPLETED", completedAt: new Date().toISOString() }
            : o
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark order as completed");
    } finally {
      setCompletingId("");
    }
  };

  // Metrics
  const pendingOrders = orders.filter((o) => o.status === "AWAITING_PICKUP");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link
            to="/vendor/dashboard"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            title="Back to Dashboard"
          >
            <FiArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <FiShoppingBag size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                Order Management & Pickups
              </h1>
              <p className="text-xs text-slate-400">Incoming verified orders & customer counter handovers</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-slate-500 hover:text-slate-800 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh orders"
          >
            <FiRefreshCw size={15} className={refreshing ? "animate-spin text-blue-600" : ""} />
          </button>
          <Link
            to="/vendor/pos"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <FiDollarSign size={15} /> <span>Open Walk-in POS</span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Awaiting Counter Pickup
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">
                {pendingOrders.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Paid & ready for customer</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiClock size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Completed Pickups & Sales
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">
                {completedOrders.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Handed over & closed</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Total Orders Handled
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">
                {orders.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Online pickups + Walk-ins</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiPackage size={24} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: "ALL", label: "All Orders" },
              { id: "AWAITING_PICKUP", label: `Awaiting Pickup (${pendingOrders.length})` },
              { id: "COMPLETED", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Pickup ID (e.g. PU-8K...) or Order #"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading incoming orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <FiShoppingBag size={40} className="mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">No verified orders found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : "When customers pay for online orders or you record counter sales, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const isPending = o.status === "AWAITING_PICKUP";
              const isWalkIn = o.orderType === "WALK_IN";

              return (
                <div
                  key={o.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 transition shadow-2xs ${
                    isPending
                      ? "border-amber-300 ring-2 ring-amber-100"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    {/* Left: Pickup ID & Order Meta */}
                    <div className="flex flex-wrap items-center gap-3">
                      {o.pickupId ? (
                        <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-sm font-black tracking-wider flex items-center gap-1.5 shadow-2xs">
                          <span className="text-[10px] text-emerald-400 font-sans uppercase font-bold">
                            Pickup ID:
                          </span>
                          <span className="text-emerald-300">{o.pickupId}</span>
                        </div>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl font-mono text-xs font-bold">
                          Walk-in Ticket
                        </span>
                      )}

                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {o.orderNumber}
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isWalkIn
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isWalkIn ? "Walk-In Counter Sale" : "Online Pre-order"}
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isPending
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isPending ? "Awaiting Customer Pickup" : "Completed & Handed Over"}
                      </span>
                    </div>

                    {/* Right: Time & Customer Mobile */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Customer: <strong className="text-slate-800">{o.customerMobile}</strong></span>
                      <span>•</span>
                      <span>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Body: Items Table */}
                  <div className="py-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">
                          <th className="pb-2 font-semibold">Ordered Product</th>
                          <th className="pb-2 text-center font-semibold">Qty</th>
                          <th className="pb-2 text-right font-semibold">Price</th>
                          <th className="pb-2 text-right font-semibold">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {o.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 font-semibold text-slate-800">
                              {item.productName}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({item.unit})
                              </span>
                            </td>
                            <td className="py-2 text-center text-slate-600 font-bold">
                              {item.quantity}
                            </td>
                            <td className="py-2 text-right text-slate-600">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900">
                              ₹{item.lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer: Amount & Action Handlers */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid: </span>
                        <span className="text-lg font-black text-emerald-700 ml-1">
                          ₹{o.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        Payment: {o.payment?.method || "UPI"} (VERIFIED)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setActiveBill({
                            billNumber: o.billNumber || "BILL-REF",
                            orderNumber: o.orderNumber,
                            pickupId: o.pickupId,
                            orderType: o.orderType,
                            status: o.status,
                            issuedAt: o.createdAt,
                            totalAmount: o.totalAmount,
                            subtotal: o.subtotal,
                            items: o.items,
                            payment: o.payment,
                            customer: { mobile: o.customerMobile },
                          })
                        }
                        className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <FiPrinter size={14} /> Print Bill
                      </button>

                      {isPending && (
                        <button
                          onClick={() => handleCompleteOrder(o.id)}
                          disabled={completingId === o.id}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer disabled:bg-emerald-400"
                        >
                          <FiCheck size={16} />
                          {completingId === o.id
                            ? "Completing..."
                            : "Mark as Completed & Hand Over"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bill Receipt Modal */}
      {activeBill && (
        <BillModal bill={activeBill} onClose={() => setActiveBill(null)} />
      )}
    </div>
  );
}

export default VendorOrders;
