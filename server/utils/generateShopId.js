const crypto = require("crypto");
const prisma = require("../config/prisma");

// Character set avoiding ambiguous characters (0, O, 1, I)
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate a unique, readable Shop ID (e.g. SHOP-K7N9P).
 * Checks the database to ensure zero collisions.
 */
const generateShopId = async () => {
    let isUnique = false;
    let shopId = "";

    while (!isUnique) {
        let code = "";
        const bytes = crypto.randomBytes(5);
        for (let i = 0; i < 5; i++) {
            code += CHARSET[bytes[i] % CHARSET.length];
        }

        shopId = `SHOP-${code}`;

        const existing = await prisma.shop.findUnique({
            where: { shopId },
        });

        if (!existing) {
            isUnique = true;
        }
    }

    return shopId;
};

module.exports = generateShopId;
