const Bill = require("../models/Bill");

const archiveBills = async () => {
    try {

        // 12 months ago
        const archiveDate = new Date();
        archiveDate.setMonth(archiveDate.getMonth() - 12);

        const result = await Bill.updateMany(
            {
                archiveStatus: "Active",
                createdAt: { $lt: archiveDate },
            },
            {
                $set: {
                    archiveStatus: "Archived",
                    archivedAt: new Date(),
                },
            }
        );

        console.log(`Archived ${result.modifiedCount} bills`);

    } catch (error) {

        console.error("Archive Job Failed");
        console.error(error.message);

    }
};

module.exports = archiveBills;