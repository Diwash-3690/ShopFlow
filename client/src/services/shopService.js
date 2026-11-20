import api from "./api";

// Register new shop for authenticated vendor
export const createShop = async (shopData) => {
  const response = await api.post("/shops", shopData);
  return response.data;
};

// Get current vendor's shop
export const getMyShop = async () => {
  const response = await api.get("/shops/me");
  return response.data;
};

// Update current vendor's shop
export const updateMyShop = async (shopData) => {
  const response = await api.put("/shops/me", shopData);
  return response.data;
};

// Delete current vendor's registered shop
export const deleteMyShop = async () => {
  const response = await api.delete("/shops/me");
  return response.data;
};

// Public shop lookup by shopId or id
export const getPublicShopById = async (shopId) => {
  const response = await api.get(`/shops/public/${shopId}`);
  return response.data;
};

// Public search for nearby shops (by query or GPS)
export const searchNearbyShops = async (params = {}) => {
  const response = await api.get("/shops/search", { params });
  return response.data;
};

// Reverse geocode GPS coordinates to human-readable physical address
export const reverseGeocode = async (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (isNaN(latitude) || isNaN(longitude)) return "";

  // Concurrently race Backend Proxy, BigDataCloud, and OSM Nominatim for instant (<600ms) resolution
  const fetchBackend = async () => {
    const response = await api.get("/shops/reverse-geocode", {
      params: { lat: latitude, lng: longitude },
      timeout: 5000,
    });
    if (response.data?.success && response.data?.address?.trim()) {
      return response.data.address.trim();
    }
    throw new Error("Backend proxy empty");
  };

  const fetchBDC = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error("BDC error");
    const bdcData = await res.json();
    const parts = [
      bdcData.locality,
      bdcData.city,
      bdcData.principalSubdivision,
      bdcData.postcode,
      bdcData.countryName,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    throw new Error("BDC empty");
  };

  const fetchOSM = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error("OSM error");
    const data = await res.json();
    if (data?.display_name?.trim()) return data.display_name.trim();
    throw new Error("OSM empty");
  };

  try {
    return await Promise.any([fetchBackend(), fetchBDC(), fetchOSM()]);
  } catch (err) {
    return `Location near GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
  }
};
