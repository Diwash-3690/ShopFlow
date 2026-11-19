import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://shopflow-2fxx.onrender.com/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired or invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      // If we are on protected routes and token expired, clean up stale tokens
      if (
        path.startsWith("/vendor/dashboard") ||
        path.startsWith("/vendor/products") ||
        path.startsWith("/vendor/orders") ||
        path.startsWith("/vendor/pos") ||
        path.startsWith("/customer/dashboard")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("shop");
        const redirectPath = path.startsWith("/vendor") ? "/vendor/login" : "/customer/login";
        window.location.href = redirectPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
