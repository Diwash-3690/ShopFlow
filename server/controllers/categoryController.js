const prisma = require("../config/prisma");

// @desc    Create Category for Vendor's Shop
// @route   POST /api/categories
const createCategory = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(400).json({
                success: false,
                message: "Please register your shop before creating categories.",
            });
        }

        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        const cleanName = name.trim();

        // Check if category name exists within this shop
        const existing = await prisma.category.findUnique({
            where: {
                shopId_name: {
                    shopId: req.shop.id,
                    name: cleanName,
                },
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "A category with this name already exists in your shop",
            });
        }

        const category = await prisma.category.create({
            data: {
                shopId: req.shop.id,
                name: cleanName,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });
    } catch (error) {
        console.error("createCategory error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create category",
        });
    }
};

// @desc    Get All Categories for Vendor's Shop
// @route   GET /api/categories
const getCategories = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(200).json({
                success: true,
                categories: [],
                count: 0,
            });
        }

        const categories = await prisma.category.findMany({
            where: {
                shopId: req.shop.id,
            },
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    } catch (error) {
        console.error("getCategories error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch categories",
        });
    }
};

// @desc    Get Single Category by ID
// @route   GET /api/categories/:id
const getCategoryById = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const category = await prisma.category.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
            include: {
                products: true,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error("getCategoryById error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch category",
        });
    }
};

// @desc    Update Category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        const cleanName = name.trim();

        const category = await prisma.category.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Check duplicate name within shop
        const duplicate = await prisma.category.findFirst({
            where: {
                shopId: req.shop.id,
                name: cleanName,
                id: { not: req.params.id },
            },
        });

        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: "Another category with this name already exists in your shop",
            });
        }

        const updated = await prisma.category.update({
            where: { id: req.params.id },
            data: { name: cleanName },
        });

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: updated,
        });
    } catch (error) {
        console.error("updateCategory error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update category",
        });
    }
};

// @desc    Delete Category Safely (unlinks associated products)
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const category = await prisma.category.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Transaction to safely detach products before deleting category
        await prisma.$transaction([
            prisma.product.updateMany({
                where: {
                    categoryId: req.params.id,
                    shopId: req.shop.id,
                },
                data: {
                    categoryId: null,
                },
            }),
            prisma.category.delete({
                where: { id: req.params.id },
            }),
        ]);

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully. Associated products have been unassigned safely.",
        });
    } catch (error) {
        console.error("deleteCategory error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete category",
        });
    }
};

// @desc    Public endpoint for customers to get a shop's categories
// @route   GET /api/categories/public/shop/:shopId
const getPublicShopCategories = async (req, res) => {
    try {
        const { shopId } = req.params;

        // Resolve shop by user-facing shopId or database id
        const shop = await prisma.shop.findFirst({
            where: {
                OR: [{ shopId }, { id: shopId }],
            },
            select: { id: true },
        });

        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        const categories = await prisma.category.findMany({
            where: { shopId: shop.id },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return res.status(200).json({
            success: true,
            categories,
        });
    } catch (error) {
        console.error("getPublicShopCategories error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch categories",
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getPublicShopCategories,
};
