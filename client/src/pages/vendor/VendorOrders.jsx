import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingBag,
  FiSearch,
  FiCheckCircle,
  FiPrinter,
  FiRefreshCw,
  FiDollarSign,
  FiClock,
  FiCheck,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  getVendorOrders,
  markOrderCompleted,
  verifyPayment,
  rejectPayment,
} from "../../services/orderService";
import BillModal from "../../components/BillModal";

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, PENDING_PAYMENT, AWAITING_PICKUP, COMPLETED
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBill, setActiveBill] = useState(null);
  const [actionInProgress, setActionInProgress] = useState("");
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getVendorOrders({
        search: searchQuery || undefined,
      });
      setOrders(res.orders || []);
    } catch (err) {
      console.error("Failed to load vendor orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "VENDOR") {
      navigate("/vendor/login");
      return;
    }

    fetchOrders();

    const handleFocus = () => fetchOrders();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
    };
  }, [navigate, fetchOrders, location.key]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Vendor manual payment verification (Zero-cost UPI flow)
  const handleVerifyPayment = async (orderId, submittedUtr) => {
    let utr = (submittedUtr || "").trim();
    if (!utr) {
      utr = window.prompt("Enter the 12-digit UPI UTR / Reference number from your bank app to confirm:");
      if (!utr || !utr.trim()) {
        alert("Payment confirmation cancelled: A valid UPI UTR is mandatory.");
        return;
      }
      utr = utr.trim();
    }
    try {
      setActionInProgress(orderId);
      const res = await verifyPayment(orderId, { providerTransactionId: utr });
      alert(`Payment verified! Unique Pickup ID ${res.order.pickupId} generated for customer.`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify payment");
    } finally {
      setActionInProgress("");
    }
  };

  // Vendor reject payment if money was not received
  const handleRejectPayment = async (orderId) => {
    const confirmReject = window.confirm(
      "Are you sure you want to mark this payment as FAILED? The reserved inventory stock will be restored."
    );
    if (!confirmReject) return;

    try {
      setActionInProgress(orderId);
      await rejectPayment(orderId);
      alert("Order payment marked as FAILED and stock restored.");
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject payment");
    } finally {
      setActionInProgress("");
    }
  };

  // Handover order at store counter
  const handleCompleteOrder = async (orderId) => {
    try {
      setActionInProgress(orderId);
      await markOrderCompleted(orderId);
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
      setActionInProgress("");
    }
  };

  // Filter partitions
  const pendingPaymentOrders = orders.filter(
    (o) => o.payment?.status === "PENDING"
  );
  const awaitingPickupOrders = orders.filter(
    (o) => o.status === "AWAITING_PICKUP" && o.payment?.status === "VERIFIED"
  );
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const displayedOrders = orders.filter((o) => {
    if (activeTab === "PENDING_PAYMENT") return o.payment?.status === "PENDING";
    if (activeTab === "AWAITING_PICKUP")
      return o.status === "AWAITING_PICKUP" && o.payment?.status === "VERIFIED";
    if (activeTab === "COMPLETED") return o.status === "COMPLETED";
    return true;
  });

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
                Order Management & Payments
              </h1>
              <p className="text-xs text-slate-400">
                Direct vendor UPI payment verification & counter handovers
              </p>
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
        {/* Zero-Cost Direct UPI Explanation Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              ⚡ Zero-Cost Direct UPI Payments
            </span>
            <p className="text-sm font-semibold text-white/95">
              Customers pay directly to your personal/merchant UPI account with 0% gateway commission.
            </p>
            <p className="text-xs text-white/75">
              Check your UPI/bank application notifications, match the reference/amount, and click <strong>Verify Payment</strong> to release the Pickup ID.
            </p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Payment Verification Needed
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">
                {pendingPaymentOrders.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">UPI credits to confirm</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiAlertCircle size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Ready for Counter Pickup
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">
                {awaitingPickupOrders.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Verified & Pickup ID issued</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiClock size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Completed & Handed Over
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">
                {completedOrders.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Online pickups + Walk-in sales</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: "ALL", label: `All Orders (${orders.length})` },
              { id: "PENDING_PAYMENT", label: `Verify UPI (${pendingPaymentOrders.length})` },
              { id: "AWAITING_PICKUP", label: `Ready for Pickup (${awaitingPickupOrders.length})` },
              { id: "COMPLETED", label: `Completed (${completedOrders.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
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
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <FiShoppingBag size={40} className="mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">No orders found in this section</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : "Incoming customer orders and counter walk-in sales will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((o) => {
              const isPaymentPending = o.payment?.status === "PENDING";
              const isAwaitingPickup = o.status === "AWAITING_PICKUP" && !isPaymentPending;
              const isWalkIn = o.orderType === "WALK_IN";

              return (
                <div
                  key={o.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 transition shadow-2xs ${
                    isPaymentPending
                      ? "border-purple-300 ring-2 ring-purple-100"
                      : isAwaitingPickup
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
                      ) : isPaymentPending ? (
                        <div className="bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-xl font-bold text-xs">
                          ⏳ Payment Verification Needed
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
                          isPaymentPending
                            ? "bg-purple-100 text-purple-800"
                            : isAwaitingPickup
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isPaymentPending
                          ? "Payment Unverified"
                          : isAwaitingPickup
                          ? "Ready for Pickup"
                          : "Completed & Handed Over"}
                      </span>
                    </div>

                    {/* Right: Customer & Time */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Customer: <strong className="text-slate-800">{o.customerMobile}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(o.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Payment Verification Banner (if pending) */}
                  {isPaymentPending && (
                    <div className="my-3 p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-purple-900">
                          Direct UPI payment submitted by customer
                        </p>
                        <p className="text-purple-700 mt-0.5">
                          Amount to verify: <strong>₹{parseFloat(o.totalAmount || 0).toFixed(2)}</strong> •
                          Submitted Ref/UTR:{" "}
                          <code className="bg-white px-1.5 py-0.5 rounded border border-purple-200 font-bold">
                            {o.payment?.providerTransactionId || "Not provided by customer"}
                          </code>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectPayment(o.id)}
                          disabled={actionInProgress === o.id}
                          className="flex items-center gap-1 border border-red-300 hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                        >
                          <FiXCircle size={14} /> Reject & Restore Stock
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(o.id, o.payment?.providerTransactionId)}
                          disabled={actionInProgress === o.id}
                          className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer shadow-xs"
                        >
                          <FiCheck size={14} /> Confirm Payment Received
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Body: Items Table */}
                  <div className="py-3 overflow-x-auto">
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
                              ₹{parseFloat(item.unitPrice || 0).toFixed(2)}
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900">
                              ₹{parseFloat(item.lineTotal || 0).toFixed(2)}
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
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Total Amount:{" "}
                        </span>
                        <span className="text-lg font-black text-slate-900 ml-1">
                          ₹{parseFloat(o.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        Payment: {o.payment?.method || "UPI"} (
                        {o.payment?.status || "PENDING"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {o.payment?.status === "VERIFIED" && (
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
                              shop: o.shop,
                              payment: o.payment,
                              customer: { mobile: o.customerMobile },
                            })
                          }
                          className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <FiPrinter size={14} /> Print Bill
                        </button>
                      )}

                      {isAwaitingPickup && (
                        <button
                          onClick={() => handleCompleteOrder(o.id)}
                          disabled={actionInProgress === o.id}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer disabled:bg-emerald-400"
                        >
                          <FiCheck size={16} />
                          {actionInProgress === o.id
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
