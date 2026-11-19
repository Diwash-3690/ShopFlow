import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CheckCircle2,
  Package,
  Receipt,
  Smartphone,
  Coins,
} from "lucide-react";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { createWalkInOrder } from "../../services/orderService";
import BillModal from "../../components/BillModal";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import ShopFlowRoleLogo from "../../components/ShopFlowRoleLogo";

function WalkInPos() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Counter Ticket state
  const [ticketItems, setTicketItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const navigate = useNavigate();

  const loadInventory = useCallback(async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        getProducts().catch(() => ({ products: [] })),
        getCategories().catch(() => ({ categories: [] })),
      ]);

      setProducts(prodsRes.products || []);
      setCategories(catsRes.categories || []);
    } catch (err) {
      console.error("Failed to load inventory for POS:", err);
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

    loadInventory();
  }, [navigate, loadInventory]);

  // Ticket manipulations
  const addToTicket = (product) => {
    if (product.stockQuantity <= 0) return;

    setTicketItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert(`Cannot add more. Current available stock is ${product.stockQuantity}.`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            unitPrice: parseFloat(product.sellingPrice),
            unit: product.unit,
            stockQuantity: product.stockQuantity,
            quantity: 1,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromTicket(productId);
      return;
    }

    setTicketItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          if (newQty > item.stockQuantity) {
            alert(`Maximum available stock is ${item.stockQuantity}.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromTicket = (productId) => {
    setTicketItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearTicket = () => {
    setTicketItems([]);
  };

  const totalAmount = ticketItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleCompleteSale = async () => {
    if (ticketItems.length === 0) return;

    let utr = "";
    if (paymentMethod === "UPI") {
      const inputUtr = window.prompt("Enter customer's UPI UTR / Reference number from payment screen (or leave blank if cash/counter verified):");
      if (inputUtr && inputUtr.trim()) {
        utr = inputUtr.trim();
      }
    }

    try {
      setSubmitting(true);
      const res = await createWalkInOrder({
        items: ticketItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        paymentMethod,
        providerTransactionId: utr || undefined,
      });

      const { order, items, bill, payment, shop } = res.data;

      // Show receipt bill modal immediately
      setActiveBill({
        ...bill,
        orderNumber: order.orderNumber,
        pickupId: order.pickupId,
        orderType: "WALK_IN",
        status: "COMPLETED",
        items,
        shop: shop || null,
        payment,
        customer: { mobile: "Counter Walk-in" },
      });

      // Clear ticket and reload products to update live stock
      clearTicket();
      loadInventory();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete walk-in sale");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-3">
          <ShopFlowRoleLogo
            role="VENDOR"
            isDirty={ticketItems.length > 0}
            customWarningMessage="You have an active counter ticket in progress. Do you want to leave without finishing? Click Cancel to stay."
            onNavigate={() => setTicketItems([])}
          />
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Walk-In Point of Sale (POS)
              </h1>
              <p className="text-[11px] text-slate-400">Quick counter sales & instant billing</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/vendor/orders")}
            className="h-9 text-xs font-bold text-slate-700 hover:bg-slate-100 border-slate-200 rounded-xl gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Incoming Orders</span>
          </Button>
        </div>
      </nav>

      {/* Main Dual-Panel View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Inventory Product Catalog (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Search & Category Filter */}
          <Card className="rounded-2xl border-slate-200/90 shadow-2xs p-4 bg-white space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name to add to sale ticket..."
                className="pl-9 text-xs bg-slate-50 border-slate-200 rounded-xl h-9"
              />
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Button
                variant={selectedCategory === "ALL" ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory("ALL")}
                className={`rounded-xl text-xs font-bold whitespace-nowrap h-7 px-3 ${
                  selectedCategory === "ALL"
                    ? "bg-purple-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Products ({products.length})
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedCategory === c.id ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`rounded-xl text-xs font-bold whitespace-nowrap h-7 px-3 ${
                    selectedCategory === c.id
                      ? "bg-purple-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </Card>

          {/* Product Grid */}
          <Card className="flex-1 rounded-2xl border-slate-200/90 shadow-2xs p-4 bg-white overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading shop products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p>No products found matching search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  const itemInTicket = ticketItems.find((i) => i.productId === p.id);

                  return (
                    <button
                      key={p.id}
                      onClick={() => addToTicket(p)}
                      disabled={isOutOfStock}
                      className={`text-left p-3 rounded-2xl border transition flex flex-col justify-between relative cursor-pointer ${
                        isOutOfStock
                          ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                          : itemInTicket
                          ? "bg-purple-50/60 border-purple-300 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-2xs"
                      }`}
                    >
                      {itemInTicket && (
                        <span className="absolute top-2 right-2 bg-purple-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {itemInTicket.quantity}
                        </span>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-xs line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Stock: {p.stockQuantity} {p.unit}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-black text-slate-900 text-xs">
                          ₹{parseFloat(p.sellingPrice).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-purple-700 font-bold flex items-center gap-0.5">
                          <Plus className="w-3 h-3" /> Add
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel: Current Bill Ticket (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="rounded-3xl border-slate-200/90 shadow-sm p-6 flex flex-col h-full justify-between space-y-4 bg-white">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-700" />
                  <h3 className="font-black text-slate-900 text-base">Current Sale Ticket</h3>
                </div>
                {ticketItems.length > 0 && (
                  <button
                    onClick={clearTicket}
                    className="text-slate-400 hover:text-rose-600 text-xs font-semibold cursor-pointer transition"
                  >
                    Clear Ticket
                  </button>
                )}
              </div>

              {/* Items in ticket */}
              <div className="py-4 space-y-2.5 max-h-72 overflow-y-auto">
                {ticketItems.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                    <p>Click products on the left to add them to this counter bill.</p>
                  </div>
                ) : (
                  ticketItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">
                          ₹{parseFloat(item.unitPrice || 0).toFixed(2)} / {item.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Qty +- */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-black text-slate-900 w-16 text-right">
                          ₹{(parseFloat(item.unitPrice || 0) * item.quantity).toFixed(2)}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromTicket(item.productId)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom: Payment Selector & Checkout Action */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              {/* Payment Method Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Payment Method Received
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "CASH" ? "default" : "secondary"}
                    onClick={() => setPaymentMethod("CASH")}
                    className={`h-10 rounded-xl text-xs font-bold gap-1.5 ${
                      paymentMethod === "CASH"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Cash Received</span>
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "UPI" ? "default" : "secondary"}
                    onClick={() => setPaymentMethod("UPI")}
                    className={`h-10 rounded-xl text-xs font-bold gap-1.5 ${
                      paymentMethod === "UPI"
                        ? "bg-purple-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Counter UPI</span>
                  </Button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount Due</span>
                <span className="text-2xl text-purple-700">₹{parseFloat(totalAmount || 0).toFixed(2)}</span>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleCompleteSale}
                disabled={ticketItems.length === 0 || submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-2xl text-xs gap-2 shadow-sm disabled:bg-slate-200 disabled:text-slate-400"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? "Processing Sale..." : "Complete Sale & Print Bill"}</span>
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Bill Receipt Modal */}
      {activeBill && (
        <BillModal bill={activeBill} onClose={() => setActiveBill(null)} />
      )}
    </div>
  );
}

export default WalkInPos;
