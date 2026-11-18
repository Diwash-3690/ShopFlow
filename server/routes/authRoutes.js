const express = require("express");
const router = express.Router();

const vendorAuth = require("../controllers/vendorAuthController");
const customerAuth = require("../controllers/customerAuthController");
const { protectVendor, protectCustomer } = require("../middleware/authMiddleware");
const { otpLimiter } = require("../middleware/rateLimiter");

// ============================================
// Vendor Authentication Routes
// ============================================
router.post("/vendor/send-otp", otpLimiter, vendorAuth.sendOtp);
router.post("/vendor/verify-otp", vendorAuth.verifyOtp);
router.post("/vendor/register", vendorAuth.register);
router.post("/vendor/login", vendorAuth.login);
router.post("/vendor/reset-password", vendorAuth.resetPassword);
router.get("/vendor/me", protectVendor, vendorAuth.getMe);
router.put("/vendor/profile", protectVendor, vendorAuth.updateProfile);
router.delete("/vendor/profile", protectVendor, vendorAuth.deleteAccount);
router.post("/vendor/send-email-otp", protectVendor, vendorAuth.sendEmailVerificationOtp);
router.post("/vendor/verify-email-otp", protectVendor, vendorAuth.verifyEmailOtp);

// ============================================
// Customer Authentication Routes
// ============================================
router.post("/customer/send-otp", otpLimiter, customerAuth.sendOtp);
router.post("/customer/verify-otp", customerAuth.verifyOtp);
router.post("/customer/register", customerAuth.register);
router.post("/customer/login", customerAuth.login);
router.post("/customer/reset-password", customerAuth.resetPassword);
router.get("/customer/me", protectCustomer, customerAuth.getMe);
router.put("/customer/profile", protectCustomer, customerAuth.updateProfile);
router.delete("/customer/profile", protectCustomer, customerAuth.deleteAccount);
router.post("/customer/send-email-otp", protectCustomer, customerAuth.sendEmailVerificationOtp);
router.post("/customer/verify-email-otp", protectCustomer, customerAuth.verifyEmailOtp);

module.exports = router;
