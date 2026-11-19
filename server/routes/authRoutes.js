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
router.put("/vendor/change-password", protectVendor, vendorAuth.changePassword);
router.delete("/vendor/profile", protectVendor, vendorAuth.deleteAccount);
router.post("/vendor/send-email-otp", protectVendor, vendorAuth.sendEmailVerificationOtp);
router.post("/vendor/verify-email-otp", protectVendor, vendorAuth.verifyEmailOtp);
router.post("/vendor/send-phone-otp", protectVendor, vendorAuth.sendPhoneChangeOtp);
router.post("/vendor/verify-phone-otp", protectVendor, vendorAuth.verifyPhoneChangeOtp);
router.post("/vendor/send-mobile-verify-otp", otpLimiter, vendorAuth.sendMobileVerificationOtp);
router.post("/vendor/verify-mobile-verify-otp", vendorAuth.verifyMobileVerificationOtp);

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
router.put("/customer/change-password", protectCustomer, customerAuth.changePassword);
router.delete("/customer/profile", protectCustomer, customerAuth.deleteAccount);
router.post("/customer/send-email-otp", protectCustomer, customerAuth.sendEmailVerificationOtp);
router.post("/customer/verify-email-otp", protectCustomer, customerAuth.verifyEmailOtp);
router.post("/customer/send-phone-otp", protectCustomer, customerAuth.sendPhoneChangeOtp);
router.post("/customer/verify-phone-otp", protectCustomer, customerAuth.verifyPhoneChangeOtp);
router.post("/customer/send-mobile-verify-otp", otpLimiter, customerAuth.sendMobileVerificationOtp);
router.post("/customer/verify-mobile-verify-otp", customerAuth.verifyMobileVerificationOtp);

module.exports = router;
