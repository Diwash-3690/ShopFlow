const express = require("express");
const router = express.Router();
const {
  getVendorDashboardSummary,
  getCustomerDashboardSummary,
} = require("../controllers/dashboardController");
const {
  protectVendor,
  protectCustomer,
} = require("../middleware/authMiddleware");

// Vendor dashboard analytics
router.get("/vendor-summary", protectVendor, getVendorDashboardSummary);
router.get("/summary", protectVendor, getVendorDashboardSummary);

// Customer dashboard summary
router.get("/customer-summary", protectCustomer, getCustomerDashboardSummary);

module.exports = router;
