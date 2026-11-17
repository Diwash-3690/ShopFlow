const Category = require("../models/Category");
const generateSKU = require("../utils/generateSKU");
const Product = require("../models/Product");


// @desc    Create Product
// @route   POST /api/products
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


        const categoryExists = await Category.findOne({
            _id: category,
            owner: req.owner._id,
            isActive: true
        });


        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }


        const sku = await generateSKU();


        const existingProduct = await Product.findOne({
            sku,
            owner: req.owner._id
        });


        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "Product SKU already exists",
            });
        }


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
            owner: req.owner._id,

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



// @desc Get All Products
// @route GET /api/products
const getProducts = async (req, res) => {

    try {

        const products = await Product.find({
            owner: req.owner._id,
            isActive: true
        })
        .populate("category", "name");


        res.status(200).json({

            success: true,
            count: products.length,
            products,

        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};



// @desc Get Single Product
// @route GET /api/products/:id
const getProductById = async (req, res) => {

    try {

        const product = await Product.findOne({

            _id: req.params.id,
            owner: req.owner._id

        })
        .populate("category", "name");


        if (!product || !product.isActive) {

            return res.status(404).json({

                success: false,
                message: "Product not found",

            });

        }


        res.status(200).json({

            success: true,
            product,

        });


    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message,

        });

    }

};



// @desc Update Product
// @route PUT /api/products/:id
const updateProduct = async (req, res) => {

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



        const product = await Product.findOne({

            _id: req.params.id,
            owner: req.owner._id

        });



        if (!product || !product.isActive) {

            return res.status(404).json({

                success: false,
                message: "Product not found",

            });

        }



        if (category) {

            const categoryExists = await Category.findOne({

                _id: category,
                owner: req.owner._id,
                isActive: true

            });



            if (!categoryExists) {

                return res.status(404).json({

                    success: false,
                    message: "Category not found",

                });

            }


            product.category = category;

        }



        product.name = name || product.name;
        product.brand = brand || product.brand;
        product.unit = unit || product.unit;

        product.costPrice = costPrice ?? product.costPrice;
        product.sellingPrice = sellingPrice ?? product.sellingPrice;
        product.stock = stock ?? product.stock;
        product.minimumStock = minimumStock ?? product.minimumStock;



        await product.save();



        res.status(200).json({

            success: true,
            message: "Product updated successfully",
            product,

        });



    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message,

        });

    }

};



// @desc Delete Product (Soft Delete)
// @route DELETE /api/products/:id
const deleteProduct = async (req, res) => {

    try {


        const product = await Product.findOne({

            _id: req.params.id,
            owner: req.owner._id

        });



        if (!product || !product.isActive) {

            return res.status(404).json({

                success: false,
                message: "Product not found",

            });

        }



        product.isActive = false;


        await product.save();



        res.status(200).json({

            success: true,
            message: "Product deleted successfully",

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
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,

};