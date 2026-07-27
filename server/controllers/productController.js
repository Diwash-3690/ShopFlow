const generateSKU = require("../utils/generateSKU");
const Product = require("../models/Product");

// @desc    Create Product
// @route   POST /api/products
// @access  Private (Later)
const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            brand,
            unit,
            costPrice,
            sellingPrice,
            stock,
            minimumStock,
        } = req.body;

        // Generate SKU
        const sku= await generateSKU();

        const product = await Product.create({
            name,
            category,
            brand,
            sku,
            unit,
            costPrice,
            sellingPrice,
            stock,
            minimumStock,
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createProduct,
};