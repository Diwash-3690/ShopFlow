const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/authMiddleware");

// Public admin authentication
router.post("/login", adminController.adminLogin);

// Protected Admin-only endpoints
router.get("/stats", protectAdmin, adminController.getAdminStats);
router.get("/reports", protectAdmin, adminController.getAdminReports);
router.patch("/reports/:id", protectAdmin, adminController.updateReportStatus);
router.get("/shops", protectAdmin, adminController.getAdminShops);
router.patch("/shops/:shopId/toggle-status", protectAdmin, adminController.toggleShopStatus);
router.put("/password", protectAdmin, adminController.updateAdminPassword);

module.exports = router;
