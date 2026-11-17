import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiLogOut, FiShoppingBag, FiClock, FiSearch } from "react-icons/fi";
import { customerGetMe, logout } from "../../services/authService";

function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "CUSTOMER") {
      navigate("/customer/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await customerGetMe();
        setCustomer(res.customer);
      } catch {
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) setCustomer(JSON.parse(cachedUser));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/customer/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Loading customer account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🛍️</span> ShopFlow <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">Customer</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{customer?.mobile}</p>
            <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
              ✓ Mobile Verified
            </span>
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
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Banner to Discover Shops */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              Explore Local Stores
            </span>
            <h2 className="text-3xl font-extrabold mt-3 tracking-tight">Find shops near your current location</h2>
            <p className="mt-2 text-white/85 text-sm max-w-xl">
              Browse products from your favorite neighborhood vendor, pay securely through your preferred UPI app, and pick up using your unique Pickup ID.
            </p>
          </div>
          <button
            onClick={() => alert("Shop discovery & map search will be unlocked in Milestone 4!")}
            className="bg-white text-emerald-800 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition shadow-sm flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer"
          >
            <FiSearch size={18} /> Discover Shops
          </button>
        </div>

        {/* Active Pickup Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FiShoppingBag className="text-emerald-600" /> Active Pickup Orders
            </h3>
            <span className="text-xs text-slate-400">Milestone 5</span>
          </div>
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
            <p className="font-medium text-slate-600">No active pickup orders at the moment.</p>
            <p className="text-xs text-slate-400 mt-1">Once you order online from a shop, your pickup ID will appear here.</p>
          </div>
        </div>

        {/* Past Orders & Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FiClock className="text-slate-600" /> Order History & Receipts
            </h3>
            <span className="text-xs text-slate-400">Milestone 6</span>
          </div>
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
            <p className="font-medium text-slate-600">No previous orders found.</p>
            <p className="text-xs text-slate-400 mt-1">All your completed orders and printable bills will be stored here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerDashboard;
