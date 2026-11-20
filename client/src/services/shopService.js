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

  // 1. Primary Strategy: Backend Proxy (/api/shops/reverse-geocode)
  // Backend has full Node.js network access, sets compliant User-Agent headers, and bypasses browser CORS limitations
  try {
    const response = await api.get("/shops/reverse-geocode", {
      params: { lat: latitude, lng: longitude },
      timeout: 6000,
    });
    if (response.data?.success && response.data?.address && response.data.address.trim()) {
      return response.data.address.trim();
    }
  } catch (e) {
    // Proceed to direct browser fallback
  }

  // 2. Direct Browser Fallback: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name && data.display_name.trim()) {
        return data.display_name.trim();
      }
    }
  } catch (e) {
    // Proceed to next fallback
  }

  // 3. Fallback: BigDataCloud Client API (Designed for browser client-side use)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const parts = [
        bdcData.locality,
        bdcData.city,
        bdcData.principalSubdivision,
        bdcData.postcode,
        bdcData.countryName,
      ].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
  } catch (e) {
    // Proceed to guaranteed fallback
  }

  // 4. Guaranteed fallback so the address field is NEVER empty
  return `Location near GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
};
