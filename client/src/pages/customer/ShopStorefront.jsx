import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingBag,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiPackage,
  FiTrash2,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiCopy,
  FiCheck,
  FiExternalLink,
} from "react-icons/fi";
import { getPublicShopById } from "../../services/shopService";
import { getPublicShopProducts } from "../../services/productService";
import { getPublicShopCategories } from "../../services/categoryService";
import {
  calculateCheckout,
  createOnlineOrder,
  submitCustomerPayment,
} from "../../services/orderService";
import { useCart } from "../../context/CartContext";
import BillModal from "../../components/BillModal";

function ShopStorefront() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart Context
  const {
    cartItems,
    activeShop,
    totalCount,
    subtotal,
    addToCart,
    forceAddFromNewShop,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Drawers & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [conflictModal, setConflictModal] = useState(null);
  const [verifiedCheckout, setVerifiedCheckout] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Payment & Order Confirmation Modals
  const [placingOrder, setPlacingOrder] = useState(false);
  const [upiOrderData, setUpiOrderData] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [utrError, setUtrError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [copiedPickupId, setCopiedPickupId] = useState(false);
  const [activeBill, setActiveBill] = useState(null);

  const loadStoreData = useCallback(async () => {
    try {
      setLoading(true);
      const [shopRes, catsRes, prodsRes] = await Promise.all([
        getPublicShopById(shopId),
        getPublicShopCategories(shopId),
        getPublicShopProducts(shopId),
      ]);

      setShop(shopRes.shop);
      setCategories(catsRes.categories || []);
      setProducts(prodsRes.products || []);
    } catch (err) {
      console.error("Failed to load shop storefront:", err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  const handleAddToCart = (product) => {
    if (!shop) return;
    const res = addToCart(product, shop);
    if (res?.conflict) {
      setConflictModal({
        currentShop: res.currentShop,
        newShop: res.newShop,
        pendingProduct: res.pendingProduct,
      });
    }
  };

  const handleConfirmSwitchShop = () => {
    if (!conflictModal) return;
    forceAddFromNewShop(conflictModal.pendingProduct, conflictModal.newShop);
    setConflictModal(null);
  };

  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0 || !activeShop) return;

    try {
      setCalculating(true);
      setCheckoutError("");

      const res = await calculateCheckout({
        shopId: activeShop.id,
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      setVerifiedCheckout(res);
    } catch (err) {
      setCheckoutError(
        err.response?.data?.message || err.message || "Failed to verify checkout."
      );
    } finally {
      setCalculating(false);
    }
  };

  // Step 2: Customer initiates order & receives UPI intent
  const handleInitiatePayment = async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "CUSTOMER") {
      alert("Please log in to your Customer account to complete this order.");
      navigate("/customer/login");
      return;
    }

    try {
      setPlacingOrder(true);
      setCheckoutError("");

      const res = await createOnlineOrder({
        shopId: activeShop.id,
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      // Close verified summary, open UPI Payment modal
      setVerifiedCheckout(null);
      setIsCartOpen(false);
      setUpiOrderData(res.data);
    } catch (err) {
      setCheckoutError(
        err.response?.data?.message || err.message || "Could not initiate order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // Step 3: Customer submits mandatory UPI payment reference (UTR) for merchant verification (Zero-cost direct UPI)
  const handleSubmitPayment = async () => {
    if (!upiOrderData) return;

    const cleanUtr = (transactionRef || "").trim();
    if (!cleanUtr) {
      setUtrError("Please enter the 12-digit UPI Reference / UTR number from your payment app.");
      return;
    }
    if (cleanUtr.length < 6) {
      setUtrError("Please enter a valid UPI Reference / UTR number (at least 6 characters).");
      return;
    }

    setUtrError("");
    try {
      setVerifyingPayment(true);
      await submitCustomerPayment(upiOrderData.order.id, {
        providerTransactionId: cleanUtr,
      });

      // Clear the cart
      clearCart();

      // Show payment recorded confirmation modal
      setConfirmedOrder({
        orderNumber: upiOrderData.order.orderNumber,
        totalAmount: parseFloat(upiOrderData.order.totalAmount),
        shop: upiOrderData.shop,
        paymentStatus: "PENDING",
        providerTransactionId: cleanUtr,
      });
      setUpiOrderData(null);
    } catch (err) {
      setUtrError(err.response?.data?.message || "Failed to submit payment reference.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPickupId(true);
    setTimeout(() => setCopiedPickupId(false), 2000);
  };

  // Filter products by category & search
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <FiPackage size={48} className="text-slate-300 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Shop Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          The shop you are looking for may have updated its profile or is currently inactive.
        </p>
        <Link
          to="/shops"
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
        >
          Browse Nearby Stores
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/shops"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            title="Back to shops"
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {shop.shopName}
            </h1>
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {shop.shopId}
            </span>
          </div>
        </div>

        {/* Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
        >
          <FiShoppingBag size={16} />
          <span>Cart</span>
          {totalCount > 0 && (
            <span className="bg-white text-emerald-800 rounded-full px-2 py-0.5 text-[11px] font-black">
              {totalCount}
            </span>
          )}
        </button>
      </nav>

      {/* Store Header Banner */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified Local Merchant
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {shop.shopName}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <FiMapPin className="text-emerald-600" /> {shop.address}
              </span>
              <span className="flex items-center gap-1">
                <FiPhone className="text-slate-400" /> {shop.contactNumber}
              </span>
              {shop.upiId && (
                <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-mono text-[11px]">
                  UPI: {shop.upiId}
                </span>
              )}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 max-w-sm">
            <p className="font-semibold text-slate-800">🛍️ Storefront Pickup</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Order items from this store, pay securely via UPI, and pick them up at the counter with your unique Pickup ID.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Controls: Category Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <FiPackage size={40} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No products match your criteria</p>
            <p className="text-xs text-slate-400">
              Try selecting a different category or clearing your search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const itemInCart = cartItems.find((ci) => ci.productId === p.id);
              const qtyInCart = itemInCart ? itemInCart.quantity : 0;
              const isOutOfStock = !p.isAvailable;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs hover:shadow-md transition duration-200"
                >
                  {/* Product Image / Placeholder */}
                  <div className="h-36 sm:h-44 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center">
                        <FiPackage size={36} />
                      </div>
                    )}
                    {/* Availability Tag */}
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        p.isAvailable
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.availability === "OUT_OF_STOCK" ? "Out of Stock" : "In Stock"}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        {p.categoryName || "General"}
                      </p>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mt-0.5">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-base font-black text-slate-900">
                          ₹{parseFloat(p.sellingPrice || 0).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">/ {p.unit}</span>
                      </div>
                    </div>

                    {/* Action: Add to Cart / Qty Controls */}
                    {isOutOfStock ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                    ) : qtyInCart > 0 ? (
                      <div className="flex items-center justify-between border border-emerald-500 rounded-xl bg-emerald-50/50 p-1">
                        <button
                          onClick={() => updateQuantity(p.id, qtyInCart - 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 flex items-center justify-center text-sm cursor-pointer shadow-2xs"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-emerald-900">
                          {qtyInCart} in cart
                        </span>
                        <button
                          onClick={() => updateQuantity(p.id, qtyInCart + 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 flex items-center justify-center text-sm cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="w-full bg-slate-900 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FiShoppingBag size={14} /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Your Cart</h3>
                {activeShop && (
                  <p className="text-xs text-slate-500 mt-0.5">Shop: {activeShop.shopName}</p>
                )}
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  <FiShoppingBag size={40} className="mx-auto text-slate-300 mb-2" />
                  Your cart is empty.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.productName}</p>
                      <p className="text-xs text-slate-500">
                        ₹{parseFloat(item.sellingPrice || 0).toFixed(2)} / {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                        title="Remove"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {checkoutError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                    <FiAlertCircle size={16} /> {checkoutError}
                  </div>
                )}

                <div className="flex items-center justify-between text-base font-black text-slate-900">
                  <span>Subtotal</span>
                  <span>₹{parseFloat(subtotal || 0).toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  One order belongs to one shop only. Validated directly against live inventory.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="border border-slate-300 text-slate-600 px-3 py-3 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={calculating}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm cursor-pointer disabled:bg-emerald-400"
                  >
                    {calculating ? "Verifying Bill..." : "Proceed to Checkout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Verified Checkout Summary Modal */}
      {verifiedCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-600" size={22} />
                <h3 className="text-xl font-black text-slate-900">Verified Order Summary</h3>
              </div>
              <button
                onClick={() => setVerifiedCheckout(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Shop:</strong> {verifiedCheckout.shop.shopName}
                </p>
                <p>
                  <strong>Address:</strong> {verifiedCheckout.shop.address}
                </p>
                {verifiedCheckout.shop.upiId && (
                  <p>
                    <strong>UPI Destination:</strong> <code>{verifiedCheckout.shop.upiId}</code>
                  </p>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {verifiedCheckout.items.map((i) => (
                  <div key={i.productId} className="py-2 flex justify-between text-xs">
                    <span>
                      {i.productName} × {i.quantity} {i.unit}
                    </span>
                    <span className="font-bold">₹{parseFloat(i.lineTotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-lg text-slate-900">
                <span>Total Calculated Amount</span>
                <span className="text-emerald-700">₹{parseFloat(verifiedCheckout.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleInitiatePayment}
                disabled={placingOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm cursor-pointer disabled:bg-emerald-400 flex items-center justify-center gap-2"
              >
                {placingOrder ? "Initiating Order..." : "Proceed to UPI Payment"}
              </button>
              <button
                onClick={() => setVerifiedCheckout(null)}
                className="text-xs text-slate-500 hover:underline text-center cursor-pointer py-1"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: UPI Intent & Payment Screen */}
      {upiOrderData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Step 2 of 2: UPI Payment
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Pay with UPI</h3>
              </div>
              <button
                onClick={() => setUpiOrderData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Payment Details Box */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs text-purple-800 font-medium">Paying directly to merchant:</p>
              <h4 className="text-lg font-black text-purple-950">{upiOrderData.shop.shopName}</h4>
              <p className="font-mono text-xs bg-white px-3 py-1.5 rounded-lg border border-purple-200 inline-block text-purple-900 font-bold">
                {upiOrderData.shop.upiId}
              </p>
              <div className="pt-2">
                <span className="text-3xl font-black text-purple-950">
                  ₹{parseFloat(upiOrderData.order.totalAmount).toFixed(2)}
                </span>
                <p className="text-[10px] text-purple-600 mt-0.5">
                  Order Ref: {upiOrderData.order.orderNumber}
                </p>
              </div>
            </div>

            {/* Quick UPI Intent Link */}
            <div className="space-y-3">
              <a
                href={upiOrderData.upiUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <FiExternalLink size={16} /> Open UPI App (GPay / PhonePe / Paytm)
              </a>
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                On mobile devices, this will open your preferred UPI application with the exact merchant UPI ID and amount prefilled.
              </p>
            </div>

            {/* Verification trigger */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  12-Digit UPI Reference / UTR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => {
                    setTransactionRef(e.target.value);
                    if (utrError) setUtrError("");
                  }}
                  placeholder="e.g. 431289456721 (from GPay / PhonePe / Paytm)"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  After paying via UPI, copy the 12-digit UTR/UPI Ref from your payment receipt and paste here for merchant verification.
                </p>
                {utrError && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <FiAlertCircle size={13} /> {utrError}
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmitPayment}
                disabled={verifyingPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm cursor-pointer disabled:bg-emerald-400 flex items-center justify-center gap-2"
              >
                {verifyingPayment ? "Submitting..." : "I Have Paid via UPI • Submit for Verification"}
              </button>

              <button
                onClick={() => setUpiOrderData(null)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-1"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmed / Submitted Order Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <FiCheckCircle size={36} />
            </div>

            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                confirmedOrder.pickupId
                  ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                  : "text-purple-800 bg-purple-50 border-purple-200"
              }`}>
                {confirmedOrder.pickupId ? "Payment Verified • Order Confirmed" : "Direct UPI Payment Submitted"}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {confirmedOrder.pickupId ? "Ready for Pickup!" : "Payment Under Verification"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {confirmedOrder.pickupId
                  ? "Show this unique Pickup ID to the shopkeeper at the store counter."
                  : "Your direct UPI payment has been received. The merchant will verify the bank credit and activate your unique Pickup ID."}
              </p>
            </div>

            {/* Pickup ID Display if available, else Order Reference */}
            {confirmedOrder.pickupId ? (
              <div className="bg-slate-900 text-white p-5 rounded-2xl relative shadow-md">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Your Unique Pickup ID
                </p>
                <p className="text-3xl font-mono font-black tracking-wider text-emerald-400 mt-1">
                  {confirmedOrder.pickupId}
                </p>
                <button
                  onClick={() => copyToClipboard(confirmedOrder.pickupId)}
                  className="mt-3 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  {copiedPickupId ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                  <span>{copiedPickupId ? "Copied!" : "Copy Pickup ID"}</span>
                </button>
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-700 font-semibold">Order Number</span>
                  <span className="font-mono font-bold text-purple-950">{confirmedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-700 font-semibold">Total Amount</span>
                  <span className="font-bold text-purple-950">₹{parseFloat(confirmedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-700 font-semibold">Submitted Ref / UTR</span>
                  <span className="font-mono text-purple-950">{confirmedOrder.providerTransactionId}</span>
                </div>
              </div>
            )}

            {/* Shop Details */}
            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs text-slate-600 space-y-1 border border-slate-100">
              <p>
                <strong>Pickup Shop:</strong> {confirmedOrder.shop?.shopName}
              </p>
              <p>
                <strong>Address:</strong> {confirmedOrder.shop?.address}
              </p>
              <p>
                <strong>Amount:</strong> ₹{parseFloat(confirmedOrder.totalAmount || 0).toFixed(2)}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                Go to My Orders & Track Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal */}
      {activeBill && (
        <BillModal bill={activeBill} onClose={() => setActiveBill(null)} />
      )}

      {/* Cross-Shop Conflict Modal */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Different Shop Selected</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your cart currently contains items from <strong>{conflictModal.currentShop.shopName}</strong>.
              ShopFlow orders are fulfilled shop-by-shop for store pickup.
            </p>
            <p className="text-xs font-semibold text-amber-700 mt-2">
              Would you like to clear your existing cart and start a new order with{" "}
              <strong>{conflictModal.newShop.shopName}</strong>?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConflictModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Keep Existing Cart
              </button>
              <button
                onClick={handleConfirmSwitchShop}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                Start New Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopStorefront;
