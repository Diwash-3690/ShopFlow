const Customer = require("../models/Customer");

// @desc Create Customer
// @route POST /api/customers
const createCustomer = async (req, res) => {
    try {
        const { name, mobile } = req.body;

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ mobile });

        if (existingCustomer && existingCustomer.isActive) {
            return res.status(400).json({
                success: false,
                message: "Customer already exists",
            });
        }

        const customer = await Customer.create({
            name,
            mobile,
        });

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            customer,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Get All Customers
// @route GET /api/customers
const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({ isActive: true });

        res.status(200).json({
            success: true,
            count: customers.length,
            customers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Get Customer By ID
// @route GET /api/customers/:id
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer || !customer.isActive) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            customer,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Update Customer
// @route PUT /api/customers/:id
const updateCustomer = async (req, res) => {
    try {
        const { name, mobile } = req.body;

        const customer = await Customer.findById(req.params.id);

        if (!customer || !customer.isActive) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Check if another customer already has this mobile number
        if (mobile && mobile !== customer.mobile) {
            const mobileExists = await Customer.findOne({ mobile });

            if (mobileExists) {
                return res.status(400).json({
                    success: false,
                    message: "Mobile number already exists",
                });
            }
        }

        customer.name = name || customer.name;
        customer.mobile = mobile || customer.mobile;

        await customer.save();

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            customer,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc Delete Customer (Soft Delete)
// @route DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer || !customer.isActive) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        customer.isActive = false;

        await customer.save();

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
};