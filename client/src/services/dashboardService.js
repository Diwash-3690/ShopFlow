import api from "./api";

// Fetch complete vendor sales and inventory dashboard metrics
export const getVendorDashboardSummary = async () => {
  const response = await api.get("/dashboard/vendor-summary");
  return response.data;
};

// Fetch customer purchase and pickup summary
export const getCustomerDashboardSummary = async () => {
  const response = await api.get("/dashboard/customer-summary");
  return response.data;
};
