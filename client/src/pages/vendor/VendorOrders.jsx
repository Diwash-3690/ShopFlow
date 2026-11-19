import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Search,
  CheckCircle2,
  Printer,
  RefreshCw,
  DollarSign,
  Clock,
  Check,
  XCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  getVendorOrders,
  markOrderCompleted,
  verifyPayment,
  rejectPayment,
} from "../../services/orderService";
import BillModal from "../../components/BillModal";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import ShopFlowRoleLogo from "../../components/ShopFlowRoleLogo";

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-3">
          <ShopFlowRoleLogo
            role="VENDOR"
            isDirty={!!actionInProgress}
            customWarningMessage="You have an active payment verification or order action in progress. Do you want to leave? Click Cancel to stay."
          />
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Order Management & Payments
              </h1>
              <p className="text-[11px] text-slate-400">
                Direct vendor UPI payment verification & counter handovers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 w-9 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </Button>
          <Button
            onClick={() => navigate("/vendor/pos")}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Open Walk-in POS</span>
          </Button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Zero-Cost Direct UPI Explanation Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 border-0">
              <Zap className="w-3 h-3 mr-1 text-amber-300" /> Zero-Cost Direct UPI Payments
            </Badge>
            <p className="text-xs sm:text-sm font-semibold text-white/95">
              Customers pay directly to your personal/merchant UPI account with 0% gateway commission.
            </p>
            <p className="text-[11px] text-white/75 leading-relaxed">
              Check your UPI/bank application notifications, match the reference/amount, and click <strong>Confirm Payment Received</strong> to release the Pickup ID.
            </p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-purple-200/80 shadow-2xs bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                  Payment Verification Needed
                </p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {pendingPaymentOrders.length}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">UPI credits to confirm</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-amber-200/80 shadow-2xs bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  Ready for Counter Pickup
                </p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {awaitingPickupOrders.length}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Verified & Pickup ID issued</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-emerald-200/80 shadow-2xs bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Completed & Handed Over
                </p>
                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                  {completedOrders.length}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Online pickups + Walk-in sales</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5 sm:p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: "ALL", label: `All Orders (${orders.length})` },
                { id: "PENDING_PAYMENT", label: `Verify UPI (${pendingPaymentOrders.length})` },
                { id: "AWAITING_PICKUP", label: `Ready for Pickup (${awaitingPickupOrders.length})` },
                { id: "COMPLETED", label: `Completed (${completedOrders.length})` },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl text-xs font-bold whitespace-nowrap h-8 px-3.5 ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Pickup ID or Order #"
                className="pl-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {loading ? (
          <Card className="rounded-3xl border-slate-200 p-12 text-center bg-white">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading incoming orders...</p>
          </Card>
        ) : displayedOrders.length === 0 ? (
          <Card className="rounded-3xl border-slate-200 p-12 text-center text-slate-500 space-y-2 bg-white">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No orders found in this section</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : "Incoming customer orders and counter walk-in sales will appear here."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((o) => {
              const isPaymentPending = o.payment?.status === "PENDING";
              const isAwaitingPickup = o.status === "AWAITING_PICKUP" && !isPaymentPending;
              const isWalkIn = o.orderType === "WALK_IN";

              return (
                <Card
                  key={o.id}
                  className={`rounded-2xl border p-5 sm:p-6 transition shadow-2xs bg-white ${
                    isPaymentPending
                      ? "border-purple-300 ring-2 ring-purple-100/70"
                      : isAwaitingPickup
                      ? "border-amber-300 ring-2 ring-amber-100/70"
                      : "border-slate-200/90"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    {/* Left: Pickup ID & Order Meta */}
                    <div className="flex flex-wrap items-center gap-3">
                      {o.pickupId ? (
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-mono text-sm font-black tracking-wider flex items-center gap-1.5 shadow-2xs">
                          <span className="text-[10px] text-emerald-400 font-sans uppercase font-bold">
                            Pickup ID:
                          </span>
                          <span className="text-emerald-300">{o.pickupId}</span>
                        </div>
                      ) : isPaymentPending ? (
                        <Badge variant="purple" className="font-bold text-xs py-1 px-3">
                          ⏳ Payment Verification Needed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="font-mono text-xs font-bold py-1 px-3">
                          Walk-in Ticket
                        </Badge>
                      )}

                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {o.orderNumber}
                      </span>

                      <Badge
                        variant={isWalkIn ? "purple" : "secondary"}
                        className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2"
                      >
                        {isWalkIn ? "Walk-In Counter Sale" : "Online Pre-order"}
                      </Badge>

                      <Badge
                        variant={
                          isPaymentPending
                            ? "purple"
                            : isAwaitingPickup
                            ? "warning"
                            : "success"
                        }
                        className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2"
                      >
                        {isPaymentPending
                          ? "Payment Unverified"
                          : isAwaitingPickup
                          ? "Ready for Pickup"
                          : "Completed & Handed Over"}
                      </Badge>
                    </div>

                    {/* Right: Customer & Time */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>
                        Customer: <strong className="text-slate-800 font-mono">{o.customerMobile}</strong>
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
                    <div className="my-3 p-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-purple-950">
                          Direct UPI payment submitted by customer
                        </p>
                        <p className="text-purple-700 mt-0.5">
                          Amount to verify: <strong>₹{parseFloat(o.totalAmount || 0).toFixed(2)}</strong> •
                          Submitted Ref/UTR:{" "}
                          <code className="bg-white px-2 py-0.5 rounded-md border border-purple-200 font-bold font-mono">
                            {o.payment?.providerTransactionId || "Not provided by customer"}
                          </code>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectPayment(o.id)}
                          disabled={actionInProgress === o.id}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs h-8 rounded-xl gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleVerifyPayment(o.id, o.payment?.providerTransactionId)}
                          disabled={actionInProgress === o.id}
                          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-8 px-3.5 rounded-xl gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Payment Received</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Body: Items Table */}
                  <div className="py-3 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                          <TableHead className="pb-2 font-bold">Ordered Product</TableHead>
                          <TableHead className="pb-2 text-center font-bold">Qty</TableHead>
                          <TableHead className="pb-2 text-right font-bold">Price</TableHead>
                          <TableHead className="pb-2 text-right font-bold">Line Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-50 text-xs">
                        {o.items?.map((item) => (
                          <TableRow key={item.id} className="hover:bg-slate-50/50">
                            <TableCell className="py-2.5 font-semibold text-slate-800">
                              {item.productName}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({item.unit})
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 text-center text-slate-600 font-bold">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="py-2.5 text-right text-slate-600">
                              ₹{parseFloat(item.unitPrice || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="py-2.5 text-right font-bold text-slate-900">
                              ₹{parseFloat(item.lineTotal || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Footer: Amount & Action Handlers */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          Total Amount:{" "}
                        </span>
                        <span className="text-lg font-black text-slate-900 ml-1">
                          ₹{parseFloat(o.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[11px] text-slate-600 font-medium">
                        Payment: {o.payment?.method || "UPI"} ({o.payment?.status || "PENDING"})
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {o.payment?.status === "VERIFIED" && (
                        <Button
                          variant="outline"
                          size="sm"
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
                          className="h-8 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-200 rounded-xl gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Print Bill</span>
                        </Button>
                      )}

                      {isAwaitingPickup && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteOrder(o.id)}
                          disabled={actionInProgress === o.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-xl text-xs gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {actionInProgress === o.id
                              ? "Completing..."
                              : "Mark as Completed & Hand Over"}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
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
