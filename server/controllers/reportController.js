const prisma = require("../config/prisma");

/**
 * Submit a report / issue / complaint (by Customer or Vendor)
 */
const createReport = async (req, res) => {
    try {
        const { category, subject, description, shopId, orderNumber } = req.body;

        if (!subject || !description) {
            return res.status(400).json({
                success: false,
                message: "Subject and description are required",
            });
        }

        const isCustomer = !!req.customer;
        const reporterType = isCustomer ? "CUSTOMER" : "VENDOR";
        const customerId = isCustomer ? req.customer.id : null;
        const vendorId = !isCustomer && req.vendor ? req.vendor.id : null;

        // Generate clean human-readable report number
        const reportNumber = `REP-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;

        const report = await prisma.report.create({
            data: {
                reportNumber,
                reporterType,
                customerId,
                vendorId,
                shopId: shopId || null,
                orderNumber: orderNumber ? orderNumber.trim() : null,
                category: category || "OTHER",
                subject: subject.trim(),
                description: description.trim(),
                status: "PENDING",
            },
            include: {
                shop: {
                    select: { id: true, shopName: true, contactNumber: true, address: true },
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: "Report submitted successfully. The platform administrator will review it.",
            data: report,
        });
    } catch (error) {
        console.error("Create report error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit report. Please try again later.",
        });
    }
};

/**
 * Get reports submitted by current logged-in user (Customer or Vendor)
 */
const getMyReports = async (req, res) => {
    try {
        const isCustomer = !!req.customer;
        const whereClause = isCustomer
            ? { customerId: req.customer.id }
            : { vendorId: req.vendor.id };

        const reports = await prisma.report.findMany({
            where: whereClause,
            include: {
                shop: {
                    select: { id: true, shopName: true, contactNumber: true, address: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: reports,
        });
    } catch (error) {
        console.error("Get my reports error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your reports",
        });
    }
};

module.exports = {
    createReport,
    getMyReports,
};
