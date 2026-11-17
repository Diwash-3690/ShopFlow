const prisma = require("../config/prisma");

// @desc    Validate and calculate cart checkout for a single shop
//          Enforces: all products belong to the exact same shop, verifies prices from DB, checks stock
// @route   POST /api/orders/calculate-checkout
const calculateCheckout = async (req, res) => {
    try {
        const { shopId, items } = req.body;

        if (!shopId) {
            return res.status(400).json({
                success: false,
                message: "Shop ID is required",
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty. Please add at least one item.",
            });
        }

        // Resolve shop by internal cuid id or user-facing shopId
        const shop = await prisma.shop.findFirst({
            where: {
                OR: [
                    { id: shopId },
                    { shopId: shopId },
                ],
            },
            select: {
                id: true,
                shopId: true,
                shopName: true,
                address: true,
                contactNumber: true,
                upiId: true,
            },
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const productIds = items.map((i) => i.productId).filter(Boolean);

        if (productIds.length !== items.length) {
            return res.status(400).json({
                success: false,
                message: "Each cart item must contain a valid productId",
            });
        }

        // Fetch all requested products from database
        const dbProducts = await prisma.product.findMany({
            where: {
                id: { in: productIds },
            },
            include: {
                category: {
                    select: { id: true, name: true },
                },
            },
        });

        const productMap = new Map();
        dbProducts.forEach((p) => productMap.set(p.id, p));

        const calculatedItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = productMap.get(item.productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`,
                });
            }

            // CRITICAL BUSINESS RULE: Product must belong to the exact same shop
            if (product.shopId !== shop.id) {
                return res.status(400).json({
                    success: false,
                    message: `Cross-shop violation: Product "${product.name}" does not belong to ${shop.shopName}. An order must contain products from exactly one shop.`,
                });
            }

            const requestedQuantity = parseInt(item.quantity, 10);
            if (!requestedQuantity || requestedQuantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for product "${product.name}"`,
                });
            }

            // Real-time stock verification
            if (product.stockQuantity < requestedQuantity) {
                return res.status(400).json({
                    success: false,
                    message: product.stockQuantity === 0
                        ? `"${product.name}" is out of stock.`
                        : `Only ${product.stockQuantity} ${product.unit}(s) available for "${product.name}".`,
                });
            }

            const unitPrice = parseFloat(product.sellingPrice);
            const lineTotal = parseFloat((unitPrice * requestedQuantity).toFixed(2));
            subtotal += lineTotal;

            calculatedItems.push({
                productId: product.id,
                productName: product.name,
                unit: product.unit,
                unitPrice: unitPrice,
                quantity: requestedQuantity,
                lineTotal: lineTotal,
                imageUrl: product.imageUrl,
                categoryName: product.category?.name || "Uncategorized",
            });
        }

        subtotal = parseFloat(subtotal.toFixed(2));
        const totalAmount = subtotal;

        return res.status(200).json({
            success: true,
            shop,
            items: calculatedItems,
            subtotal,
            totalAmount,
        });
    } catch (error) {
        console.error("calculateCheckout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to calculate checkout",
        });
    }
};

module.exports = {
    calculateCheckout,
};
