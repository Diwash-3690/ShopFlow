const express = require("express");
const router = express.Router();

const {
    getNotifications,
    markAsRead,
    markAllAsRead,
} = require("../controllers/notificationController");

const { protectVendor } = require("../middleware/authMiddleware");

router.get("/", protectVendor, getNotifications);
router.patch("/:id/read", protectVendor, markAsRead);
router.patch("/read-all", protectVendor, markAllAsRead);

module.exports = router;
