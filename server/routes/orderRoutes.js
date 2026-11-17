const express = require("express");
const router = express.Router();
const {
  calculateCheckout,
  createOnlineOrder,
  verifyAndConfirmPayment,
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
router.post("/:orderId/verify-payment", protectCustomer, verifyAndConfirmPayment);
router.get("/customer/my-orders", protectCustomer, getCustomerOrders);

// Vendor routes
router.post("/walk-in", protectVendor, createWalkInOrder);
router.patch("/:orderId/complete", protectVendor, markOrderCompleted);
router.get("/vendor/orders", protectVendor, getVendorOrders);

// Shared / Bill routes
router.get("/:orderId/bill", protectAny, getOrderBill);

module.exports = router;
