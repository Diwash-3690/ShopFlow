const mongoose = require("mongoose");
const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const generateBillNumber = require("../utils/generateBillNumber");
const path = require("path");
const generateInvoice = require("../utils/generateInvoice");
const sendWhatsApp = require("../utils/sendWhatsApp");
const fs = require("fs");

// @desc Create Bill
// @route POST /api/bills
const createBill = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();


        const { customer, items, discount = 0, paymentMethod } = req.body;


        if (!items || items.length === 0) {

            return res.status(400).json({

                success: false,
                message: "Please add at least one product.",

            });

        }



        const billNumber = await generateBillNumber();



        let billItems = [];
        let subTotal = 0;



        for (const item of items) {


            const product = await Product.findOne({

                _id: item.product,
                owner: req.owner._id

            });



            if (!product || !product.isActive) {

                return res.status(404).json({

                    success: false,
                    message: `Product not found: ${item.product}`,

                });

            }



            if (product.stock < item.quantity) {

                return res.status(400).json({

                    success: false,
                    message: `${product.name} has only ${product.stock} items in stock.`,

                });

            }



            const lineTotal = product.sellingPrice * item.quantity;


            subTotal += lineTotal;



            billItems.push({

                product: product._id,
                productName: product.name,
                sku: product.sku,
                sellingPrice: product.sellingPrice,
                quantity: item.quantity,
                total: lineTotal,

            });


        }



        const grandTotal = subTotal - discount;



        const bill = await Bill.create(
            [{
                billNumber,
                customer: customer || null,
                items: billItems,
                subTotal,
                discount,
                grandTotal,
                paymentMethod,
                owner: req.owner._id,
            }],
            { session }
        );


        const createdBill = bill[0];



        // Reduce Stock

        for (const item of items) {


            await Product.findOneAndUpdate(

                {
                    _id: item.product,
                    owner: req.owner._id
                },

                {
                    $inc: {
                        stock: -item.quantity
                    }
                },

                {
                    session
                }

            );

        }




        // Update Customer Purchase History

        if (customer) {


            const pointsEarned = Math.floor(grandTotal / 100);



            await Customer.findOneAndUpdate(

                {
                    _id: customer,
                    owner: req.owner._id
                },

                {

                    $inc: {

                        totalOrders: 1,
                        totalSpent: grandTotal,
                        loyaltyPoints: pointsEarned,

                    }

                },

                {
                    session
                }

            );


        }




        await session.commitTransaction();

        session.endSession();

        // Generate PDF
const pdfPath = path.join(
    __dirname,
    "../invoices",
    `${createdBill.billNumber}.pdf`
);

// Fetch complete bill details
const completeBill = await Bill.findById(createdBill._id)
    .populate("customer", "name mobile")
    .populate("owner", "shopName shopNumber location");

// Create invoice
await generateInvoice(completeBill, pdfPath);

// Send WhatsApp (temporary mock)
await sendWhatsApp(
    completeBill.customer.mobile,
    pdfPath
);

// Delete temporary PDF
if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
}


        res.status(201).json({

            success: true,
            message: "Bill created successfully",
            bill: createdBill,

        });



    } catch (error) {


        await session.abortTransaction();

        session.endSession();



        res.status(500).json({

            success: false,
            message: error.message,

        });


    }

};




// @desc Get All Bills
// @route GET /api/bills
const getBills = async (req, res) => {

    try {


        const bills = await Bill.find({

            owner: req.owner._id,
            archiveStatus: "Active",

        })
        .populate("customer", "name mobile")
        .sort({
            createdAt: -1
        });



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




// @desc Get Single Bill
// @route GET /api/bills/:id
const getBillById = async (req, res) => {

    try {


        const bill = await Bill.findOne({

            _id: req.params.id,
            owner: req.owner._id,
            archiveStatus: "Active",

        })
        .populate("customer", "name mobile");



        if (!bill) {

            return res.status(404).json({

                success: false,
                message: "Bill not found",

            });

        }



        res.status(200).json({

            success: true,
            bill,

        });



    } catch (error) {


        res.status(500).json({

            success: false,
            message: error.message,

        });


    }

};




// @desc Generate Bill PDF
// @route GET /api/bills/pdf/:id
const generateBillPDF = async (req, res) => {

    try {


        const bill = await Bill.findOne({
    _id: req.params.id,
    owner: req.owner._id
})
.populate("customer", "name mobile")
.populate("owner", "shopName shopNumber location");



        if (!bill) {

            return res.status(404).json({

                success: false,
                message: "Bill not found",

            });

        }



        const filePath = path.join(

            __dirname,
            "../invoices",
            `${bill.billNumber}.pdf`

        );



        await generateInvoice(bill, filePath);



        res.download(filePath, `${bill.billNumber}.pdf`);



    } catch (error) {


        res.status(500).json({

            success: false,
            message: error.message,

        });


    }

};



module.exports = {

    createBill,
    getBills,
    getBillById,
    generateBillPDF,

};