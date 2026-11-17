import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiLogOut,
  FiBriefcase,
  FiBox,
  FiList,
  FiTrendingUp,
  FiShoppingBag,
  FiPlus,
  FiCopy,
  FiCheck,
  FiEdit2,
  FiMapPin,
  FiPhone,
  FiCreditCard,
} from "react-icons/fi";
import { vendorGetMe, logout } from "../../services/authService";
import { updateMyShop } from "../../services/shopService";

function VendorDashboard() {
  const [vendorData, setVendorData] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Edit Shop Modal / Inline State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    shopName: "",
    address: "",
    contactNumber: "",
    upiId: "",
    latitude: "",
    longitude: "",
  });
  const [savingShop, setSavingShop] = useState(false);
  const [editError, setEditError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "VENDOR") {
      navigate("/vendor/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await vendorGetMe();
        setVendorData(res.vendor);
        setShop(res.shop);
        if (res.shop) {
          setEditForm({
            shopName: res.shop.shopName || "",
            address: res.shop.address || "",
            contactNumber: res.shop.contactNumber || "",
            upiId: res.shop.upiId || "",
            latitude: res.shop.latitude !== null && res.shop.latitude !== undefined ? res.shop.latitude.toString() : "",
            longitude: res.shop.longitude !== null && res.shop.longitude !== undefined ? res.shop.longitude.toString() : "",
          });
        }
      } catch {
        const cachedUser = localStorage.getItem("user");
        const cachedShop = localStorage.getItem("shop");
        if (cachedUser) setVendorData(JSON.parse(cachedUser));
        if (cachedShop) {
          const s = JSON.parse(cachedShop);
          setShop(s);
          setEditForm({
            shopName: s.shopName || "",
            address: s.address || "",
            contactNumber: s.contactNumber || "",
            upiId: s.upiId || "",
            latitude: s.latitude ? s.latitude.toString() : "",
            longitude: s.longitude ? s.longitude.toString() : "",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/vendor/login");
  };

  const handleCopyShopId = () => {
    if (shop?.shopId) {
      navigator.clipboard.writeText(shop.shopId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      setSavingShop(true);
      setEditError("");
      const res = await updateMyShop({
        shopName: editForm.shopName.trim(),
        address: editForm.address.trim(),
        contactNumber: editForm.contactNumber.trim(),
        upiId: editForm.upiId.trim() || undefined,
        latitude: editForm.latitude ? parseFloat(editForm.latitude) : undefined,
        longitude: editForm.longitude ? parseFloat(editForm.longitude) : undefined,
      });

      setShop(res.shop);
      localStorage.setItem("shop", JSON.stringify(res.shop));
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update shop");
    } finally {
      setSavingShop(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Loading vendor portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🛒</span> ShopFlow <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Vendor</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{vendorData?.ownerName || "Shop Owner"}</p>
            <p className="text-xs text-slate-500">{vendorData?.mobile}</p>
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
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Shop Status Banner or Active Shop Card */}
        {!shop ? (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                Action Required
              </span>
              <h2 className="text-2xl font-black text-amber-950 mt-2 flex items-center gap-2">
                <FiBriefcase /> Register Your Shop Profile
              </h2>
              <p className="text-sm text-amber-800/90 mt-1 max-w-xl">
                You have authenticated your vendor account. Register your physical shop name, address, GPS location, and UPI ID to unlock product management, inventory, and incoming orders.
              </p>
            </div>
            <Link
              to="/vendor/register-shop"
              className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 text-sm whitespace-nowrap shadow-sm cursor-pointer"
            >
              <FiPlus size={18} /> Register Shop Now
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs px-3 py-1.5 rounded-lg">
                    Shop ID: {shop.shopId}
                    <button
                      onClick={handleCopyShopId}
                      title="Copy Shop ID"
                      className="text-blue-600 hover:text-blue-800 ml-1 cursor-pointer"
                    >
                      {copied ? <FiCheck size={14} className="text-emerald-600" /> : <FiCopy size={14} />}
                    </button>
                  </span>
                  {copied && <span className="text-xs text-emerald-600 font-semibold">Copied!</span>}
                </div>

                <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                  {shop.shopName}
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <FiMapPin size={14} className="text-slate-400" /> {shop.address}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition cursor-pointer"
                >
                  <FiEdit2 size={14} /> {isEditing ? "Close Editor" : "Edit Shop Details"}
                </button>
              </div>
            </div>

            {/* Quick Details Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FiPhone size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Contact</p>
                  <p className="font-semibold">{shop.contactNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <FiCreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">UPI Destination</p>
                  <p className="font-semibold font-mono text-xs">{shop.upiId || "Not Configured"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <FiMapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">GPS Coordinates</p>
                  <p className="font-semibold text-xs">
                    {shop.latitude && shop.longitude
                      ? `${shop.latitude.toFixed(4)}, ${shop.longitude.toFixed(4)}`
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Shop Editor */}
            {isEditing && (
              <form onSubmit={handleSaveShop} className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                <h3 className="text-base font-bold text-slate-800">Update Shop Information</h3>
                {editError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{editError}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Shop Name</label>
                    <input
                      type="text"
                      value={editForm.shopName}
                      onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={editForm.contactNumber}
                      onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">UPI Destination ID</label>
                    <input
                      type="text"
                      value={editForm.upiId}
                      onChange={(e) => setEditForm({ ...editForm, upiId: e.target.value })}
                      placeholder="name@okhdfcbank"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.latitude}
                      onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.longitude}
                      onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="border border-slate-300 px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingShop}
                    className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-blue-700 cursor-pointer"
                  >
                    {savingShop ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Milestone Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <FiBox size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Products & Stock</h4>
            <p className="text-xs text-slate-500 mt-1">Manage catalog, cost & selling prices, and stock counts.</p>
            <span className="inline-block mt-4 text-xs font-semibold text-blue-600">Milestone 3</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <FiList size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Categories</h4>
            <p className="text-xs text-slate-500 mt-1">Organize products into shop-specific categories.</p>
            <span className="inline-block mt-4 text-xs font-semibold text-indigo-600">Milestone 3</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <FiShoppingBag size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Incoming Orders</h4>
            <p className="text-xs text-slate-500 mt-1">Verify pickup IDs and hand over verified purchases.</p>
            <span className="inline-block mt-4 text-xs font-semibold text-emerald-600">Milestone 5</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <FiTrendingUp size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Walk-in Billing & POS</h4>
            <p className="text-xs text-slate-500 mt-1">Generate PDF receipts for in-store customers.</p>
            <span className="inline-block mt-4 text-xs font-semibold text-purple-600">Milestone 5</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorDashboard;
