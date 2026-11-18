import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingBag,
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiDollarSign,
  FiCheckCircle,
  FiPackage,
} from "react-icons/fi";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { createWalkInOrder } from "../../services/orderService";
import BillModal from "../../components/BillModal";

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
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <FiDollarSign size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                Walk-In Point of Sale (POS)
              </h1>
              <p className="text-xs text-slate-400">Quick counter sales & instant billing</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/vendor/orders"
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
          >
            <FiShoppingBag size={14} /> <span>Incoming Orders</span>
          </Link>
        </div>
      </nav>

      {/* Main Dual-Panel View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Inventory Product Catalog (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name to add to sale ticket..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Products ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading shop products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <FiPackage size={36} className="mx-auto text-slate-300 mb-2" />
                No products found matching search.
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
                      className={`text-left p-3 rounded-xl border transition flex flex-col justify-between relative cursor-pointer ${
                        isOutOfStock
                          ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                          : itemInTicket
                          ? "bg-purple-50/60 border-purple-300 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-2xs"
                      }`}
                    >
                      {itemInTicket && (
                        <span className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {itemInTicket.quantity}
                        </span>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-xs line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Stock: {p.stockQuantity} {p.unit}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-black text-slate-900 text-xs">
                          ₹{parseFloat(p.sellingPrice).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-purple-600 font-bold flex items-center">
                          <FiPlus size={12} /> Add
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Current Bill Ticket (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧾</span>
                  <h3 className="font-black text-slate-900 text-base">Current Sale Ticket</h3>
                </div>
                {ticketItems.length > 0 && (
                  <button
                    onClick={clearTicket}
                    className="text-slate-400 hover:text-red-600 text-xs font-semibold cursor-pointer"
                  >
                    Clear Ticket
                  </button>
                )}
              </div>

              {/* Items in ticket */}
              <div className="py-4 space-y-2.5 max-h-72 overflow-y-auto">
                {ticketItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <FiShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                    Click products on the left to add them to this counter bill.
                  </div>
                ) : (
                  ticketItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">
                          ₹{parseFloat(item.unitPrice || 0).toFixed(2)} / {item.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Qty +- */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <FiMinus size={10} />
                          </button>
                          <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <FiPlus size={10} />
                          </button>
                        </div>

                        <span className="font-bold text-slate-900 w-16 text-right">
                          ₹{(parseFloat(item.unitPrice || 0) * item.quantity).toFixed(2)}
                        </span>

                        <button
                          onClick={() => removeFromTicket(item.productId)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom: Payment Selector & Checkout Action */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              {/* Payment Method Toggle */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                  Payment Method Received
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("CASH")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMethod === "CASH"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    💵 Cash Received
                  </button>
                  <button
                    onClick={() => setPaymentMethod("UPI")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMethod === "UPI"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📱 Counter UPI
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount Due</span>
                <span className="text-2xl text-purple-700">₹{parseFloat(totalAmount || 0).toFixed(2)}</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCompleteSale}
                disabled={ticketItems.length === 0 || submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiCheckCircle size={18} />
                {submitting ? "Processing Sale..." : "Complete Sale & Print Bill"}
              </button>
            </div>
          </div>
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
