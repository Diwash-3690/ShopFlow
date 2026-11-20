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

  // 1. First Priority: Direct OpenStreetMap Nominatim (High accuracy, street level, ~300ms)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
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
    // try next
  }

  // 2. Second Priority: Photon Komoot (Global OpenStreetMap reverse geocoder, sub-200ms)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const props = data?.features?.[0]?.properties;
      if (props) {
        const parts = [
          props.name || props.street,
          props.locality || props.district,
          props.city || props.town,
          props.state,
          props.postcode,
          props.country,
        ].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(", ");
        }
      }
    }
  } catch (e) {
    // try next
  }

  // 3. Third Priority: Backend Proxy endpoint (/api/shops/reverse-geocode)
  try {
    const response = await api.get("/shops/reverse-geocode", {
      params: { lat: latitude, lng: longitude },
      timeout: 3000,
    });
    if (response.data?.success && response.data?.address && response.data.address.trim()) {
      return response.data.address.trim();
    }
  } catch (e) {
    // try next
  }

  // 4. Fourth Priority: BigDataCloud API
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
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
