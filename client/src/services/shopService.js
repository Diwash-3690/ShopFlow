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
  // 1. Try backend proxy
  try {
    const response = await api.get("/shops/reverse-geocode", {
      params: { lat, lng },
      timeout: 5000,
    });
    if (response.data?.success && response.data?.address) {
      return response.data.address;
    }
  } catch (e) {
    // Fallback to direct client reverse geocoding
  }

  // 2. Fallback: BigDataCloud client API
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
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
    // Ignore fallback errors
  }

  return "";
};
