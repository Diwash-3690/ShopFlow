const express = require("express");
const router = express.Router();

const {
    createShop,
    getMyShop,
    updateMyShop,
    deleteMyShop,
    getPublicShopById,
    searchNearbyShops,
} = require("../controllers/shopController");

const { protectVendor } = require("../middleware/authMiddleware");

// Public Customer Shop Discovery Routes
router.get("/search", searchNearbyShops);
router.get("/public/:shopId", getPublicShopById);

// Protected Vendor Shop Management Routes
router.post("/", protectVendor, createShop);
router.get("/me", protectVendor, getMyShop);
router.put("/me", protectVendor, updateMyShop);
router.delete("/me", protectVendor, deleteMyShop);

module.exports = router;
