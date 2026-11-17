const prisma = require("../config/prisma");

// @desc    Get comprehensive sales and inventory dashboard summary for a vendor
//          Calculated strictly from verified payments (per spec rule 3.9)
// @route   GET /api/dashboard/vendor-summary
const getVendorDashboardSummary = async (req, res) => {
  try {
    const shopId = req.shop?.id;
    if (!shopId) {
      return res.status(403).json({
        success: false,
        message: "Vendor shop profile is required",
      });
    }

    // Time ranges
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Fetch verified orders for this shop
    const verifiedOrders = await prisma.order.findMany({
      where: {
        shopId,
        payment: { status: "VERIFIED" },
      },
      include: {
        payment: true,
        bill: true,
        items: true,
        customer: { select: { mobile: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let todaySales = 0;
    let todayOrdersCount = 0;
    let weeklySales = 0;
    let monthlySales = 0;
    let totalSales = 0;

    let onlineOrdersCount = 0;
    let onlineSalesAmount = 0;
    let walkInOrdersCount = 0;
    let walkInSalesAmount = 0;

    let awaitingPickupCount = 0;
    let completedOrdersCount = 0;

    for (const o of verifiedOrders) {
      const amount = parseFloat(o.totalAmount);
      totalSales += amount;

      if (o.createdAt >= startOfToday) {
        todaySales += amount;
        todayOrdersCount++;
      }

      if (o.createdAt >= sevenDaysAgo) {
        weeklySales += amount;
      }

      if (o.createdAt >= thirtyDaysAgo) {
        monthlySales += amount;
      }

      if (o.orderType === "ONLINE") {
        onlineOrdersCount++;
        onlineSalesAmount += amount;
      } else {
        walkInOrdersCount++;
        walkInSalesAmount += amount;
      }

      if (o.status === "AWAITING_PICKUP") {
        awaitingPickupCount++;
      } else if (o.status === "COMPLETED") {
        completedOrdersCount++;
      }
    }

    // Inventory metrics
    const [totalProducts, outOfStockProducts, lowStockProducts, totalCategories] =
      await Promise.all([
        prisma.product.count({ where: { shopId } }),
        prisma.product.count({ where: { shopId, stockQuantity: { lte: 0 } } }),
        prisma.product.count({
          where: { shopId, stockQuantity: { gt: 0, lte: 5 } },
        }),
        prisma.category.count({ where: { shopId } }),
      ]);

    // Unverified orders awaiting payment check
    const pendingPaymentCount = await prisma.order.count({
      where: {
        shopId,
        payment: { status: "PENDING" },
      },
    });

    // Recent 5 sales transactions
    const recentSales = verifiedOrders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      pickupId: o.pickupId,
      orderType: o.orderType,
      status: o.status,
      customerMobile: o.customer?.mobile || "Walk-in Counter",
      itemCount: o.items.length,
      totalAmount: parseFloat(o.totalAmount),
      paymentMethod: o.payment?.method || "UPI",
      billNumber: o.bill?.billNumber || null,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        sales: {
          today: parseFloat(todaySales.toFixed(2)),
          todayOrdersCount,
          weekly: parseFloat(weeklySales.toFixed(2)),
          monthly: parseFloat(monthlySales.toFixed(2)),
          total: parseFloat(totalSales.toFixed(2)),
        },
        channels: {
          onlineCount: onlineOrdersCount,
          onlineAmount: parseFloat(onlineSalesAmount.toFixed(2)),
          walkInCount: walkInOrdersCount,
          walkInAmount: parseFloat(walkInSalesAmount.toFixed(2)),
        },
        orderStatus: {
          pendingPaymentCount,
          awaitingPickupCount,
          completedOrdersCount,
          totalVerifiedOrders: verifiedOrders.length,
        },
        inventory: {
          totalProducts,
          outOfStockProducts,
          lowStockProducts,
          totalCategories,
        },
        recentSales,
      },
    });
  } catch (error) {
    console.error("getVendorDashboardSummary error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch vendor dashboard summary",
    });
  }
};

// @desc    Get shopping summary for an authenticated customer
// @route   GET /api/dashboard/customer-summary
const getCustomerDashboardSummary = async (req, res) => {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        payment: true,
        shop: { select: { shopName: true } },
      },
    });

    let totalSpent = 0;
    let activePickupsCount = 0;
    let completedCount = 0;
    const visitedShops = new Set();

    for (const o of orders) {
      if (o.payment?.status === "VERIFIED") {
        totalSpent += parseFloat(o.totalAmount);
      }
      if (o.status === "AWAITING_PICKUP" && o.payment?.status === "VERIFIED") {
        activePickupsCount++;
      } else if (o.status === "COMPLETED") {
        completedCount++;
      }
      if (o.shop?.shopName) {
        visitedShops.add(o.shop.shopName);
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalOrders: orders.length,
        activePickupsCount,
        completedCount,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        shopsCount: visitedShops.size,
      },
    });
  } catch (error) {
    console.error("getCustomerDashboardSummary error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customer summary",
    });
  }
};

module.exports = {
  getVendorDashboardSummary,
  getCustomerDashboardSummary,
  // Backwards compatibility alias
  getDashboardSummary: getVendorDashboardSummary,
};
