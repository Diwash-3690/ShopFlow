const express = require("express");
const router = express.Router();

const { createProduct } = require("../controllers/productController");

// Create Product
router.post("/", createProduct);

module.exports = router;