const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Middleware to protect Vendor-only routes.
 * Decodes JWT, validates role === 'VENDOR', loads vendor and attached shop.
 */
const protectVendor = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token missing",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role && decoded.role !== "VENDOR") {
            return res.status(403).json({
                success: false,
                message: "Access forbidden: Vendor credentials required",
            });
        }

        const vendor = await prisma.vendor.findUnique({
            where: { id: decoded.id },
            include: { shop: true },
        });

        if (!vendor || !vendor.isActive) {
            return res.status(401).json({
                success: false,
                message: "Vendor account not found or deactivated",
            });
        }

        req.vendor = vendor;
        req.shop = vendor.shop;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

/**
 * Middleware to protect Customer-only routes.
 * Decodes JWT, validates role === 'CUSTOMER', loads customer.
 */
const protectCustomer = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token missing",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role && decoded.role !== "CUSTOMER") {
            return res.status(403).json({
                success: false,
                message: "Access forbidden: Customer credentials required",
            });
        }

        const customer = await prisma.customer.findUnique({
            where: { id: decoded.id },
        });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Customer account not found",
            });
        }

        req.customer = customer;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

module.exports = {
    protectVendor,
    protectCustomer,
    // Default export preserves backwards compatibility
    protect: protectVendor,
};
