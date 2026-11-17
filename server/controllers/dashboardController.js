const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Category = require("../models/Category");

const getDashboardSummary = async (req, res) => {
    try {

        const ownerId = req.owner._id;

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);

        tomorrow.setDate(today.getDate() + 1);

        const todayBills = await Bill.find({
            owner: ownerId,
            archiveStatus: "Active",
            createdAt: {
                $gte: today,
                $lt: tomorrow,
            },
        });

        const todaySales = todayBills.reduce(
            (sum, bill) => sum + bill.grandTotal,
            0
        );

        const totalCustomers = await Customer.countDocuments({
            owner: ownerId,
            isActive: true,
        });

        const totalProducts = await Product.countDocuments({
            owner: ownerId,
            isActive: true,
        });

        const totalCategories = await Category.countDocuments({
            owner: ownerId,
            isActive: true,
        });

        res.status(200).json({
            success: true,
            summary: {
                todaySales,
                todayBills: todayBills.length,
                totalCustomers,
                totalProducts,
                totalCategories,
            },
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

module.exports = {
    getDashboardSummary,
};