const prisma = require("../config/prisma");

// Helper to trigger out-of-stock notification for vendor
const triggerOutOfStockNotification = async (shopId, productId, productName) => {
    try {
        // Prevent duplicate unread notifications for the same product
        const existing = await prisma.notification.findFirst({
            where: {
                shopId,
                productId,
                type: "OUT_OF_STOCK",
                isRead: false,
            },
        });

        if (!existing) {
            await prisma.notification.create({
                data: {
                    shopId,
                    productId,
                    type: "OUT_OF_STOCK",
                    title: "Product Out of Stock",
                    message: `Product "${productName}" has reached 0 stock and is now marked as Out of Stock.`,
                },
            });
        }
    } catch (err) {
        console.error("Error creating stock notification:", err);
    }
};

// @desc    Create a Product for Vendor's Shop
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(400).json({
                success: false,
                message: "Please register your shop before adding products.",
            });
        }

        const {
            name,
            categoryId,
            description,
            imageUrl,
            costPrice,
            sellingPrice,
            stockQuantity = 0,
            unit = "piece",
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name is required",
            });
        }

        if (sellingPrice === undefined || isNaN(parseFloat(sellingPrice))) {
            return res.status(400).json({
                success: false,
                message: "Valid selling price is required",
            });
        }

        if (costPrice === undefined || isNaN(parseFloat(costPrice))) {
            return res.status(400).json({
                success: false,
                message: "Valid cost price is required",
            });
        }

        // Strict category validation: category must belong to vendor's shop
        if (categoryId && categoryId.trim()) {
            const categoryExists = await prisma.category.findFirst({
                where: {
                    id: categoryId.trim(),
                    shopId: req.shop.id,
                },
            });

            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "The selected category does not belong to your shop",
                });
            }
        }

        const stock = parseInt(stockQuantity, 10) || 0;

        const product = await prisma.product.create({
            data: {
                shopId: req.shop.id,
                name: name.trim(),
                categoryId: categoryId && categoryId.trim() ? categoryId.trim() : null,
                description: description ? description.trim() : null,
                imageUrl: imageUrl ? imageUrl.trim() : null,
                costPrice: parseFloat(costPrice),
                sellingPrice: parseFloat(sellingPrice),
                stockQuantity: stock,
                unit: unit ? unit.trim() : "piece",
            },
            include: {
                category: {
                    select: { id: true, name: true },
                },
            },
        });

        if (stock === 0) {
            await triggerOutOfStockNotification(req.shop.id, product.id, product.name);
        }

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product,
        });
    } catch (error) {
        console.error("createProduct error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create product",
        });
    }
};

// @desc    Get All Products for Vendor's Shop (Private - includes costPrice & stock)
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(200).json({
                success: true,
                count: 0,
                products: [],
            });
        }

        const { search, categoryId, status } = req.query;

        const where = {
            shopId: req.shop.id,
        };

        if (search && search.trim()) {
            where.name = { contains: search.trim(), mode: "insensitive" };
        }

        if (categoryId && categoryId !== "ALL") {
            where.categoryId = categoryId;
        }

        if (status === "OUT_OF_STOCK") {
            where.stockQuantity = { lte: 0 };
        } else if (status === "AVAILABLE") {
            where.stockQuantity = { gt: 0 };
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("getProducts error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch products",
        });
    }
};

// @desc    Get Single Product (Private Vendor)
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const product = await prisma.product.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
            include: {
                category: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("getProductById error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch product",
        });
    }
};

// @desc    Update Product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const existing = await prisma.product.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Product not found in your shop",
            });
        }

        const {
            name,
            categoryId,
            description,
            imageUrl,
            costPrice,
            sellingPrice,
            stockQuantity,
            unit,
        } = req.body;

        // Verify category belongs to vendor's shop
        if (categoryId && categoryId.trim()) {
            const categoryExists = await prisma.category.findFirst({
                where: {
                    id: categoryId.trim(),
                    shopId: req.shop.id,
                },
            });

            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "The selected category does not belong to your shop",
                });
            }
        }

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (categoryId !== undefined) updateData.categoryId = categoryId && categoryId.trim() ? categoryId.trim() : null;
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
        if (costPrice !== undefined) updateData.costPrice = parseFloat(costPrice);
        if (sellingPrice !== undefined) updateData.sellingPrice = parseFloat(sellingPrice);
        if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity, 10);
        if (unit) updateData.unit = unit.trim();

        const updated = await prisma.product.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                category: {
                    select: { id: true, name: true },
                },
            },
        });

        if (updated.stockQuantity === 0) {
            await triggerOutOfStockNotification(req.shop.id, updated.id, updated.name);
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updated,
        });
    } catch (error) {
        console.error("updateProduct error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update product",
        });
    }
};

// @desc    Update Product Stock Quantity (Inventory quick-update)
// @route   PATCH /api/products/:id/stock
const updateProductStock = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const { stockQuantity, delta } = req.body;

        const product = await prisma.product.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        let newStock = product.stockQuantity;

        if (stockQuantity !== undefined) {
            newStock = Math.max(0, parseInt(stockQuantity, 10));
        } else if (delta !== undefined) {
            newStock = Math.max(0, product.stockQuantity + parseInt(delta, 10));
        }

        const updated = await prisma.product.update({
            where: { id: req.params.id },
            data: { stockQuantity: newStock },
            include: {
                category: { select: { id: true, name: true } },
            },
        });

        if (newStock === 0) {
            await triggerOutOfStockNotification(req.shop.id, updated.id, updated.name);
        }

        return res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            product: updated,
            availability: newStock > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
        });
    } catch (error) {
        console.error("updateProductStock error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update stock",
        });
    }
};

// @desc    Delete Product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const product = await prisma.product.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Delete any notifications linked to this product first to satisfy foreign keys
        await prisma.notification.deleteMany({
            where: { productId: req.params.id },
        });

        await prisma.product.delete({
            where: { id: req.params.id },
        });

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("deleteProduct error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete product",
        });
    }
};

// @desc    Public Customer Product Catalog for a Single Shop
//          Hides costPrice and exact stockQuantity, returns computed availability
// @route   GET /api/products/public/shop/:shopId
const getPublicShopProducts = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { categoryId, search } = req.query;

        // Resolve shop by user-facing shopId or database id
        const shop = await prisma.shop.findFirst({
            where: {
                OR: [{ shopId }, { id: shopId }],
            },
            select: { id: true, shopId: true, shopName: true },
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const where = {
            shopId: shop.id,
        };

        if (categoryId && categoryId !== "ALL") {
            where.categoryId = categoryId;
        }

        if (search && search.trim()) {
            where.name = { contains: search.trim(), mode: "insensitive" };
        }

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                sellingPrice: true,
                unit: true,
                stockQuantity: true,
                category: {
                    select: { id: true, name: true },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        // Safe transformation: remove costPrice completely, omit exact stock quantity
        const safeProducts = products.map((p) => {
            const { stockQuantity, ...rest } = p;
            return {
                ...rest,
                availability: stockQuantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
                isAvailable: stockQuantity > 0,
            };
        });

        return res.status(200).json({
            success: true,
            count: safeProducts.length,
            shop,
            products: safeProducts,
        });
    } catch (error) {
        console.error("getPublicShopProducts error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch shop catalog",
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateProductStock,
    deleteProduct,
    getPublicShopProducts,
};
