import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Store,
  Navigation,
} from "lucide-react";
import { createShop, getMyShop, reverseGeocode } from "../../services/shopService";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription } from "../../components/ui/alert";
import ShopFlowRoleLogo from "../../components/ShopFlowRoleLogo";

function ShopRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shopName: "",
    contactNumber: "",
    address: "",
    shopNumber: "",
    latitude: "",
    longitude: "",
    upiId: "",
  });

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [locSuccess, setLocSuccess] = useState(false);
  const [addressDetected, setAddressDetected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "VENDOR") {
      navigate("/vendor/login");
      return;
    }

    // If vendor already has shop, redirect to dashboard
    getMyShop()
      .then((res) => {
        if (res.hasShop && res.shop) {
          navigate("/vendor/dashboard");
        }
      })
      .catch(() => {});

    // Pre-fill contact number with vendor's registered mobile
    try {
      const cached = localStorage.getItem("user");
      if (cached) {
        const u = JSON.parse(cached);
        if (u.mobile) {
          setFormData((p) => ({ ...p, contactNumber: u.mobile }));
        }
      }
    } catch {
      // ignore
    }
  }, [navigate]);

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Detect GPS coordinates via browser Geolocation API & auto-fill physical address
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setErrorMsg("");
    setLocSuccess(false);
    setAddressDetected(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);

        // Immediately update coordinates and provide immediate visual feedback in address field
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: prev.address?.trim() ? prev.address : "Resolving street address from GPS...",
        }));

        try {
          // Reverse geocode to auto-fill physical address according to detected location
          const detectedAddress = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          const finalAddress = (detectedAddress && detectedAddress.trim()) || `Location near GPS (${lat}, ${lng})`;
          
          setFormData((prev) => ({
            ...prev,
            address: finalAddress,
          }));
          setAddressDetected(true);
          setLocSuccess(true);
        } catch (e) {
          console.warn("Reverse geocode failed:", e);
          setFormData((prev) => ({
            ...prev,
            address: `Location near GPS (${lat}, ${lng})`,
          }));
          setAddressDetected(true);
          setLocSuccess(true);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setErrorMsg(
          "Could not detect location: " + (err.message || "Permission denied. You can enter coordinates and address manually.")
        );
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.shopName.trim()) {
      setErrorMsg("Please enter your Shop Name.");
      return;
    }
    if (!formData.contactNumber.trim()) {
      setErrorMsg("Please enter a shop contact number.");
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg("Please enter the physical shop address.");
      return;
    }
    if (!formData.upiId.trim()) {
      setErrorMsg("Please enter your Shop UPI ID. It is mandatory for receiving customer direct payments.");
      return;
    }
    if (!/^[\w.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/.test(formData.upiId.trim())) {
      setErrorMsg("Please enter a valid UPI ID (e.g., yourshop@okhdfcbank or 9876543210@paytm).");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await createShop({
        shopName: formData.shopName.trim(),
        contactNumber: formData.contactNumber.trim(),
        address: formData.address.trim(),
        shopNumber: formData.shopNumber.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        upiId: formData.upiId.trim(),
      });

      localStorage.setItem("shop", JSON.stringify(res.shop));
      navigate("/vendor/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to register shop."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <ShopFlowRoleLogo
            role="VENDOR"
            isDirty={Object.values(formData).some((v) => !!v)}
            customWarningMessage="You have entered shop registration details that are not yet submitted. Do you want to leave without saving? Click Cancel to stay."
          />
          <Link
            to="/vendor/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Registration Card */}
        <Card className="rounded-3xl border-slate-200/90 shadow-sm p-6 sm:p-10 bg-white">
          <div className="mb-6 space-y-2">
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200">
              Merchant Onboarding
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Store className="w-7 h-7 text-blue-600" />
              <span>Register Your Shop</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Provide your physical shop details to begin publishing products, setting up inventory, and receiving verified customer counter pickups.
            </p>
          </div>

          {errorMsg && (
            <Alert variant="destructive" className="mb-6 py-2.5 text-xs font-medium">
              <AlertDescription className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{errorMsg}</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Shop Name <span className="text-rose-500">*</span>
              </label>
              <Input
                name="shopName"
                placeholder="e.g. Metro Supermarket, Sharma Sweets"
                value={formData.shopName}
                onChange={handleChange}
                className="text-xs h-10"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Shop Contact Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="contactNumber"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="text-xs h-10"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Unit / Shop Number (Optional)
                </label>
                <Input
                  name="shopNumber"
                  placeholder="e.g. Shop #12, Ground Floor"
                  value={formData.shopNumber}
                  onChange={handleChange}
                  className="text-xs h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Physical Shop Address <span className="text-rose-500">*</span>
                </label>
                {locating && (
                  <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5 animate-pulse bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    <MapPin className="w-3.5 h-3.5 animate-bounce" />
                    <span>Detecting GPS & resolving address...</span>
                  </span>
                )}
                {addressDetected && !locating && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-filled from GPS (Editable)</span>
                  </span>
                )}
              </div>
              <textarea
                name="address"
                rows={3}
                placeholder="Street address, landmark, area, city, pincode (Auto-filled on GPS detect or enter manually)"
                value={formData.address}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  addressDetected ? "bg-emerald-50/20 border-emerald-300" : "bg-white border-slate-300"
                }`}
                required
              />
              <p className="text-[11px] text-slate-500">
                ✏️ <strong>Editable:</strong> The physical address auto-populates when GPS is detected. You can freely edit, refine, or add shop number/floor/landmark.
              </p>
            </div>

            {/* GPS Location Section */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>GPS Location & Physical Address</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click detect to automatically capture your GPS coordinates and fill in your physical shop address.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDetectLocation}
                  disabled={locating}
                  className="h-9 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-0 rounded-xl gap-2 shadow-sm cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{locating ? "Detecting Location & Address..." : "Detect Current GPS & Address"}</span>
                </Button>
              </div>

              {locSuccess && (
                <div className="flex items-start gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">GPS Coordinates & Physical Address Captured!</p>
                    <p className="text-[11px] text-emerald-700 font-normal">
                      Latitude: <strong className="font-mono">{formData.latitude}</strong>, Longitude: <strong className="font-mono">{formData.longitude}</strong>.
                    </p>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Your physical address has been automatically populated in the box above. You can freely edit or append details anytime.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    name="latitude"
                    placeholder="e.g. 28.6139"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="text-xs bg-white h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    name="longitude"
                    placeholder="e.g. 77.2090"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="text-xs bg-white h-9"
                  />
                </div>
              </div>
            </div>

            {/* UPI ID Section (Mandatory) */}
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-purple-950 flex items-center justify-between">
                <span>Shop UPI ID / Direct Payment Destination <span className="text-rose-500">*</span></span>
                <Badge variant="outline" className="text-[9px] font-bold text-purple-700 bg-purple-100/70 border-purple-300">
                  Mandatory
                </Badge>
              </label>
              <p className="text-[11px] text-purple-800/80 leading-relaxed">
                When customers pay online for counter pickup orders, 100% of the funds route directly to this UPI ID (e.g., <code>yourshop@okhdfcbank</code> or <code>9876543210@paytm</code>).
              </p>
              <Input
                type="text"
                name="upiId"
                required
                placeholder="e.g. yourshop@okhdfcbank or 9876543210@paytm"
                value={formData.upiId}
                onChange={handleChange}
                className="text-xs font-mono bg-white h-10 border-purple-300 focus-visible:ring-purple-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-2xl text-xs shadow-sm mt-2"
            >
              {loading ? "Registering Shop..." : "Complete Shop Registration"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default ShopRegistration;
