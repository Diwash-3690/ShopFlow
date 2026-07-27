const Category = require("../models/Category");

// @desc Create Category
// @route POST /api/categories
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }

        const category = await Category.create({
            name,
            description,
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Get All Categories
// @route GET /api/categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Get Single Category
// @route GET /api/categories/:id
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category || !category.isActive) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            category,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Update Category
// @route PUT /api/categories/:id
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category || !category.isActive) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        category.name = name || category.name;
        category.description = description || category.description;

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Soft Delete Category
// @route DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category || !category.isActive) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        category.isActive = false;

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};