const crypto = require("crypto");
const prisma = require("../config/prisma");

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate a unique Order Number (e.g. ORD-20261117-K97A).
 * Checks the database to ensure zero collisions.
 */
const generateOrderNumber = async (tx = prisma) => {
  let isUnique = false;
  let orderNumber = "";

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePrefix = `${yyyy}${mm}${dd}`;

  while (!isUnique) {
    let code = "";
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      code += CHARSET[bytes[i] % CHARSET.length];
    }

    orderNumber = `ORD-${datePrefix}-${code}`;

    const existing = await tx.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return orderNumber;
};

module.exports = generateOrderNumber;
