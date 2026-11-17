const Bill = require("../models/Bill");

const getArchivedBills = async (req, res) => {
    try {

        const bills = await Bill.find({
            owner: req.owner._id,
            archiveStatus: "Archived",
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bills.length,
            bills,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

module.exports = {
    getArchivedBills,
};