import api from "./api";

// ============================================
// Vendor Authentication Services
// ============================================
export const vendorSendOtp = async ({ mobile, email, purpose = "VENDOR_REGISTER" }) => {
  const response = await api.post("/auth/vendor/send-otp", { mobile, email, purpose });
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

export const vendorUpdateProfile = async (profileData) => {
  const response = await api.put("/auth/vendor/profile", profileData);
  return response.data;
};

export const vendorDeleteAccount = async () => {
  const response = await api.delete("/auth/vendor/profile");
  return response.data;
};

export const vendorSendEmailOtp = async ({ email }) => {
  const response = await api.post("/auth/vendor/send-email-otp", { email });
  return response.data;
};

export const vendorVerifyEmailOtp = async ({ email, code }) => {
  const response = await api.post("/auth/vendor/verify-email-otp", { email, code });
  return response.data;
};

export const vendorSendPhoneOtp = async ({ newMobile }) => {
  const response = await api.post("/auth/vendor/send-phone-otp", { newMobile });
  return response.data;
};

export const vendorVerifyPhoneOtp = async ({ newMobile, code }) => {
  const response = await api.post("/auth/vendor/verify-phone-otp", { newMobile, code });
  return response.data;
};

export const vendorSendMobileVerifyOtp = async ({ mobile }) => {
  const response = await api.post("/auth/vendor/send-mobile-verify-otp", { mobile });
  return response.data;
};

export const vendorVerifyMobileVerifyOtp = async ({ mobile, code }) => {
  const response = await api.post("/auth/vendor/verify-mobile-verify-otp", { mobile, code });
  return response.data;
};

// ============================================
// Customer Authentication Services
// ============================================
export const customerSendOtp = async ({ mobile, email, purpose = "CUSTOMER_REGISTER" }) => {
  const response = await api.post("/auth/customer/send-otp", { mobile, email, purpose });
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

export const customerUpdateProfile = async (profileData) => {
  const response = await api.put("/auth/customer/profile", profileData);
  return response.data;
};

export const customerDeleteAccount = async () => {
  const response = await api.delete("/auth/customer/profile");
  return response.data;
};

export const customerSendEmailOtp = async ({ email }) => {
  const response = await api.post("/auth/customer/send-email-otp", { email });
  return response.data;
};

export const customerVerifyEmailOtp = async ({ email, code }) => {
  const response = await api.post("/auth/customer/verify-email-otp", { email, code });
  return response.data;
};

export const customerSendPhoneOtp = async ({ newMobile }) => {
  const response = await api.post("/auth/customer/send-phone-otp", { newMobile });
  return response.data;
};

export const customerVerifyPhoneOtp = async ({ newMobile, code }) => {
  const response = await api.post("/auth/customer/verify-phone-otp", { newMobile, code });
  return response.data;
};

export const customerSendMobileVerifyOtp = async ({ mobile }) => {
  const response = await api.post("/auth/customer/send-mobile-verify-otp", { mobile });
  return response.data;
};

export const customerVerifyMobileVerifyOtp = async ({ mobile, code }) => {
  const response = await api.post("/auth/customer/verify-mobile-verify-otp", { mobile, code });
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
