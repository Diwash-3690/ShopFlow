const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protectAny } = require("../middleware/authMiddleware");

// All routes require authentication (either Vendor or Customer)
router.post("/", protectAny, reportController.createReport);
router.get("/my", protectAny, reportController.getMyReports);

module.exports = router;
