const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const otpService = require("../services/otpService");

const generateToken = (id, role = "CUSTOMER") => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// @desc    Send OTP for customer registration or password reset
// @route   POST /api/auth/customer/send-otp
const sendOtp = async (req, res) => {
    try {
        const { mobile, purpose = "CUSTOMER_REGISTER" } = req.body;

        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit mobile number",
            });
        }

        const cleanMobile = mobile.trim();

        if (purpose !== "CUSTOMER_REGISTER" && purpose !== "PASSWORD_RESET") {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP purpose",
            });
        }

        const existingCustomer = await prisma.customer.findUnique({
            where: { mobile: cleanMobile },
        });

        if (purpose === "CUSTOMER_REGISTER" && existingCustomer) {
            return res.status(400).json({
                success: false,
                message: "A customer with this mobile number is already registered",
            });
        }

        if (purpose === "PASSWORD_RESET" && !existingCustomer) {
            return res.status(404).json({
                success: false,
                message: "No registered customer found with this mobile number",
            });
        }

        const result = await otpService.generateAndSendOtp({
            mobile: cleanMobile,
            purpose,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("customer sendOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send OTP",
        });
    }
};

// @desc    Verify OTP for customer
// @route   POST /api/auth/customer/verify-otp
const verifyOtp = async (req, res) => {
    try {
        const { mobile, purpose = "CUSTOMER_REGISTER", code } = req.body;

        if (!mobile || !code) {
            return res.status(400).json({
                success: false,
                message: "Mobile and OTP code are required",
            });
        }

        const result = await otpService.verifyOtp({
            mobile: mobile.trim(),
            purpose,
            code: code.trim(),
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("customer verifyOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to verify OTP",
        });
    }
};

// @desc    Customer Registration after OTP verification
// @route   POST /api/auth/customer/register
const register = async (req, res) => {
    try {
        const { mobile, password, email } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Mobile number and password are required",
            });
        }

        const cleanMobile = mobile.trim();

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        const isValid = await otpService.hasValidVerification({
            mobile: cleanMobile,
            purpose: "CUSTOMER_REGISTER",
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Mobile number has not been verified via OTP, or OTP has expired",
            });
        }

        const existing = await prisma.customer.findUnique({
            where: { mobile: cleanMobile },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "A customer with this mobile number is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const customer = await prisma.customer.create({
            data: {
                mobile: cleanMobile,
                passwordHash,
                mobileVerified: true,
                email: email ? email.trim() : null,
            },
        });

        await otpService.consumeVerification({
            mobile: cleanMobile,
            purpose: "CUSTOMER_REGISTER",
        });

        const token = generateToken(customer.id, "CUSTOMER");
        const { passwordHash: _, ...safeCustomer } = customer;

        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            token,
            customer: safeCustomer,
        });
    } catch (error) {
        console.error("register customer error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Customer registration failed",
        });
    }
};

// @desc    Customer Login
// @route   POST /api/auth/customer/login
const login = async (req, res) => {
    try {
        const { mobile, password } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Mobile and password are required",
            });
        }

        const cleanMobile = mobile.trim();

        const customer = await prisma.customer.findUnique({
            where: { mobile: cleanMobile },
        });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Invalid mobile number or password",
            });
        }

        const isMatch = await bcrypt.compare(password, customer.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid mobile number or password",
            });
        }

        const token = generateToken(customer.id, "CUSTOMER");
        const { passwordHash: _, ...safeCustomer } = customer;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            customer: safeCustomer,
        });
    } catch (error) {
        console.error("login customer error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Login failed",
        });
    }
};

// @desc    Reset Customer Password using verified OTP
// @route   POST /api/auth/customer/reset-password
const resetPassword = async (req, res) => {
    try {
        const { mobile, newPassword } = req.body;

        if (!mobile || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Mobile number and new password are required",
            });
        }

        const cleanMobile = mobile.trim();

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        const isValid = await otpService.hasValidVerification({
            mobile: cleanMobile,
            purpose: "PASSWORD_RESET",
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Mobile number has not been verified via OTP, or OTP has expired",
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.customer.update({
            where: { mobile: cleanMobile },
            data: { passwordHash },
        });

        await otpService.consumeVerification({
            mobile: cleanMobile,
            purpose: "PASSWORD_RESET",
        });

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully. Please login with your new password.",
        });
    } catch (error) {
        console.error("customer resetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Password reset failed",
        });
    }
};

// @desc    Get current authenticated customer profile
// @route   GET /api/auth/customer/me
const getMe = async (req, res) => {
    try {
        const { passwordHash: _, ...safeCustomer } = req.customer;
        return res.status(200).json({
            success: true,
            customer: safeCustomer,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get profile",
        });
    }
};

// @desc    Update Customer Profile
// @route   PUT /api/auth/customer/profile
const updateProfile = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { email } = req.body;

        const updateData = {};
        if (email !== undefined) {
            const cleanEmail = email && email.trim() ? email.trim() : null;
            if (cleanEmail) {
                const existing = await prisma.customer.findFirst({
                    where: { email: cleanEmail, NOT: { id: customerId } },
                });
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        message: "This email address is already in use by another customer.",
                    });
                }
            }
            updateData.email = cleanEmail;
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id: customerId },
            data: updateData,
        });

        const { passwordHash: _, ...safeCustomer } = updatedCustomer;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            customer: safeCustomer,
        });
    } catch (error) {
        console.error("customer updateProfile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
};

// @desc    Delete Customer Account
// @route   DELETE /api/auth/customer/profile
const deleteAccount = async (req, res) => {
    try {
        const customerId = req.customer.id;

        await prisma.$transaction(async (tx) => {
            // Unlink customer from past orders so merchant accounting history is preserved
            await tx.order.updateMany({
                where: { customerId },
                data: { customerId: null },
            });

            // Delete customer account
            await tx.customer.delete({
                where: { id: customerId },
            });
        });

        return res.status(200).json({
            success: true,
            message: "Your customer account has been permanently deleted.",
        });
    } catch (error) {
        console.error("deleteCustomerAccount error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete customer account",
        });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    register,
    login,
    resetPassword,
    getMe,
    updateProfile,
    deleteAccount,
};
