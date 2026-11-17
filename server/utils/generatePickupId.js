const crypto = require("crypto");
const prisma = require("../config/prisma");

// Character set avoiding ambiguous characters (0, O, 1, I)
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate an 8-character unique Pickup ID (e.g. PU-8K3N7P2A).
 * Checks the database to ensure zero collisions.
 */
const generatePickupId = async (tx = prisma) => {
  let isUnique = false;
  let pickupId = "";

  while (!isUnique) {
    let code = "";
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      code += CHARSET[bytes[i] % CHARSET.length];
    }

    pickupId = `PU-${code}`;

    const existing = await tx.order.findUnique({
      where: { pickupId },
      select: { id: true },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return pickupId;
};

module.exports = generatePickupId;
