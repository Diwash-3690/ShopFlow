const crypto = require("crypto");
const prisma = require("../config/prisma");

const OTP_EXPIRY_MINUTES = 10;
const VERIFICATION_VALIDITY_MINUTES = 15;

/**
 * Hash an OTP code with SHA-256 for secure storage.
 */
const hashOtp = (code) => {
    return crypto.createHash("sha256").update(code.trim()).digest("hex");
};

/**
 * Generate a random 6-digit numeric OTP code.
 */
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate, hash, and persist OTP for a given mobile and purpose.
 */
const generateAndSendOtp = async ({ mobile, purpose }) => {
    const code = generateCode();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing unused OTPs for this mobile + purpose
    await prisma.otpVerification.deleteMany({
        where: {
            mobile,
            purpose,
            verifiedAt: null,
        },
    });

    // Save the new OTP
    await prisma.otpVerification.create({
        data: {
            mobile,
            purpose,
            codeHash,
            expiresAt,
        },
    });

    // Modular delivery: In production, plug in SMS provider (e.g., Twilio/Fast2SMS).
    // In development, log prominently to server console.
    console.log("========================================");
    console.log(`[ShopFlow OTP Service]`);
    console.log(`Mobile:  ${mobile}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`Code:    ${code}`);
    console.log(`Expires: in ${OTP_EXPIRY_MINUTES} minutes`);
    console.log("========================================");

    return {
        success: true,
        message: "OTP sent successfully",
        devCode: code, // returned for display & instant helper verification in both dev & deployed environments
    };
};

/**
 * Verify an entered OTP against active records.
 */
const verifyOtp = async ({ mobile, purpose, code }) => {
    if (!code || typeof code !== "string") {
        return { success: false, message: "OTP code is required" };
    }

    const codeHash = hashOtp(code);
    const now = new Date();

    const record = await prisma.otpVerification.findFirst({
        where: {
            mobile,
            purpose,
            codeHash,
            verifiedAt: null,
            expiresAt: {
                gt: now,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    if (!record) {
        return { success: false, message: "Invalid or expired OTP code" };
    }

    // Mark as verified
    await prisma.otpVerification.update({
        where: { id: record.id },
        data: { verifiedAt: now },
    });

    return { success: true, message: "OTP verified successfully" };
};

/**
 * Check if the mobile has a recent, verified OTP for this purpose.
 */
const hasValidVerification = async ({ mobile, purpose }) => {
    const cutoff = new Date(Date.now() - VERIFICATION_VALIDITY_MINUTES * 60 * 1000);

    const record = await prisma.otpVerification.findFirst({
        where: {
            mobile,
            purpose,
            verifiedAt: {
                gte: cutoff,
            },
        },
        orderBy: {
            verifiedAt: "desc",
        },
    });

    return !!record;
};

/**
 * Consume/clean up a verified OTP record once used (e.g. after password set/reset).
 */
const consumeVerification = async ({ mobile, purpose }) => {
    await prisma.otpVerification.deleteMany({
        where: {
            mobile,
            purpose,
        },
    });
};

/**
 * Generate, hash, and persist OTP for email verification.
 */
const generateAndSendEmailOtp = async ({ email, mobile, purpose = "EMAIL_VERIFICATION" }) => {
    const cleanEmail = email.trim().toLowerCase();
    const code = generateCode();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate existing unused email OTPs
    await prisma.otpVerification.deleteMany({
        where: {
            email: cleanEmail,
            purpose,
            verifiedAt: null,
        },
    });

    // Save the new OTP
    await prisma.otpVerification.create({
        data: {
            mobile: mobile ? mobile.trim() : "EMAIL_USER",
            email: cleanEmail,
            purpose,
            codeHash,
            expiresAt,
        },
    });

    console.log("========================================");
    console.log(`[ShopFlow Email OTP Service]`);
    console.log(`Email:   ${cleanEmail}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`Code:    ${code}`);
    console.log(`Expires: in ${OTP_EXPIRY_MINUTES} minutes`);
    console.log("========================================");

    return {
        success: true,
        message: `Verification code sent to ${cleanEmail}`,
        devCode: code, // convenient dev fallback so user can verify immediately
    };
};

/**
 * Verify an entered email OTP against active records.
 */
const verifyEmailOtp = async ({ email, code, purpose = "EMAIL_VERIFICATION" }) => {
    if (!code || typeof code !== "string") {
        return { success: false, message: "Verification code is required" };
    }

    const cleanEmail = email.trim().toLowerCase();
    const codeHash = hashOtp(code);
    const now = new Date();

    const record = await prisma.otpVerification.findFirst({
        where: {
            email: cleanEmail,
            purpose,
            codeHash,
            verifiedAt: null,
            expiresAt: {
                gt: now,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    if (!record) {
        return { success: false, message: "Invalid or expired verification code" };
    }

    // Mark as verified
    await prisma.otpVerification.update({
        where: { id: record.id },
        data: { verifiedAt: now },
    });

    return { success: true, message: "Email verified successfully" };
};

module.exports = {
    generateAndSendOtp,
    verifyOtp,
    hasValidVerification,
    consumeVerification,
    generateAndSendEmailOtp,
    verifyEmailOtp,
};
