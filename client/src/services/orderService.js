import api from "./api";

// Validate and calculate exact checkout totals from the backend
export const calculateCheckout = async ({ shopId, items }) => {
  const response = await api.post("/orders/calculate-checkout", { shopId, items });
  return response.data;
};
