const PDFDocument = require("pdfkit");
const fs = require("fs");

const generateInvoice = (bill, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text(`${bill.owner.shopName}`, {
  align: "center",
});

    doc.moveDown();

    doc.fontSize(12).text(`Bill Number: ${bill.billNumber}`);

    doc.text(`Date: ${bill.createdAt.toDateString()}`);

    doc.moveDown();

    doc.text("Customer Details");
    doc.text(`Name: ${bill.customer.name}`);
    doc.text(`Mobile: ${bill.customer.mobile}`);

    doc.moveDown();

    doc.text("Items");
    doc.moveDown();

    bill.items.forEach((item) => {
      doc.text(
        `${item.productName} | Qty: ${item.quantity} | Price: ${item.sellingPrice.toFixed(2)} | Total: ${item.total.toFixed(2)}`,
      );
    });

    doc.moveDown();

    doc.text(`Discount: ${bill.discount.toFixed(2)}`);
    doc.text(`Grand Total: ${bill.grandTotal.toFixed(2)}`);
    doc.text(`Subtotal: ${bill.subTotal.toFixed(2)}`);

    doc.moveDown();

    doc.text(`Payment Method: ${bill.paymentMethod}`);

    doc.moveDown();

    doc.text(`Thank you for shopping with ${bill.owner.shopName}!`,{
      align: "center",
    });

    doc.end();

    stream.on("finish", () => {
      resolve();
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
};

module.exports = generateInvoice;
