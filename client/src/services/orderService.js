import api from "./api";

// Validate and calculate exact checkout totals from the backend
export const calculateCheckout = async ({ shopId, items }) => {
  const response = await api.post("/orders/calculate-checkout", { shopId, items });
  return response.data;
};

// Customer: Place an online order and get UPI payment intent
export const createOnlineOrder = async ({ shopId, items }) => {
  const response = await api.post("/orders/online", { shopId, items });
  return response.data;
};

// Customer / Gateway: Verify payment and generate unique Pickup ID
export const verifyPayment = async (orderId, payload = {}) => {
  const response = await api.post(`/orders/${orderId}/verify-payment`, payload);
  return response.data;
};

// Customer: Get my placed orders history & active pickups
export const getCustomerOrders = async () => {
  const response = await api.get("/orders/customer/my-orders");
  return response.data;
};

// Vendor: Create a walk-in counter sale order (POS)
export const createWalkInOrder = async ({ items, paymentMethod }) => {
  const response = await api.post("/orders/walk-in", { items, paymentMethod });
  return response.data;
};

// Vendor: Mark order as completed after matching customer pickup ID
export const markOrderCompleted = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/complete`);
  return response.data;
};

// Vendor: Get shop incoming orders and sales history
export const getVendorOrders = async (params = {}) => {
  const response = await api.get("/orders/vendor/orders", { params });
  return response.data;
};

// Shared: Fetch printable bill details for an order
export const getOrderBill = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/bill`);
  return response.data;
};
