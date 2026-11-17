const Bill = require("../models/Bill");

const generateBillNumber = async () => {
    const lastBill = await Bill.findOne().sort({ createdAt: -1 });

    if (!lastBill) {
        return "BILL-000001";
    }

    const lastNumber = parseInt(lastBill.billNumber.split("-")[1]);

    const nextNumber = (lastNumber + 1)
        .toString()
        .padStart(6, "0");

    return `BILL-${nextNumber}`;
};

module.exports = generateBillNumber;
