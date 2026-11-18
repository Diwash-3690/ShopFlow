const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const otpService = require("../services/otpService");

const generateToken = (id, role = "VENDOR") => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// @desc    Send OTP for vendor registration or password reset
// @route   POST /api/auth/vendor/send-otp
const sendOtp = async (req, res) => {
    try {
        const { mobile, purpose = "VENDOR_REGISTER" } = req.body;

        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit mobile number",
            });
        }

        const cleanMobile = mobile.trim();

        if (purpose !== "VENDOR_REGISTER" && purpose !== "PASSWORD_RESET") {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP purpose",
            });
        }

        const existingVendor = await prisma.vendor.findUnique({
            where: { mobile: cleanMobile },
        });

        if (purpose === "VENDOR_REGISTER" && existingVendor) {
            return res.status(400).json({
                success: false,
                message: "A vendor with this mobile number is already registered",
            });
        }

        if (purpose === "PASSWORD_RESET" && !existingVendor) {
            return res.status(404).json({
                success: false,
                message: "No registered vendor found with this mobile number",
            });
        }

        const result = await otpService.generateAndSendOtp({
            mobile: cleanMobile,
            purpose,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("sendOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send OTP",
        });
    }
};

// @desc    Verify OTP for vendor
// @route   POST /api/auth/vendor/verify-otp
const verifyOtp = async (req, res) => {
    try {
        const { mobile, purpose = "VENDOR_REGISTER", code } = req.body;

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
        console.error("verifyOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to verify OTP",
        });
    }
};

// @desc    Complete Vendor Registration after OTP verification
// @route   POST /api/auth/vendor/register
const register = async (req, res) => {
    try {
        const { ownerName, mobile, password, email } = req.body;

        if (!ownerName || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Owner name, mobile number, and password are required",
            });
        }

        const cleanMobile = mobile.trim();

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        // Verify that OTP was verified recently
        const isValid = await otpService.hasValidVerification({
            mobile: cleanMobile,
            purpose: "VENDOR_REGISTER",
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Mobile number has not been verified via OTP, or OTP has expired",
            });
        }

        // Double-check existence
        const existing = await prisma.vendor.findUnique({
            where: { mobile: cleanMobile },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "A vendor with this mobile number is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const vendor = await prisma.vendor.create({
            data: {
                ownerName: ownerName.trim(),
                mobile: cleanMobile,
                passwordHash,
                mobileVerified: true,
                email: email ? email.trim() : null,
            },
        });

        // Consume OTP verification
        await otpService.consumeVerification({
            mobile: cleanMobile,
            purpose: "VENDOR_REGISTER",
        });

        const token = generateToken(vendor.id, "VENDOR");

        const { passwordHash: _, ...safeVendor } = vendor;

        return res.status(201).json({
            success: true,
            message: "Vendor registered successfully",
            token,
            vendor: safeVendor,
            shop: null,
            hasShop: false,
        });
    } catch (error) {
        console.error("register vendor error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Vendor registration failed",
        });
    }
};

// @desc    Vendor Login
// @route   POST /api/auth/vendor/login
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

        const vendor = await prisma.vendor.findUnique({
            where: { mobile: cleanMobile },
            include: { shop: true },
        });

        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: "Invalid mobile number or password",
            });
        }

        if (!vendor.isActive) {
            return res.status(403).json({
                success: false,
                message: "Vendor account has been deactivated. Please contact support.",
            });
        }

        const isMatch = await bcrypt.compare(password, vendor.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid mobile number or password",
            });
        }

        const token = generateToken(vendor.id, "VENDOR");

        const { passwordHash: _, ...safeVendor } = vendor;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            vendor: safeVendor,
            shop: vendor.shop,
            hasShop: !!vendor.shop,
        });
    } catch (error) {
        console.error("login vendor error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Login failed",
        });
    }
};

// @desc    Reset Vendor Password using verified OTP
// @route   POST /api/auth/vendor/reset-password
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

        await prisma.vendor.update({
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
        console.error("resetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Password reset failed",
        });
    }
};

// @desc    Get current authenticated vendor profile
// @route   GET /api/auth/vendor/me
const getMe = async (req, res) => {
    try {
        const { passwordHash: _, ...safeVendor } = req.vendor;
        return res.status(200).json({
            success: true,
            vendor: safeVendor,
            shop: req.shop,
            hasShop: !!req.shop,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get profile",
        });
    }
};

// @desc    Update Vendor Profile
// @route   PUT /api/auth/vendor/profile
const updateProfile = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const { ownerName, email, shopName, shopNumber, address, contactNumber, upiId } = req.body;

        const vendorUpdate = {};
        if (ownerName && ownerName.trim()) vendorUpdate.ownerName = ownerName.trim();
        if (email !== undefined) vendorUpdate.email = email && email.trim() ? email.trim() : null;

        // Check if email already used by another vendor
        if (vendorUpdate.email) {
            const existingEmail = await prisma.vendor.findFirst({
                where: { email: vendorUpdate.email, NOT: { id: vendorId } },
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "This email address is already in use by another vendor.",
                });
            }
        }

        const updatedVendor = await prisma.vendor.update({
            where: { id: vendorId },
            data: vendorUpdate,
            include: { shop: true },
        });

        // Also update shop details if vendor has registered a shop and shop fields are provided
        let updatedShop = updatedVendor.shop;
        if (updatedShop && (shopName || shopNumber !== undefined || address || contactNumber || upiId !== undefined)) {
            const shopUpdate = {};
            if (shopName && shopName.trim()) shopUpdate.shopName = shopName.trim();
            if (shopNumber !== undefined) shopUpdate.shopNumber = shopNumber && shopNumber.trim() ? shopNumber.trim() : null;
            if (address && address.trim()) shopUpdate.address = address.trim();
            if (contactNumber && contactNumber.trim()) shopUpdate.contactNumber = contactNumber.trim();
            if (upiId !== undefined) {
                if (upiId && !/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: "Please enter a valid UPI ID (e.g., storename@okhdfcbank)",
                    });
                }
                shopUpdate.upiId = upiId ? upiId.trim() : null;
            }

            updatedShop = await prisma.shop.update({
                where: { id: updatedShop.id },
                data: shopUpdate,
            });
        }

        const { passwordHash: _, ...safeVendor } = updatedVendor;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            vendor: safeVendor,
            shop: updatedShop,
            hasShop: !!updatedShop,
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
};

// @desc    Delete Vendor Account (and cascading registered shop)
// @route   DELETE /api/auth/vendor/profile
const deleteAccount = async (req, res) => {
    try {
        const vendorId = req.vendor.id;

        // Perform cascading deletion in transaction
        await prisma.$transaction(async (tx) => {
            const shop = await tx.shop.findUnique({
                where: { vendorId },
            });

            if (shop) {
                // Delete notifications
                await tx.notification.deleteMany({ where: { shopId: shop.id } });
                // Delete order items
                await tx.orderItem.deleteMany({ where: { order: { shopId: shop.id } } });
                // Delete bills
                await tx.bill.deleteMany({ where: { order: { shopId: shop.id } } });
                // Delete payments
                await tx.payment.deleteMany({ where: { order: { shopId: shop.id } } });
                // Delete orders
                await tx.order.deleteMany({ where: { shopId: shop.id } });
                // Delete products
                await tx.product.deleteMany({ where: { shopId: shop.id } });
                // Delete categories
                await tx.category.deleteMany({ where: { shopId: shop.id } });
                // Delete shop
                await tx.shop.delete({ where: { id: shop.id } });
            }

            // Finally, delete vendor record
            await tx.vendor.delete({ where: { id: vendorId } });
        });

        return res.status(200).json({
            success: true,
            message: "Vendor account and all associated shop data have been permanently deleted.",
        });
    } catch (error) {
        console.error("deleteVendorAccount error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete account",
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
