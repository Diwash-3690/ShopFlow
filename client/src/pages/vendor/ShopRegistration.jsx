import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiMapPin, FiCheckCircle } from "react-icons/fi";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { createShop, getMyShop } from "../../services/shopService";

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

  // Detect GPS coordinates via browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocSuccess(true);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setErrorMsg(
          "Could not detect location: " + (err.message || "Permission denied. You can enter coordinates manually.")
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
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
        upiId: formData.upiId.trim() || undefined,
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          to="/vendor/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mb-6 font-medium"
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Milestone 2
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Register Your Shop
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide your shop details to begin publishing products, setting up inventory, and receiving verified customer pickup orders.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Shop Name *"
              name="shopName"
              placeholder="e.g. Metro Supermarket, Sharma Sweets"
              value={formData.shopName}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Shop Contact Number *"
                name="contactNumber"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.contactNumber}
                onChange={handleChange}
              />

              <InputField
                label="Unit / Shop Number (Optional)"
                name="shopNumber"
                placeholder="e.g. Shop #12, Ground Floor"
                value={formData.shopNumber}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Physical Shop Address *
              </label>
              <textarea
                name="address"
                rows={3}
                placeholder="Street address, landmark, area, city, pincode"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* GPS Location Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FiMapPin className="text-blue-600" /> GPS Location (For Customer Discovery)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Nearby customers use your coordinates to find your store.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locating}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <FiMapPin size={14} />
                  {locating ? "Detecting..." : "Detect Current GPS"}
                </button>
              </div>

              {locSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <FiCheckCircle size={14} /> GPS coordinates captured successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    placeholder="e.g. 28.6139"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    placeholder="e.g. 77.2090"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* UPI ID Section */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Vendor UPI ID / Payment Destination (Optional)
              </label>
              <p className="text-xs text-slate-600">
                When customers pay online for pickup orders, payments will route directly to this UPI address (e.g., <code>yourname@okhdfcbank</code>, <code>shopname@upi</code>).
              </p>
              <input
                type="text"
                name="upiId"
                placeholder="e.g. yourshop@okhdfcbank"
                value={formData.upiId}
                onChange={handleChange}
                className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" loading={loading}>
              Complete Shop Registration
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ShopRegistration;
