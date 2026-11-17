import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiLogOut, FiBriefcase, FiBox, FiList, FiTrendingUp, FiShoppingBag, FiPlus } from "react-icons/fi";
import { vendorGetMe, logout } from "../../services/authService";

function VendorDashboard() {
  const [vendorData, setVendorData] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
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
      } catch {
        // Fallback to localStorage if offline
        const cachedUser = localStorage.getItem("user");
        const cachedShop = localStorage.getItem("shop");
        if (cachedUser) setVendorData(JSON.parse(cachedUser));
        if (cachedShop) setShop(JSON.parse(cachedShop));
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
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-lg text-sm transition"
          >
            <FiLogOut size={16} /> <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Shop Status Banner */}
        {!shop ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <FiBriefcase /> Shop Registration Required
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                You have verified your vendor account. Complete your shop profile (shop name, address, GPS location & UPI ID) to start adding products and receiving orders.
              </p>
            </div>
            <button
              onClick={() => alert("Shop Registration form will be unlocked in Milestone 2!")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 whitespace-nowrap"
            >
              <FiPlus /> Register Shop
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded">
                  Shop ID: {shop.shopId}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">{shop.shopName}</h2>
                <p className="text-sm text-slate-600 mt-1">{shop.address} • Contact: {shop.contactNumber}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600">
                <p className="font-semibold text-slate-800">UPI Destination:</p>
                <p className="font-mono text-blue-600">{shop.upiId || "Not configured"}</p>
              </div>
            </div>
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
