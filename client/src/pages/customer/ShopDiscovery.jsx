import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiSearch,
  FiMapPin,
  FiShoppingBag,
  FiArrowRight,
  FiPhone,
  FiCheckCircle,
} from "react-icons/fi";
import { searchNearbyShops } from "../../services/shopService";

function ShopDiscovery() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.radius = 30; // 30 km radius
      }

      const res = await searchNearbyShops(params);
      setShops(res.shops || []);
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, userCoords]);

  const location = useLocation();

  useEffect(() => {
    loadShops();

    const handleFocus = () => loadShops();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
    };
  }, [loadShops, location.key]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingGps(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        setGpsError(err.message || "Failed to retrieve location.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link
            to="/customer/dashboard"
            className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5 text-sm font-medium"
          >
            <FiArrowLeft /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-sm">Discover Shops</span>
        </div>

        <Link
          to="/customer/dashboard"
          className="text-slate-900 font-black text-xl tracking-tight flex items-center gap-2"
        >
          <span>🛍️</span> ShopFlow
        </Link>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Local Commerce
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Discover Local Neighborhood Shops
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Select a store to view its exclusive product catalog, add items to your cart, pay with UPI, and pick up your order with ease.
          </p>
        </div>

        {/* Search & Location Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by shop name, address, or Shop ID (e.g. SHOP-A1B2C)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingGps}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-xs ${
              userCoords
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
            }`}
          >
            <FiMapPin size={16} />
            {detectingGps
              ? "Locating..."
              : userCoords
              ? "Nearby Filter Active"
              : "Detect Nearby Shops (GPS)"}
          </button>
        </div>

        {gpsError && (
          <p className="text-xs text-red-600 px-2">{gpsError}</p>
        )}

        {userCoords && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-2.5 rounded-xl">
            <span className="flex items-center gap-1.5 font-medium">
              <FiCheckCircle className="text-emerald-600" /> Showing shops sorted by distance from your coordinates.
            </span>
            <button
              onClick={() => setUserCoords(null)}
              className="text-emerald-700 underline font-semibold cursor-pointer"
            >
              Clear GPS
            </button>
          </div>
        )}

        {/* Shops Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200">
            Finding available shops...
          </div>
        ) : shops.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 shadow-sm">
            <FiShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No shops found matching your search</p>
            <p className="text-xs text-slate-400 mt-1">
              Try searching with a different shop name, Shop ID, or clearing the filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {shop.shopId}
                    </span>

                    {shop.distanceKm !== null && shop.distanceKm !== undefined && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <FiMapPin size={12} /> {shop.distanceKm} km away
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {shop.shopName}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {shop.address}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiPhone size={13} className="text-slate-400" /> {shop.contactNumber}
                    </span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {shop._count?.products || 0} products
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => navigate(`/shops/${shop.shopId}`)}
                    className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Visit Store</span>
                    <FiArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ShopDiscovery;
