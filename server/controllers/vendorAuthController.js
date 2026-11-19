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
        const { mobile, email, purpose = "VENDOR_REGISTER" } = req.body;

        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit mobile number",
            });
        }

        const cleanMobile = mobile.trim();
        const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

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

        // Email uniqueness check right in Step 1 (Registration Page 1)
        if (purpose === "VENDOR_REGISTER" && cleanEmail) {
            const existingEmail = await prisma.vendor.findFirst({
                where: { email: cleanEmail },
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "A vendor with this email address is already registered. Please login or use a different email.",
                });
            }
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
        const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

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

        // Double-check existence for mobile
        const existing = await prisma.vendor.findUnique({
            where: { mobile: cleanMobile },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "A vendor with this mobile number is already registered",
            });
        }

        // Double-check existence for email
        if (cleanEmail) {
            const existingEmail = await prisma.vendor.findFirst({
                where: { email: cleanEmail },
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "A vendor with this email address is already registered. Please login or use a different email.",
                });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const vendor = await prisma.vendor.create({
            data: {
                ownerName: ownerName.trim(),
                mobile: cleanMobile,
                passwordHash,
                mobileVerified: true,
                email: cleanEmail,
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
        if (error.code === "P2002") {
            const target = error.meta?.target || [];
            const isEmail = Array.isArray(target) ? target.includes("email") : String(target).includes("email");
            return res.status(400).json({
                success: false,
                message: isEmail
                    ? "A vendor with this email address is already registered."
                    : "A vendor with this mobile number is already registered.",
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || "Vendor registration failed",
        });
    }
};

// @desc    Vendor Login (Accepts 10-digit Mobile Number OR Verified Email)
// @route   POST /api/auth/vendor/login
const login = async (req, res) => {
    try {
        const { mobile, identifier, password } = req.body;
        const input = (identifier || mobile || "").trim();

        if (!input || !password) {
            return res.status(400).json({
                success: false,
                message: "Mobile/Email and password are required",
            });
        }

        let vendor = null;

        if (input.includes("@")) {
            const cleanEmail = input.toLowerCase();
            vendor = await prisma.vendor.findFirst({
                where: { email: cleanEmail },
                include: { shop: true },
            });

            if (!vendor) {
                return res.status(401).json({
                    success: false,
                    message: "No vendor account registered with this email address.",
                });
            }

            if (!vendor.emailVerified) {
                return res.status(403).json({
                    success: false,
                    message: "This email address is not verified yet. Please login using your registered mobile number and verify your email in your profile.",
                });
            }
        } else {
            const cleanMobile = input;
            vendor = await prisma.vendor.findUnique({
                where: { mobile: cleanMobile },
                include: { shop: true },
            });

            if (!vendor) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid mobile number or password",
                });
            }

            if (!vendor.mobileVerified) {
                return res.status(403).json({
                    success: false,
                    requiresMobileVerification: true,
                    mobile: vendor.mobile,
                    message: "Your phone number has been changed or is not verified yet. Please verify your phone number with OTP before signing in.",
                });
            }
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
                message: "Invalid credentials. Please check your password.",
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
        const { ownerName, email, mobile, shopName, shopNumber, address, contactNumber, upiId } = req.body;

        const vendorUpdate = {};
        if (ownerName && ownerName.trim()) vendorUpdate.ownerName = ownerName.trim();
        if (email !== undefined) {
            const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
            if (cleanEmail) {
                const existingEmail = await prisma.vendor.findFirst({
                    where: { email: cleanEmail, NOT: { id: vendorId } },
                });
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: "This email address is already in use by another vendor.",
                    });
                }
            }
            vendorUpdate.email = cleanEmail;
            if (cleanEmail !== req.vendor.email) {
                vendorUpdate.emailVerified = false;
            }
        }

        if (mobile !== undefined) {
            const cleanMobile = mobile && mobile.trim() ? mobile.trim() : null;
            if (cleanMobile && cleanMobile !== req.vendor.mobile) {
                if (!/^\d{10}$/.test(cleanMobile)) {
                    return res.status(400).json({
                        success: false,
                        message: "Please enter a valid 10-digit mobile number",
                    });
                }
                const existingMobile = await prisma.vendor.findUnique({
                    where: { mobile: cleanMobile },
                });
                if (existingMobile) {
                    return res.status(400).json({
                        success: false,
                        message: "This mobile number is already registered to another vendor.",
                    });
                }
                vendorUpdate.mobile = cleanMobile;
                // If number changed without immediate OTP verification, mark unverified
                vendorUpdate.mobileVerified = false;
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

// @desc    Send Email Verification OTP for Vendor
// @route   POST /api/auth/vendor/send-email-otp
const sendEmailVerificationOtp = async (req, res) => {
    try {
        const vendor = req.vendor;
        const { email } = req.body;

        const targetEmail = (email || vendor.email || "").trim().toLowerCase();
        if (!targetEmail || !targetEmail.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        const existing = await prisma.vendor.findFirst({
            where: {
                email: targetEmail,
                NOT: { id: vendor.id },
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "This email address is already registered to another vendor account.",
            });
        }

        if (vendor.email !== targetEmail) {
            await prisma.vendor.update({
                where: { id: vendor.id },
                data: { email: targetEmail, emailVerified: false },
            });
        }

        const result = await otpService.generateAndSendEmailOtp({
            email: targetEmail,
            mobile: vendor.mobile,
            purpose: "EMAIL_VERIFICATION",
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("vendor sendEmailVerificationOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send email verification code",
        });
    }
};

// @desc    Verify Email OTP for Vendor
// @route   POST /api/auth/vendor/verify-email-otp
const verifyEmailOtp = async (req, res) => {
    try {
        const vendor = req.vendor;
        const { email, code } = req.body;

        const targetEmail = (email || vendor.email || "").trim().toLowerCase();
        if (!targetEmail) {
            return res.status(400).json({
                success: false,
                message: "Email address is required",
            });
        }

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Verification code is required",
            });
        }

        const verifyResult = await otpService.verifyEmailOtp({
            email: targetEmail,
            code,
            purpose: "EMAIL_VERIFICATION",
        });

        if (!verifyResult.success) {
            return res.status(400).json(verifyResult);
        }

        const updatedVendor = await prisma.vendor.update({
            where: { id: vendor.id },
            data: {
                email: targetEmail,
                emailVerified: true,
            },
            include: { shop: true },
        });

        const { passwordHash: _, ...safeVendor } = updatedVendor;

        return res.status(200).json({
            success: true,
            message: "Email verified successfully! You can now log in using either your mobile number or this verified email.",
            vendor: safeVendor,
            shop: safeVendor.shop,
            hasShop: !!safeVendor.shop,
        });
    } catch (error) {
        console.error("vendor verifyEmailOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to verify email",
        });
    }
};

// @desc    Send Phone Number Change OTP for Vendor
// @route   POST /api/auth/vendor/send-phone-otp
const sendPhoneChangeOtp = async (req, res) => {
    try {
        const vendor = req.vendor;
        const { newMobile } = req.body;

        if (!newMobile || !/^\d{10}$/.test(newMobile.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit mobile number",
            });
        }

        const cleanMobile = newMobile.trim();
        if (cleanMobile === vendor.mobile) {
            return res.status(400).json({
                success: false,
                message: "The new phone number must be different from your current registered number",
            });
        }

        const existing = await prisma.vendor.findUnique({
            where: { mobile: cleanMobile },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "This mobile number is already registered to another vendor account.",
            });
        }

        const result = await otpService.generateAndSendOtp({
            mobile: cleanMobile,
            purpose: "PHONE_CHANGE",
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("vendor sendPhoneChangeOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send phone verification code",
        });
    }
};

// @desc    Verify Phone Number Change OTP & Update Number for Vendor
// @route   POST /api/auth/vendor/verify-phone-otp
const verifyPhoneChangeOtp = async (req, res) => {
    try {
        const vendor = req.vendor;
        const { newMobile, code } = req.body;

        if (!newMobile || !/^\d{10}$/.test(newMobile.trim())) {
            return res.status(400).json({
                success: false,
                message: "Valid 10-digit mobile number is required",
            });
        }

        if (!code || typeof code !== "string") {
            return res.status(400).json({
                success: false,
                message: "Verification code is required",
            });
        }

        const cleanMobile = newMobile.trim();

        const verifyResult = await otpService.verifyOtp({
            mobile: cleanMobile,
            purpose: "PHONE_CHANGE",
            code,
        });

        if (!verifyResult.success) {
            return res.status(400).json(verifyResult);
        }

        // Update vendor with new verified phone number
        const updatedVendor = await prisma.vendor.update({
            where: { id: vendor.id },
            data: {
                mobile: cleanMobile,
                mobileVerified: true,
            },
            include: { shop: true },
        });

        await otpService.consumeVerification({
            mobile: cleanMobile,
            purpose: "PHONE_CHANGE",
        });

        const { passwordHash: _, ...safeVendor } = updatedVendor;

        return res.status(200).json({
            success: true,
            message: "Phone number updated and verified successfully! You can now use your new phone number to log in.",
            vendor: safeVendor,
            shop: safeVendor.shop,
            hasShop: !!safeVendor.shop,
        });
    } catch (error) {
        console.error("vendor verifyPhoneChangeOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to verify phone number",
        });
    }
};

// @desc    Send OTP to verify an unverified mobile number for login (Vendor)
// @route   POST /api/auth/vendor/send-mobile-verify-otp
const sendMobileVerificationOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit mobile number",
            });
        }

        const cleanMobile = mobile.trim();
        const vendor = await prisma.vendor.findUnique({
            where: { mobile: cleanMobile },
        });

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "No vendor account found with this mobile number",
            });
        }

        const result = await otpService.generateAndSendOtp({
            mobile: cleanMobile,
            purpose: "MOBILE_VERIFICATION",
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("vendor sendMobileVerificationOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send verification code",
        });
    }
};

// @desc    Verify unverified mobile number for login (Vendor)
// @route   POST /api/auth/vendor/verify-mobile-verify-otp
const verifyMobileVerificationOtp = async (req, res) => {
    try {
        const { mobile, code } = req.body;
        if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
            return res.status(400).json({
                success: false,
                message: "Valid 10-digit mobile number is required",
            });
        }

        const cleanMobile = mobile.trim();
        const verifyResult = await otpService.verifyOtp({
            mobile: cleanMobile,
            purpose: "MOBILE_VERIFICATION",
            code,
        });

        if (!verifyResult.success) {
            return res.status(400).json(verifyResult);
        }

        const vendor = await prisma.vendor.update({
            where: { mobile: cleanMobile },
            data: { mobileVerified: true },
            include: { shop: true },
        });

        await otpService.consumeVerification({
            mobile: cleanMobile,
            purpose: "MOBILE_VERIFICATION",
        });

        const token = generateToken(vendor.id, "VENDOR");
        const { passwordHash: _, ...safeVendor } = vendor;

        return res.status(200).json({
            success: true,
            message: "Mobile number verified successfully! You are now logged in.",
            token,
            vendor: safeVendor,
            shop: safeVendor.shop,
            hasShop: !!safeVendor.shop,
        });
    } catch (error) {
        console.error("vendor verifyMobileVerificationOtp error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to verify mobile number",
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
    sendEmailVerificationOtp,
    verifyEmailOtp,
    sendPhoneChangeOtp,
    verifyPhoneChangeOtp,
    sendMobileVerificationOtp,
    verifyMobileVerificationOtp,
};
