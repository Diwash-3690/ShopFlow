const crypto = require("crypto");
const prisma = require("../config/prisma");

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate a unique Bill Number (e.g. BILL-20261117-M3PX).
 * Checks the database to ensure zero collisions.
 */
const generateBillNumber = async (tx = prisma) => {
  let isUnique = false;
  let billNumber = "";

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

    billNumber = `BILL-${datePrefix}-${code}`;

    const existing = await tx.bill.findUnique({
      where: { billNumber },
      select: { id: true },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return billNumber;
};

module.exports = generateBillNumber;
