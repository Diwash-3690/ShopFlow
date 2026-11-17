const express = require("express");
const router = express.Router();

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getPublicShopCategories,
} = require("../controllers/categoryController");

const { protectVendor } = require("../middleware/authMiddleware");

// Public Customer Route
router.get("/public/shop/:shopId", getPublicShopCategories);

// Protected Vendor Category Routes
router.post("/", protectVendor, createCategory);
router.get("/", protectVendor, getCategories);
router.get("/:id", protectVendor, getCategoryById);
router.put("/:id", protectVendor, updateCategory);
router.delete("/:id", protectVendor, deleteCategory);

module.exports = router;
