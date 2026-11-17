const express = require("express");
const router = express.Router();
const {
  calculateCheckout,
  createOnlineOrder,
  submitCustomerPayment,
  verifyAndConfirmPayment,
  rejectPaymentAndRestoreStock,
  createWalkInOrder,
  markOrderCompleted,
  getVendorOrders,
  getCustomerOrders,
  getOrderBill,
} = require("../controllers/orderController");
const {
  protectCustomer,
  protectVendor,
  protectAny,
} = require("../middleware/authMiddleware");

// Public routes
router.post("/calculate-checkout", calculateCheckout);

// Customer routes
router.post("/online", protectCustomer, createOnlineOrder);
router.post("/:orderId/submit-payment", protectCustomer, submitCustomerPayment);
router.get("/customer/my-orders", protectCustomer, getCustomerOrders);

// Shared / verification routes (Vendor manual confirmation or customer/webhook)
router.post("/:orderId/verify-payment", protectAny, verifyAndConfirmPayment);
router.get("/:orderId/bill", protectAny, getOrderBill);

// Vendor-only routes
router.post("/:orderId/reject-payment", protectVendor, rejectPaymentAndRestoreStock);
router.post("/walk-in", protectVendor, createWalkInOrder);
router.patch("/:orderId/complete", protectVendor, markOrderCompleted);
router.get("/vendor/orders", protectVendor, getVendorOrders);

module.exports = router;
