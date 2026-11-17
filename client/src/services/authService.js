import api from "./api";

// ============================================
// Vendor Authentication Services
// ============================================
export const vendorSendOtp = async ({ mobile, purpose = "VENDOR_REGISTER" }) => {
  const response = await api.post("/auth/vendor/send-otp", { mobile, purpose });
  return response.data;
};

export const vendorVerifyOtp = async ({ mobile, code, purpose = "VENDOR_REGISTER" }) => {
  const response = await api.post("/auth/vendor/verify-otp", { mobile, code, purpose });
  return response.data;
};

export const vendorRegister = async (vendorData) => {
  const response = await api.post("/auth/vendor/register", vendorData);
  return response.data;
};

export const vendorLogin = async (loginData) => {
  const response = await api.post("/auth/vendor/login", loginData);
  return response.data;
};

export const vendorResetPassword = async ({ mobile, newPassword }) => {
  const response = await api.post("/auth/vendor/reset-password", { mobile, newPassword });
  return response.data;
};

export const vendorGetMe = async () => {
  const response = await api.get("/auth/vendor/me");
  return response.data;
};

// ============================================
// Customer Authentication Services
// ============================================
export const customerSendOtp = async ({ mobile, purpose = "CUSTOMER_REGISTER" }) => {
  const response = await api.post("/auth/customer/send-otp", { mobile, purpose });
  return response.data;
};

export const customerVerifyOtp = async ({ mobile, code, purpose = "CUSTOMER_REGISTER" }) => {
  const response = await api.post("/auth/customer/verify-otp", { mobile, code, purpose });
  return response.data;
};

export const customerRegister = async (customerData) => {
  const response = await api.post("/auth/customer/register", customerData);
  return response.data;
};

export const customerLogin = async (loginData) => {
  const response = await api.post("/auth/customer/login", loginData);
  return response.data;
};

export const customerResetPassword = async ({ mobile, newPassword }) => {
  const response = await api.post("/auth/customer/reset-password", { mobile, newPassword });
  return response.data;
};

export const customerGetMe = async () => {
  const response = await api.get("/auth/customer/me");
  return response.data;
};

// ============================================
// Session Utilities
// ============================================
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("shop");
};
