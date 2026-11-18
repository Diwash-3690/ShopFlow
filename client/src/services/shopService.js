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
