const prisma = require("../config/prisma");

// @desc    Get Vendor Notifications
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(200).json({
                success: true,
                unreadCount: 0,
                notifications: [],
            });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                shopId: req.shop.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        });

        const unreadCount = notifications.filter((n) => !n.isRead).length;

        return res.status(200).json({
            success: true,
            unreadCount,
            notifications,
        });
    } catch (error) {
        console.error("getNotifications error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch notifications",
        });
    }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        const notification = await prisma.notification.findFirst({
            where: {
                id: req.params.id,
                shopId: req.shop.id,
            },
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        const updated = await prisma.notification.update({
            where: { id: req.params.id },
            data: { isRead: true },
        });

        return res.status(200).json({
            success: true,
            notification: updated,
        });
    } catch (error) {
        console.error("markAsRead error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update notification",
        });
    }
};

// @desc    Mark all shop notifications as read
// @route   PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        if (!req.shop) {
            return res.status(200).json({ success: true, count: 0 });
        }

        const result = await prisma.notification.updateMany({
            where: {
                shopId: req.shop.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            count: result.count,
        });
    } catch (error) {
        console.error("markAllAsRead error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to mark notifications as read",
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
