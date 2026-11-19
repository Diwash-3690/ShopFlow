import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Phone,
  Search,
  Package,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Minus,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Flame,
  TrendingUp,
} from "lucide-react";
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
import ReportIssueModal from "../../components/ReportIssueModal";
import ShopFlowRoleLogo from "../../components/ShopFlowRoleLogo";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Alert, AlertDescription } from "../../components/ui/alert";

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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

  const location = useLocation();

  useEffect(() => {
    loadStoreData();

    const handleFocus = () => loadStoreData();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
    };
  }, [loadStoreData, location.key]);

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
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center space-y-3">
        <Package className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900">Shop Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The shop you are looking for may have updated its profile or is currently inactive.
        </p>
        <Button
          onClick={() => navigate("/shops")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          Browse Nearby Stores
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/shops")}
            className="h-9 w-9 text-slate-500 hover:text-slate-900 rounded-xl"
            title="Back to shops"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              {shop.shopName}
            </h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
              {shop.shopId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ShopFlowRoleLogo
            role="CUSTOMER"
            isDirty={totalCount > 0 || isCartOpen || !!upiOrderData}
            customWarningMessage="You have an active cart or pending order at this shop. Do you want to leave without completing your order? Click Cancel to stay."
            className="hidden sm:inline-flex"
          />

          {/* Cart Button */}
          <Button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-9 rounded-xl font-bold text-xs shadow-xs gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {totalCount > 0 && (
              <span className="bg-white text-emerald-800 rounded-full px-1.5 py-0.2 text-[10px] font-black ml-0.5">
                {totalCount}
              </span>
            )}
          </Button>
        </div>
      </nav>

      {/* Store Header Banner */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified Merchant
              </Badge>
              {shop.upiId && (
                <Badge variant="purple" className="text-[10px] font-mono font-bold py-0.5 px-2">
                  UPI: {shop.upiId}
                </Badge>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {shop.shopName}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-0.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{shop.address}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px]">{shop.contactNumber}</span>
              </span>
            </div>
          </div>

          {/* Quick Notice & Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 max-w-sm">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>🛍️</span> Store Counter Pickup
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Order online, pay zero-cost directly via merchant UPI, and collect at counter with your secret Pickup ID.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              className="text-xs font-bold text-rose-700 bg-rose-50/70 hover:bg-rose-100 border-rose-200 h-8 rounded-xl gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Report Shop</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Controls: Category Dropdown & Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Category Dropdown */}
            <div className="shrink-0 w-full sm:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200/90 rounded-xl h-9 px-3 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Categories ({products.length})</option>
                {categories.map((c) => {
                  const count = products.filter((p) => p.categoryId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 min-w-0">
              <Button
                variant={selectedCategory === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("ALL")}
                className={`rounded-xl text-xs font-bold whitespace-nowrap h-8 px-3 ${
                  selectedCategory === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedCategory === c.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`rounded-xl text-xs font-bold whitespace-nowrap h-8 px-3 ${
                    selectedCategory === c.id
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-9 text-xs bg-white border-slate-200 rounded-xl h-9 shadow-2xs"
            />
          </div>
        </div>

        {/* Most Selling Item Spotlight Banner */}
        {products.some((p) => p.isMostSelling) && selectedCategory === "ALL" && !searchQuery.trim() && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Flame className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-white font-bold text-[10px] tracking-wide uppercase px-2 py-0.5">
                    Top Priority
                  </Badge>
                  <span className="text-xs font-semibold text-amber-900">
                    Customer Favorite
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                  Featured: Most selling item is prioritized and pinned at the top!
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="rounded-3xl border-slate-200 p-12 text-center text-slate-500 space-y-3 bg-white">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No products match your criteria</p>
            <p className="text-xs text-slate-400">
              Try selecting a different category or clearing your search query.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((p) => {
              const itemInCart = cartItems.find((ci) => ci.productId === p.id);
              const qtyInCart = itemInCart ? itemInCart.quantity : 0;
              const isOutOfStock = !p.isAvailable;

              return (
                <Card
                  key={p.id}
                  className={`rounded-2xl overflow-hidden flex flex-col transition-all duration-200 bg-white ${
                    p.isMostSelling
                      ? "border-amber-300 shadow-md ring-2 ring-amber-400/20 hover:border-amber-400"
                      : "border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300"
                  }`}
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
                        <Package className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    {/* Most Selling Badge */}
                    {p.isMostSelling && (
                      <span className="absolute top-2.5 left-2.5 z-10">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider py-0.5 px-2 shadow-xs border-0 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-white fill-white" />
                          <span>Most Selling Item</span>
                        </Badge>
                      </span>
                    )}

                    {/* Availability Tag */}
                    <span className="absolute top-2.5 right-2.5 z-10">
                      <Badge
                        variant={p.isAvailable ? "success" : "destructive"}
                        className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 shadow-xs"
                      >
                        {p.availability === "OUT_OF_STOCK" || !p.isAvailable ? "Out of Stock" : "In Stock"}
                      </Badge>
                    </span>
                  </div>

                  {/* Card Content Body */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        {p.categoryName || "General"}
                      </p>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mt-0.5">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Registered Price
                        </span>
                        <Badge variant="outline" className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border-emerald-200/80 px-1.5 py-0">
                          Fixed by Shop Owner
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900">
                          ₹{parseFloat(p.sellingPrice || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ {p.unit}</span>
                      </div>
                    </div>

                    {/* Action: Add to Cart / Qty Stepper */}
                    {isOutOfStock ? (
                      <Button
                        disabled
                        variant="secondary"
                        className="w-full h-9 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed"
                      >
                        Out of Stock
                      </Button>
                    ) : qtyInCart > 0 ? (
                      <div className="flex items-center justify-between border border-emerald-400/80 rounded-xl bg-emerald-50/60 p-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(p.id, qtyInCart - 1)}
                          className="w-7 h-7 rounded-lg bg-white border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-100 shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-xs font-bold text-emerald-950 px-2">
                          {qtyInCart} in cart
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(p.id, qtyInCart + 1)}
                          className="w-7 h-7 rounded-lg bg-white border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-100 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(p)}
                        className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold h-9 rounded-xl text-xs gap-1.5 shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl p-6 overflow-hidden animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Your Cart</h3>
                {activeShop && (
                  <p className="text-xs text-slate-500 mt-0.5">Shop: {activeShop.shopName}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">Your cart is empty</p>
                  <p className="text-xs text-slate-400">Add fresh items from this store to proceed.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.productName}</p>
                      <p className="text-xs text-slate-500">
                        Registered Price: ₹{parseFloat(item.sellingPrice || 0).toFixed(2)} / {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {checkoutError && (
                  <Alert variant="destructive" className="py-2.5 text-xs">
                    <AlertDescription className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>{checkoutError}</span>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between text-base font-black text-slate-900">
                  <span>Subtotal</span>
                  <span className="text-emerald-700">₹{parseFloat(subtotal || 0).toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  One order belongs to one shop only. Validated directly against live inventory.
                </p>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="h-11 px-4 text-xs font-bold text-slate-600 rounded-xl"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleProceedToCheckout}
                    disabled={calculating}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs shadow-sm"
                  >
                    {calculating ? "Verifying Bill..." : "Proceed to Checkout"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Verified Checkout Summary Modal */}
      <Dialog open={!!verifiedCheckout} onOpenChange={(open) => !open && setVerifiedCheckout(null)}>
        <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <DialogTitle className="text-lg font-black text-slate-900">Verified Order Summary</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Review live inventory prices before generating your payment intent.
            </DialogDescription>
          </DialogHeader>

          {verifiedCheckout && (
            <div className="space-y-4 pt-1">
              <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1 border border-slate-200/80">
                <p>
                  <strong>Shop:</strong> {verifiedCheckout.shop.shopName}
                </p>
                <p>
                  <strong>Address:</strong> {verifiedCheckout.shop.address}
                </p>
                {verifiedCheckout.shop.upiId && (
                  <p>
                    <strong>UPI Destination:</strong> <code className="font-bold text-purple-800">{verifiedCheckout.shop.upiId}</code>
                  </p>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl p-3 border border-slate-100">
                {verifiedCheckout.items.map((i) => (
                  <div key={i.productId} className="py-2 flex justify-between text-xs first:pt-0 last:pb-0">
                    <span>
                      {i.productName} <span className="text-slate-400 font-mono">× {i.quantity} {i.unit}</span>
                    </span>
                    <span className="font-bold text-slate-800">₹{parseFloat(i.lineTotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-lg text-slate-900">
                <span>Total Amount</span>
                <span className="text-emerald-700">₹{parseFloat(verifiedCheckout.totalAmount || 0).toFixed(2)}</span>
              </div>

              <DialogFooter className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={handleInitiatePayment}
                  disabled={placingOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{placingOrder ? "Initiating Order..." : "Proceed to Direct UPI Payment"}</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setVerifiedCheckout(null)}
                  className="text-xs text-slate-500 h-8"
                >
                  Back to Cart
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 2: UPI Intent & Payment Modal */}
      <Dialog open={!!upiOrderData} onOpenChange={(open) => !open && setUpiOrderData(null)}>
        <DialogContent className="max-w-md p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="space-y-1">
            <Badge variant="purple" className="w-fit text-[10px] font-bold uppercase tracking-wider py-0.5 px-2">
              Direct UPI Payment
            </Badge>
            <DialogTitle className="text-lg font-black text-slate-900">Pay Direct to Merchant</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Zero platform fees. 100% of your payment reaches the local shopkeeper.
            </DialogDescription>
          </DialogHeader>

          {upiOrderData && (
            <div className="space-y-4 pt-1">
              <div className="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs text-purple-800 font-semibold">Paying directly to merchant:</p>
                <h4 className="text-lg font-black text-purple-950">{upiOrderData.shop.shopName}</h4>
                <div className="font-mono text-xs bg-white px-3 py-1.5 rounded-lg border border-purple-200 inline-block text-purple-900 font-bold">
                  {upiOrderData.shop.upiId}
                </div>
                <div className="pt-2">
                  <span className="text-3xl font-black text-purple-950">
                    ₹{parseFloat(upiOrderData.order.totalAmount).toFixed(2)}
                  </span>
                  <p className="text-[10px] text-purple-600 mt-0.5 font-mono">
                    Order Ref: {upiOrderData.order.orderNumber}
                  </p>
                </div>
              </div>

              {/* Quick UPI Intent Link */}
              <div className="space-y-2">
                <a
                  href={upiOrderData.upiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open UPI App (GPay / PhonePe / Paytm)</span>
                </a>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  On mobile devices, this will launch your UPI application with exact amount and merchant UPI ID.
                </p>
              </div>

              {/* Verification reference input */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    12-Digit UPI Reference / UTR Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => {
                      setTransactionRef(e.target.value);
                      if (utrError) setUtrError("");
                    }}
                    placeholder="e.g. 431289456721 (from your payment receipt)"
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    Copy the 12-digit UTR/UPI Ref from your UPI receipt and paste here for merchant verification.
                  </p>
                  {utrError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{utrError}</span>
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSubmitPayment}
                  disabled={verifyingPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{verifyingPayment ? "Submitting..." : "I Have Paid via UPI • Submit for Verification"}</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setUpiOrderData(null)}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 h-8"
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 3: Confirmed / Submitted Order Modal */}
      <Dialog open={!!confirmedOrder} onOpenChange={(open) => !open && navigate("/customer/dashboard")}>
        <DialogContent className="max-w-md p-6 sm:p-7 rounded-3xl text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          {confirmedOrder && (
            <div className="space-y-4">
              <div>
                <Badge
                  variant={confirmedOrder.pickupId ? "success" : "purple"}
                  className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5"
                >
                  {confirmedOrder.pickupId ? "Payment Verified • Order Confirmed" : "Direct UPI Payment Submitted"}
                </Badge>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {confirmedOrder.pickupId ? "Ready for Counter Pickup!" : "Payment Under Verification"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {confirmedOrder.pickupId
                    ? "Show this unique Pickup ID to the shopkeeper at the store counter."
                    : "Your direct UPI payment has been received. The merchant will verify bank credit and activate your unique Pickup ID."}
                </p>
              </div>

              {/* Pickup ID Display if available */}
              {confirmedOrder.pickupId ? (
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    Your Unique Pickup ID
                  </p>
                  <p className="text-3xl font-mono font-black tracking-wider text-emerald-400 mt-1">
                    {confirmedOrder.pickupId}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(confirmedOrder.pickupId)}
                    className="mt-3 bg-white/10 hover:bg-white/20 text-white text-xs h-8 px-3 rounded-lg gap-1.5 border-0"
                  >
                    {copiedPickupId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPickupId ? "Copied!" : "Copy Pickup ID"}</span>
                  </Button>
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-200/80 p-3.5 rounded-2xl text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700 font-semibold">Order Number</span>
                    <span className="font-mono font-bold text-purple-950">{confirmedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700 font-semibold">Total Amount</span>
                    <span className="font-bold text-purple-950">₹{parseFloat(confirmedOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
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

              <Button
                onClick={() => navigate("/customer/dashboard")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs shadow-sm"
              >
                Go to My Orders & Track Status
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Receipt Modal */}
      {activeBill && (
        <BillModal bill={activeBill} onClose={() => setActiveBill(null)} />
      )}

      {/* Cross-Shop Conflict Modal */}
      <Dialog open={!!conflictModal} onOpenChange={(open) => !open && setConflictModal(null)}>
        <DialogContent className="max-w-md p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-black text-slate-900">Different Shop Selected</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              ShopFlow orders are fulfilled shop-by-shop for store pickup.
            </DialogDescription>
          </DialogHeader>

          {conflictModal && (
            <div className="space-y-3 pt-1 text-xs text-slate-600">
              <p>
                Your cart currently contains items from <strong>{conflictModal.currentShop.shopName}</strong>.
              </p>
              <p className="font-semibold text-amber-700">
                Would you like to clear your existing cart and start a new order with{" "}
                <strong>{conflictModal.newShop.shopName}</strong>?
              </p>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConflictModal(null)}
                  className="text-xs font-semibold h-9"
                >
                  Keep Existing Cart
                </Button>
                <Button
                  onClick={handleConfirmSwitchShop}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4"
                >
                  Start New Cart
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        shopId={shop?.id}
        shopName={shop?.shopName}
      />
    </div>
  );
}

export default ShopStorefront;
