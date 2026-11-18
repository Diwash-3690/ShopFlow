const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Admin Login
 * Auto-seeds initial admin credentials if no admin exists yet.
 */
const adminLogin = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Username/Email and password are required",
            });
        }

        // Check if any admin exists in system; if not, auto-seed default admin
        const adminCount = await prisma.admin.count();
        if (adminCount === 0) {
            const defaultEmail = process.env.ADMIN_EMAIL || "admin@shopflow.com";
            const defaultUsername = process.env.ADMIN_USERNAME || "admin";
            const defaultPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(defaultPassword, salt);

            await prisma.admin.create({
                data: {
                    email: defaultEmail.toLowerCase().trim(),
                    username: defaultUsername.toLowerCase().trim(),
                    name: "System Administrator",
                    passwordHash,
                    role: "ADMIN",
                },
            });
            console.log(`[Admin Seed] Default admin initialized: ${defaultUsername} / ${defaultEmail}`);
        }

        const normalizedIdentifier = identifier.trim().toLowerCase();

        // Find admin by username or email
        const admin = await prisma.admin.findFirst({
            where: {
                OR: [
                    { username: normalizedIdentifier },
                    { email: normalizedIdentifier },
                ],
            },
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid administrator credentials",
            });
        }

        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid administrator credentials",
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: "ADMIN",
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Admin authenticated successfully",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({
            success: false,
            message: "Admin authentication service error",
        });
    }
};

/**
 * Get comprehensive Admin Dashboard statistics
 */
const getAdminStats = async (req, res) => {
    try {
        const [
            totalVendors,
            totalShops,
            activeShops,
            totalCustomers,
            totalOrders,
            completedOrders,
            revenueAggregate,
            pendingReports,
            underReviewReports,
            resolvedReports,
            dismissedReports,
        ] = await Promise.all([
            prisma.vendor.count(),
            prisma.shop.count(),
            prisma.shop.count({ where: { isActive: true } }),
            prisma.customer.count(),
            prisma.order.count(),
            prisma.order.count({ where: { status: "COMPLETED" } }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { status: "COMPLETED" },
            }),
            prisma.report.count({ where: { status: "PENDING" } }),
            prisma.report.count({ where: { status: "UNDER_REVIEW" } }),
            prisma.report.count({ where: { status: "RESOLVED" } }),
            prisma.report.count({ where: { status: "DISMISSED" } }),
        ]);

        const totalRevenue = revenueAggregate._sum.totalAmount || 0;

        return res.status(200).json({
            success: true,
            data: {
                vendors: {
                    total: totalVendors,
                },
                shops: {
                    total: totalShops,
                    active: activeShops,
                    inactive: totalShops - activeShops,
                },
                customers: {
                    total: totalCustomers,
                },
                orders: {
                    total: totalOrders,
                    completed: completedOrders,
                    totalRevenue: Number(totalRevenue),
                },
                reports: {
                    pending: pendingReports,
                    underReview: underReviewReports,
                    resolved: resolvedReports,
                    dismissed: dismissedReports,
                    total: pendingReports + underReviewReports + resolvedReports + dismissedReports,
                },
            },
        });
    } catch (error) {
        console.error("Get admin stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load platform statistics",
        });
    }
};

/**
 * Get all Reports with filters
 */
const getAdminReports = async (req, res) => {
    try {
        const { status, category, search } = req.query;

        const where = {};

        if (status && status !== "ALL") {
            where.status = status;
        }

        if (category && category !== "ALL") {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { reportNumber: { contains: search, mode: "insensitive" } },
                { subject: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { orderNumber: { contains: search, mode: "insensitive" } },
            ];
        }

        const reports = await prisma.report.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, name: true, mobile: true, email: true },
                },
                vendor: {
                    select: { id: true, name: true, mobile: true, email: true },
                },
                shop: {
                    select: { id: true, name: true, phone: true, address: true, isActive: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: reports,
        });
    } catch (error) {
        console.error("Get admin reports error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load reports",
        });
    }
};

/**
 * Update Report Status and add admin review notes
 */
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const allowedStatuses = ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${allowedStatuses.join(", ")}`,
            });
        }

        const updateData = {};
        if (status) {
            updateData.status = status;
            if (status === "RESOLVED") {
                updateData.resolvedAt = new Date();
            } else if (status === "PENDING" || status === "UNDER_REVIEW") {
                updateData.resolvedAt = null;
            }
        }

        if (adminNotes !== undefined) {
            updateData.adminNotes = adminNotes;
        }

        const updatedReport = await prisma.report.update({
            where: { id },
            data: updateData,
            include: {
                customer: { select: { id: true, name: true, mobile: true, email: true } },
                vendor: { select: { id: true, name: true, mobile: true, email: true } },
                shop: { select: { id: true, name: true, phone: true, address: true, isActive: true } },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Report updated successfully",
            data: updatedReport,
        });
    } catch (error) {
        console.error("Update report status error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update report",
        });
    }
};

/**
 * Get all Shops for Admin moderation
 */
const getAdminShops = async (req, res) => {
    try {
        const { search, status } = req.query;

        const where = {};
        if (status === "active") where.isActive = true;
        if (status === "inactive") where.isActive = false;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                {
                    vendor: {
                        name: { contains: search, mode: "insensitive" },
                    },
                },
            ];
        }

        const shops = await prisma.shop.findMany({
            where,
            include: {
                vendor: {
                    select: { id: true, name: true, email: true, mobile: true, isActive: true },
                },
                _count: {
                    select: {
                        products: true,
                        orders: true,
                        reports: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: shops,
        });
    } catch (error) {
        console.error("Get admin shops error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load shops",
        });
    }
};

/**
 * Toggle Shop Active Status (Activate / Suspend)
 */
const toggleShopStatus = async (req, res) => {
    try {
        const { shopId } = req.params;

        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const updatedShop = await prisma.shop.update({
            where: { id: shopId },
            data: {
                isActive: !shop.isActive,
            },
        });

        return res.status(200).json({
            success: true,
            message: `Shop "${updatedShop.name}" has been ${updatedShop.isActive ? "activated" : "suspended"}`,
            data: updatedShop,
        });
    } catch (error) {
        console.error("Toggle shop status error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update shop status",
        });
    }
};

/**
 * Update Admin Password
 */
const updateAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: req.admin.id },
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found",
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.admin.update({
            where: { id: admin.id },
            data: { passwordHash },
        });

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Update admin password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update password",
        });
    }
};

module.exports = {
    adminLogin,
    getAdminStats,
    getAdminReports,
    updateReportStatus,
    getAdminShops,
    toggleShopStatus,
    updateAdminPassword,
};
