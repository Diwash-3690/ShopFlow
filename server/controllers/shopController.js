const prisma = require("../config/prisma");
const generateShopId = require("../utils/generateShopId");

/**
 * Calculate distance between two GPS points in kilometers using Haversine formula.
 */
const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

// @desc    Register a new Shop for the authenticated vendor
// @route   POST /api/shops
const createShop = async (req, res) => {
    try {
        const vendorId = req.vendor.id;

        // Ensure vendor doesn't already own a shop
        const existingShop = await prisma.shop.findUnique({
            where: { vendorId },
        });

        if (existingShop) {
            return res.status(400).json({
                success: false,
                message: "You have already registered a shop. Each vendor manages one shop.",
                shop: existingShop,
            });
        }

        const {
            shopName,
            address,
            contactNumber,
            latitude,
            longitude,
            upiId,
            shopNumber,
        } = req.body;

        if (!shopName || !address || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Shop name, address, and contact number are required",
            });
        }

        // Validate UPI ID format if provided (e.g. merchant@okhdfcbank)
        if (upiId && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid UPI ID (e.g., shopname@okhdfcbank)",
            });
        }

        // Generate unique Shop ID
        const shopId = await generateShopId();

        const latFloat = latitude !== undefined && latitude !== null && latitude !== "" ? parseFloat(latitude) : null;
        const lonFloat = longitude !== undefined && longitude !== null && longitude !== "" ? parseFloat(longitude) : null;

        const shop = await prisma.shop.create({
            data: {
                vendorId,
                shopId,
                shopName: shopName.trim(),
                address: address.trim(),
                contactNumber: contactNumber.trim(),
                shopNumber: shopNumber && shopNumber.trim() ? shopNumber.trim() : null,
                latitude: latFloat,
                longitude: lonFloat,
                upiId: upiId ? upiId.trim() : null,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Shop registered successfully",
            shop,
        });
    } catch (error) {
        console.error("createShop error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to register shop",
        });
    }
};

// @desc    Get authenticated vendor's shop profile
// @route   GET /api/shops/me
const getMyShop = async (req, res) => {
    try {
        const vendorId = req.vendor.id;

        const shop = await prisma.shop.findUnique({
            where: { vendorId },
            include: {
                _count: {
                    select: {
                        products: true,
                        categories: true,
                        orders: true,
                    },
                },
            },
        });

        if (!shop) {
            return res.status(200).json({
                success: true,
                hasShop: false,
                shop: null,
            });
        }

        return res.status(200).json({
            success: true,
            hasShop: true,
            shop,
        });
    } catch (error) {
        console.error("getMyShop error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve shop details",
        });
    }
};

// @desc    Update authenticated vendor's shop profile
// @route   PUT /api/shops/me
const updateMyShop = async (req, res) => {
    try {
        const vendorId = req.vendor.id;

        const existingShop = await prisma.shop.findUnique({
            where: { vendorId },
        });

        if (!existingShop) {
            return res.status(404).json({
                success: false,
                message: "No registered shop found for your account",
            });
        }

        const {
            shopName,
            address,
            contactNumber,
            latitude,
            longitude,
            upiId,
            shopNumber,
        } = req.body;

        if (upiId && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid UPI ID (e.g., shopname@okhdfcbank)",
            });
        }

        const updateData = {};
        if (shopName) updateData.shopName = shopName.trim();
        if (address) updateData.address = address.trim();
        if (contactNumber) updateData.contactNumber = contactNumber.trim();
        if (latitude !== undefined) updateData.latitude = latitude !== "" && latitude !== null ? parseFloat(latitude) : null;
        if (longitude !== undefined) updateData.longitude = longitude !== "" && longitude !== null ? parseFloat(longitude) : null;
        if (upiId !== undefined) updateData.upiId = upiId ? upiId.trim() : null;
        if (shopNumber !== undefined) updateData.shopNumber = shopNumber && shopNumber.trim() ? shopNumber.trim() : null;

        const updatedShop = await prisma.shop.update({
            where: { id: existingShop.id },
            data: updateData,
        });

        return res.status(200).json({
            success: true,
            message: "Shop updated successfully",
            shop: updatedShop,
        });
    } catch (error) {
        console.error("updateMyShop error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update shop",
        });
    }
};

// @desc    Public endpoint for customers to get shop details by shopId
// @route   GET /api/shops/public/:shopId
const getPublicShopById = async (req, res) => {
    try {
        const { shopId } = req.params;

        // Lookup by user-facing shopId or internal database id
        const shop = await prisma.shop.findFirst({
            where: {
                OR: [
                    { shopId },
                    { id: shopId },
                ],
            },
            select: {
                id: true,
                shopId: true,
                shopName: true,
                shopNumber: true,
                address: true,
                contactNumber: true,
                latitude: true,
                longitude: true,
                upiId: true,
                createdAt: true,
                _count: {
                    select: {
                        products: true,
                        categories: true,
                    },
                },
            },
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        return res.status(200).json({
            success: true,
            shop,
        });
    } catch (error) {
        console.error("getPublicShopById error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch shop",
        });
    }
};

// @desc    Public search for shops (by keyword, Shop ID, or GPS distance)
// @route   GET /api/shops/search
const searchNearbyShops = async (req, res) => {
    try {
        const { query, lat, lng, radius = 25 } = req.query;

        const whereClause = {};

        if (query && query.trim()) {
            const term = query.trim();
            whereClause.OR = [
                { shopName: { contains: term, mode: "insensitive" } },
                { shopId: { contains: term, mode: "insensitive" } },
                { address: { contains: term, mode: "insensitive" } },
            ];
        }

        const shops = await prisma.shop.findMany({
            where: whereClause,
            select: {
                id: true,
                shopId: true,
                shopName: true,
                shopNumber: true,
                address: true,
                contactNumber: true,
                latitude: true,
                longitude: true,
                upiId: true,
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
            take: 100,
        });

        // If coordinates provided, compute Haversine distance and sort
        const userLat = lat ? parseFloat(lat) : null;
        const userLon = lng ? parseFloat(lng) : null;
        const maxRadiusKm = parseFloat(radius) || 25;

        if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
            const shopsWithDistance = shops
                .map((shop) => {
                    let distanceKm = null;
                    if (shop.latitude !== null && shop.longitude !== null) {
                        distanceKm = calculateHaversineDistanceKm(
                            userLat,
                            userLon,
                            shop.latitude,
                            shop.longitude
                        );
                    }
                    return {
                        ...shop,
                        distanceKm,
                    };
                })
                .filter((shop) => shop.distanceKm === null || shop.distanceKm <= maxRadiusKm)
                .sort((a, b) => {
                    if (a.distanceKm === null) return 1;
                    if (b.distanceKm === null) return -1;
                    return a.distanceKm - b.distanceKm;
                });

            return res.status(200).json({
                success: true,
                count: shopsWithDistance.length,
                shops: shopsWithDistance,
            });
        }

        return res.status(200).json({
            success: true,
            count: shops.length,
            shops,
        });
    } catch (error) {
        console.error("searchNearbyShops error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to search shops",
        });
    }
};

// @desc    Delete Registered Shop
// @route   DELETE /api/shops/my-shop
const deleteMyShop = async (req, res) => {
    try {
        const vendorId = req.vendor.id;

        const shop = await prisma.shop.findUnique({
            where: { vendorId },
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "No registered shop found for your account",
            });
        }

        await prisma.$transaction(async (tx) => {
            // Delete notifications
            await tx.notification.deleteMany({ where: { shopId: shop.id } });
            // Delete order items
            await tx.orderItem.deleteMany({ where: { order: { shopId: shop.id } } });
            // Delete bills
            await tx.bill.deleteMany({ where: { order: { shopId: shop.id } } });
            // Delete payments
            await tx.payment.deleteMany({ where: { order: { shopId: shop.id } } });
            // Delete orders
            await tx.order.deleteMany({ where: { shopId: shop.id } });
            // Delete products
            await tx.product.deleteMany({ where: { shopId: shop.id } });
            // Delete categories
            await tx.category.deleteMany({ where: { shopId: shop.id } });
            // Delete shop
            await tx.shop.delete({ where: { id: shop.id } });
        });

        return res.status(200).json({
            success: true,
            message: "Registered shop and all its catalog products and orders have been deleted successfully.",
        });
    } catch (error) {
        console.error("deleteMyShop error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete shop",
        });
    }
};

module.exports = {
    createShop,
    getMyShop,
    updateMyShop,
    deleteMyShop,
    getPublicShopById,
    searchNearbyShops,
};
