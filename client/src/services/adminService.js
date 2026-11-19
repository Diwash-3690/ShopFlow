import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://shopflow-2fxx.onrender.com/api"
).replace(/\/+$/, "");

const adminApi = axios.create({
  baseURL: `${API_BASE}/admin`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach admin token if present
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminLogin = async (identifier, password) => {
  const response = await adminApi.post("/login", { identifier, password });
  if (response.data?.token) {
    localStorage.setItem("adminToken", response.data.token);
    localStorage.setItem("adminUser", JSON.stringify(response.data.admin));
  }
  return response.data;
};

export const adminLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
};

export const getAdminUser = () => {
  const user = localStorage.getItem("adminUser");
  return user ? JSON.parse(user) : null;
};

export const isAdminAuthenticated = () => {
  return !!localStorage.getItem("adminToken");
};

export const getAdminStats = async () => {
  const response = await adminApi.get("/stats");
  return response.data;
};

export const getAdminReports = async (params = {}) => {
  const response = await adminApi.get("/reports", { params });
  return response.data;
};

export const updateReportStatus = async (reportId, payload) => {
  const response = await adminApi.patch(`/reports/${reportId}`, payload);
  return response.data;
};

export const getAdminShops = async (params = {}) => {
  const response = await adminApi.get("/shops", { params });
  return response.data;
};

export const toggleShopStatus = async (shopId) => {
  const response = await adminApi.patch(`/shops/${shopId}/toggle-status`);
  return response.data;
};

export const getAdminCustomers = async (params = {}) => {
  const response = await adminApi.get("/customers", { params });
  return response.data;
};

export const toggleCustomerStatus = async (customerId) => {
  const response = await adminApi.patch(`/customers/${customerId}/toggle-status`);
  return response.data;
};

export const updateAdminPassword = async (currentPassword, newPassword) => {
  const response = await adminApi.put("/password", { currentPassword, newPassword });
  return response.data;
};

export default {
  adminLogin,
  adminLogout,
  getAdminUser,
  isAdminAuthenticated,
  getAdminStats,
  getAdminReports,
  updateReportStatus,
  getAdminShops,
  toggleShopStatus,
  getAdminCustomers,
  toggleCustomerStatus,
  updateAdminPassword,
};
