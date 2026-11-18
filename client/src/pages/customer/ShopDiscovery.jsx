import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  MapPin,
  Store,
  ArrowRight,
  Phone,
  CheckCircle2,
  Navigation,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { searchNearbyShops } from "../../services/shopService";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-3">
          <Link
            to="/customer/dashboard"
            className="text-slate-500 hover:text-slate-900 transition flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">Discover Shops</span>
        </div>

        <Link
          to="/customer/dashboard"
          className="text-slate-900 font-black text-lg sm:text-xl tracking-tight flex items-center gap-2"
        >
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
            🛍️
          </span>
          <span className="hidden sm:inline">ShopFlow</span>
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Banner Section */}
        <div className="space-y-1.5">
          <Badge variant="success" className="text-[11px] gap-1 px-3 py-1 font-bold">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Nearby Retail Marketplace
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Discover Verified Local Stores
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Browse products from neighborhood merchants, pay securely via direct UPI, and pick up your ready order at the counter.
          </p>
        </div>

        {/* Search & Location Bar */}
        <Card className="p-3 sm:p-4 rounded-3xl border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <Input
              type="text"
              placeholder="Search by shop name, address, or Shop ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-xs sm:text-sm rounded-2xl"
            />
          </div>

          <Button
            type="button"
            variant={userCoords ? "outline" : "success"}
            onClick={handleDetectLocation}
            disabled={detectingGps}
            className={`h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold gap-2 whitespace-nowrap shadow-xs ${
              userCoords ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""
            }`}
          >
            <Navigation className={`w-4 h-4 ${detectingGps ? "animate-spin text-emerald-600" : ""}`} />
            {detectingGps
              ? "Detecting Coordinates..."
              : userCoords
              ? "GPS Active (Nearby Filter)"
              : "Detect Nearby Shops (GPS)"}
          </Button>
        </Card>

        {gpsError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {userCoords && (
          <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs px-4 py-2.5 rounded-2xl">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Displaying stores ordered by proximity to your live location.</span>
            </span>
            <button
              onClick={() => setUserCoords(null)}
              className="text-emerald-700 font-bold hover:underline cursor-pointer ml-3 text-xs"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Shops Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card key={idx} className="p-6 rounded-3xl border-slate-200/80 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="w-20 h-5 bg-slate-200 rounded-lg" />
                  <div className="w-16 h-5 bg-slate-200 rounded-full" />
                </div>
                <div className="w-3/4 h-6 bg-slate-200 rounded-md" />
                <div className="w-full h-10 bg-slate-100 rounded-md" />
                <div className="w-full h-10 bg-slate-200 rounded-xl mt-4" />
              </Card>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <Card className="py-16 text-center text-slate-500 rounded-3xl border-slate-200/90 shadow-xs">
            <CardContent className="space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Stores Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No shops match your query. Try searching with a different keyword or resetting your location filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shops.map((shop) => (
              <Card
                key={shop.id}
                className="rounded-3xl border-slate-200/90 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group overflow-hidden bg-white"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                      {shop.shopId}
                    </span>

                    {shop.distanceKm !== null && shop.distanceKm !== undefined ? (
                      <Badge variant="success" className="gap-1 font-bold text-[11px]">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{shop.distanceKm} km</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition tracking-tight">
                      {shop.shopName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {shop.address || "Local neighborhood store"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.contactNumber || "N/A"}</span>
                    </span>
                    <Badge variant="outline" className="font-bold text-[11px] bg-slate-50">
                      {shop._count?.products || 0} items
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                  <Button
                    onClick={() => navigate(`/shops/${shop.shopId}`)}
                    className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold h-10 rounded-xl gap-2 shadow-sm transition"
                  >
                    <span>Visit Storefront</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ShopDiscovery;
