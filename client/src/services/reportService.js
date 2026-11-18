import api from "./api";

/**
 * Report Service for submitting complaints / misbehaviour / issues
 */
export const submitReport = async (reportData) => {
  const response = await api.post("/reports", reportData);
  return response.data;
};

export const getMyReports = async () => {
  const response = await api.get("/reports/my");
  return response.data;
};

export default {
  submitReport,
  getMyReports,
};
