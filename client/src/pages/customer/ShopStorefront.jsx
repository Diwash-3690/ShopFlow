import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "react-icons/fi";
import { getPublicShopById } from "../../services/shopService";
import { getPublicShopProducts } from "../../services/productService";
import { getPublicShopCategories } from "../../services/categoryService";
import { calculateCheckout } from "../../services/orderService";
import { useCart } from "../../context/CartContext";

function ShopStorefront() {
  const { shopId } = useParams();

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

  const loadStoreData = useCallback(async () => {
    try {
      setLoading(true);
      const [shopRes, catsRes, prodsRes] = await Promise.all([
        getPublicShopById(shopId),
        getPublicShopCategories(shopId).catch(() => ({ categories: [] })),
        getPublicShopProducts(shopId, {
          categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
          search: searchQuery || undefined,
        }),
      ]);

      setShop(shopRes.shop);
      setCategories(catsRes.categories || []);
      setProducts(prodsRes.products || []);
    } catch (err) {
      console.error("Failed to load storefront data:", err);
    } finally {
      setLoading(false);
    }
  }, [shopId, selectedCategory, searchQuery]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  const handleAddToCart = (product) => {
    if (!product.isAvailable) return;

    const res = addToCart(product, shop, 1);
    if (res && res.conflict) {
      setConflictModal({
        product,
        shop,
        currentShop: res.currentShop,
      });
    }
  };

  const handleConfirmConflict = () => {
    if (conflictModal) {
      forceAddFromNewShop(conflictModal.product, conflictModal.shop, 1);
      setConflictModal(null);
    }
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

  if (loading && !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Loading store catalog...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <h2 className="text-2xl font-bold text-slate-800">Shop Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested store could not be found or has been moved.</p>
        <Link to="/shops" className="mt-4 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
          Browse All Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link
            to="/shops"
            className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5 text-sm font-medium"
          >
            <FiArrowLeft /> All Shops
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-sm truncate max-w-[180px] sm:max-w-none">
            {shop.shopName}
          </span>
        </div>

        {/* Floating Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <FiShoppingBag size={18} />
          <span>Cart</span>
          {totalCount > 0 && (
            <span className="bg-white text-emerald-800 text-xs font-black px-2 py-0.5 rounded-full">
              {totalCount} • ₹{subtotal.toFixed(2)}
            </span>
          )}
        </button>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Store Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                Shop ID: {shop.shopId}
              </span>
              <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                {shop.shopName}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <FiMapPin size={14} className="text-slate-400" /> {shop.address}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
              <p className="text-slate-500 flex items-center gap-1.5">
                <FiPhone size={14} className="text-slate-400" /> <strong>Contact:</strong> {shop.contactNumber}
              </p>
              {shop.upiId && (
                <p className="text-slate-600">
                  <span className="font-semibold text-emerald-700">UPI Accepted:</span> <code>{shop.upiId}</code>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={`Search products in ${shop.shopName}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 shadow-sm">
            <FiPackage size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No products available in this view</p>
            <p className="text-xs text-slate-400 mt-1">Try switching categories or clearing your search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const inCartItem = cartItems.find((i) => i.productId === p.id);
              const qtyInCart = inCartItem ? inCartItem.quantity : 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Product Image */}
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-44 object-cover border-b border-slate-100"
                      />
                    ) : (
                      <div className="w-full h-44 bg-slate-50 border-b border-slate-100 flex items-center justify-center text-slate-300">
                        <FiPackage size={40} />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.category?.name || "General"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.isAvailable
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {p.availability === "AVAILABLE" ? "Available" : "Out of Stock"}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-slate-900">
                          ₹{parseFloat(p.sellingPrice).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">/ {p.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Footer */}
                  <div className="p-5 pt-0">
                    {!p.isAvailable ? (
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
                        ₹{item.sellingPrice.toFixed(2)} / {item.unit}
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
                  <span>₹{subtotal.toFixed(2)}</span>
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

      {/* Verified Checkout Summary Modal (Ready for Milestone 5 Payment) */}
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
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <p><strong>Shop:</strong> {verifiedCheckout.shop.shopName}</p>
                <p><strong>Address:</strong> {verifiedCheckout.shop.address}</p>
                {verifiedCheckout.shop.upiId && (
                  <p><strong>UPI Destination:</strong> <code>{verifiedCheckout.shop.upiId}</code></p>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {verifiedCheckout.items.map((i) => (
                  <div key={i.productId} className="py-2 flex justify-between text-xs">
                    <span>{i.productName} × {i.quantity} {i.unit}</span>
                    <span className="font-bold">₹{i.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-lg text-slate-900">
                <span>Total Calculated Amount</span>
                <span className="text-emerald-700">₹{verifiedCheckout.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => alert("Milestone 5 will complete online payment & pickup ID generation!")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                Pay & Generate Pickup ID (Milestone 5)
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

      {/* Cross-Shop Conflict Modal */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Different Shop Selected</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your cart currently contains items from <strong>{conflictModal.currentShop.shopName}</strong>.
              ShopFlow orders are fulfilled shop-by-shop for store pickup.
            </p>
            <p className="text-xs text-amber-700 font-semibold mt-2">
              Would you like to clear your current cart and start a new order with <strong>{conflictModal.shop.shopName}</strong>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConflictModal(null)}
                className="border border-slate-300 text-slate-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Keep Existing Cart
              </button>
              <button
                onClick={handleConfirmConflict}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Clear Cart & Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopStorefront;
