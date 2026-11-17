const express = require("express");
const router = express.Router();

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateProductStock,
    deleteProduct,
    getPublicShopProducts,
} = require("../controllers/productController");

const { protectVendor } = require("../middleware/authMiddleware");

// Public Customer Shop Catalog Route
router.get("/public/shop/:shopId", getPublicShopProducts);

// Protected Vendor Product Routes
router.post("/", protectVendor, createProduct);
router.get("/", protectVendor, getProducts);
router.get("/:id", protectVendor, getProductById);
router.put("/:id", protectVendor, updateProduct);
router.patch("/:id/stock", protectVendor, updateProductStock);
router.delete("/:id", protectVendor, deleteProduct);

module.exports = router;
