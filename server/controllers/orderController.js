const prisma = require("../config/prisma");
const generatePickupId = require("../utils/generatePickupId");
const generateOrderNumber = require("../utils/generateOrderNumber");
const generateBillNumber = require("../utils/generateBillNumber");

// @desc    Validate and calculate cart checkout for a single shop
//          Enforces: all products belong to the exact same shop, verifies prices from DB, checks stock
// @route   POST /api/orders/calculate-checkout
const calculateCheckout = async (req, res) => {
  try {
    const { shopId, items } = req.body;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop ID is required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add at least one item.",
      });
    }

    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ id: shopId }, { shopId: shopId }],
      },
      select: {
        id: true,
        shopId: true,
        shopName: true,
        address: true,
        contactNumber: true,
        upiId: true,
      },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    const productIds = items.map((i) => i.productId).filter(Boolean);

    if (productIds.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "Each cart item must contain a valid productId",
      });
    }

    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    const productMap = new Map();
    dbProducts.forEach((p) => productMap.set(p.id, p));

    const calculatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      // CRITICAL BUSINESS RULE: Product must belong to the exact same shop
      if (product.shopId !== shop.id) {
        return res.status(400).json({
          success: false,
          message: `Cross-shop violation: Product "${product.name}" does not belong to ${shop.shopName}. An order must contain products from exactly one shop.`,
        });
      }

      const requestedQuantity = parseInt(item.quantity, 10);
      if (!requestedQuantity || requestedQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product "${product.name}"`,
        });
      }

      // Real-time stock verification
      if (product.stockQuantity < requestedQuantity) {
        return res.status(400).json({
          success: false,
          message:
            product.stockQuantity === 0
              ? `"${product.name}" is out of stock.`
              : `Only ${product.stockQuantity} ${product.unit}(s) available for "${product.name}".`,
        });
      }

      const unitPrice = parseFloat(product.sellingPrice);
      const lineTotal = parseFloat((unitPrice * requestedQuantity).toFixed(2));
      subtotal += lineTotal;

      calculatedItems.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        unitPrice: unitPrice,
        quantity: requestedQuantity,
        lineTotal: lineTotal,
        imageUrl: product.imageUrl,
        categoryName: product.category?.name || "Uncategorized",
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const totalAmount = subtotal;

    return res.status(200).json({
      success: true,
      shop,
      items: calculatedItems,
      subtotal,
      totalAmount,
    });
  } catch (error) {
    console.error("calculateCheckout error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate checkout",
    });
  }
};

// @desc    Initiate an online order for a customer and generate UPI payment intent
//          Creates order, items, payment(PENDING) and decrements stock in atomic transaction
// @route   POST /api/orders/online
const createOnlineOrder = async (req, res) => {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }

    const { shopId, items } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, message: "Shop ID is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart cannot be empty" });
    }

    const shop = await prisma.shop.findFirst({
      where: { OR: [{ id: shopId }, { shopId: shopId }] },
    });

    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    if (!shop.upiId) {
      return res.status(400).json({
        success: false,
        message: "This shop has not configured a UPI ID to receive payments yet",
      });
    }

    const productIds = items.map((i) => i.productId).filter(Boolean);

    // Atomic transaction for order creation + stock reservation
    const result = await prisma.$transaction(async (tx) => {
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map();
      dbProducts.forEach((p) => productMap.set(p.id, p));

      const orderItemsData = [];
      let subtotal = 0;

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.shopId !== shop.id) {
          throw new Error(
            `Cross-shop violation: Product "${product.name}" does not belong to this shop.`
          );
        }

        const qty = parseInt(item.quantity, 10);
        if (!qty || qty < 1) {
          throw new Error(`Invalid quantity for "${product.name}"`);
        }

        if (product.stockQuantity < qty) {
          throw new Error(
            product.stockQuantity === 0
              ? `"${product.name}" is out of stock.`
              : `Only ${product.stockQuantity} available for "${product.name}".`
          );
        }

        const unitPrice = parseFloat(product.sellingPrice);
        const lineTotal = parseFloat((unitPrice * qty).toFixed(2));
        subtotal += lineTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice: unitPrice,
          quantity: qty,
          lineTotal: lineTotal,
        });

        // Decrement stock atomically
        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: qty } },
        });

        // Trigger notification if newly out of stock
        if (updatedProduct.stockQuantity === 0) {
          await tx.notification.create({
            data: {
              shopId: shop.id,
              productId: product.id,
              type: "OUT_OF_STOCK",
              title: "Product Out of Stock",
              message: `"${product.name}" has reached 0 stock and is now marked Out of Stock.`,
            },
          });
        }
      }

      subtotal = parseFloat(subtotal.toFixed(2));
      const totalAmount = subtotal;

      const orderNumber = await generateOrderNumber(tx);

      // Create Order (pickupId is null until payment is verified)
      const order = await tx.order.create({
        data: {
          orderNumber,
          pickupId: null,
          shopId: shop.id,
          customerId,
          orderType: "ONLINE",
          status: "AWAITING_PICKUP",
          subtotal,
          totalAmount,
        },
      });

      // Create OrderItems
      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          orderId: order.id,
          ...item,
        })),
      });

      // Create Payment (PENDING status)
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: "UPI",
          status: "PENDING",
          vendorUpiId: shop.upiId,
        },
      });

      // Construct standard UPI Intent URI
      const upiUrl = `upi://pay?pa=${encodeURIComponent(shop.upiId)}&pn=${encodeURIComponent(
        shop.shopName
      )}&am=${totalAmount.toFixed(2)}&tr=${order.orderNumber}&cu=INR`;

      return {
        order,
        payment,
        upiUrl,
        items: orderItemsData,
        shop: {
          id: shop.id,
          shopId: shop.shopId,
          shopName: shop.shopName,
          upiId: shop.upiId,
          address: shop.address,
        },
      };
    });

    return res.status(201).json({
      success: true,
      message: "Order placed. Complete UPI payment to receive your Pickup ID.",
      data: result,
    });
  } catch (error) {
    console.error("createOnlineOrder error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create online order",
    });
  }
};

// @desc    Verify and confirm payment for an online order
//          Transitions payment PENDING -> VERIFIED, generates Pickup ID & Bill, sends vendor notification
// @route   POST /api/orders/:orderId/verify-payment
const verifyAndConfirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { providerTransactionId } = req.body || {};

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        shop: true,
        bill: true,
        items: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Idempotent check: if already verified, return confirmed state
    if (existingOrder.payment?.status === "VERIFIED" && existingOrder.pickupId) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order: {
          id: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          pickupId: existingOrder.pickupId,
          status: existingOrder.status,
          totalAmount: parseFloat(existingOrder.totalAmount),
          paymentStatus: "VERIFIED",
          bill: existingOrder.bill,
          shop: {
            shopName: existingOrder.shop.shopName,
            address: existingOrder.shop.address,
            contactNumber: existingOrder.shop.contactNumber,
          },
        },
      });
    }

    // Confirm payment in transaction
    const confirmed = await prisma.$transaction(async (tx) => {
      // 1. Generate unique 8-character pickup ID
      const pickupId = await generatePickupId(tx);

      // 2. Update payment to VERIFIED
      const updatedPayment = await tx.payment.update({
        where: { orderId: existingOrder.id },
        data: {
          status: "VERIFIED",
          paidAt: new Date(),
          providerTransactionId: providerTransactionId || `UPI-VERIFIED-${Date.now()}`,
        },
      });

      // 3. Update order with pickup ID
      const updatedOrder = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          pickupId,
          status: "AWAITING_PICKUP",
        },
      });

      // 4. Generate unique Bill
      const billNumber = await generateBillNumber(tx);
      const bill = await tx.bill.create({
        data: {
          orderId: existingOrder.id,
          billNumber,
          subtotal: existingOrder.subtotal,
          totalAmount: existingOrder.totalAmount,
        },
      });

      // 5. Trigger NEW_ORDER notification for the shop owner
      await tx.notification.create({
        data: {
          shopId: existingOrder.shopId,
          orderId: existingOrder.id,
          type: "NEW_ORDER",
          title: "New Incoming Order!",
          message: `Order #${existingOrder.orderNumber} confirmed. Pickup ID: ${pickupId}. Total: ₹${parseFloat(
            existingOrder.totalAmount
          ).toFixed(2)}`,
        },
      });

      return {
        order: updatedOrder,
        payment: updatedPayment,
        bill,
        pickupId,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Payment successfully verified! Your order is confirmed for pickup.",
      order: {
        id: confirmed.order.id,
        orderNumber: confirmed.order.orderNumber,
        pickupId: confirmed.pickupId,
        status: confirmed.order.status,
        totalAmount: parseFloat(confirmed.order.totalAmount),
        paymentStatus: "VERIFIED",
        bill: confirmed.bill,
        shop: {
          shopName: existingOrder.shop.shopName,
          address: existingOrder.shop.address,
          contactNumber: existingOrder.shop.contactNumber,
        },
      },
    });
  } catch (error) {
    console.error("verifyAndConfirmPayment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

// @desc    Create a Walk-In POS Order by Vendor
//          Instantly generates bill, completed order, verified payment, decrements stock
// @route   POST /api/orders/walk-in
const createWalkInOrder = async (req, res) => {
  try {
    const shopId = req.shop?.id;
    if (!shopId) {
      return res.status(403).json({ success: false, message: "Vendor shop context required" });
    }

    const { items, paymentMethod = "CASH" } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required for walk-in order" });
    }

    const validMethods = ["CASH", "UPI"];
    const chosenMethod = validMethods.includes(paymentMethod.toUpperCase())
      ? paymentMethod.toUpperCase()
      : "CASH";

    const productIds = items.map((i) => i.productId).filter(Boolean);

    const result = await prisma.$transaction(async (tx) => {
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map();
      dbProducts.forEach((p) => productMap.set(p.id, p));

      const orderItemsData = [];
      let subtotal = 0;

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.shopId !== shopId) {
          throw new Error(`Product "${product.name}" does not belong to your shop.`);
        }

        const qty = parseInt(item.quantity, 10);
        if (!qty || qty < 1) {
          throw new Error(`Invalid quantity for "${product.name}"`);
        }

        if (product.stockQuantity < qty) {
          throw new Error(
            product.stockQuantity === 0
              ? `"${product.name}" is out of stock.`
              : `Only ${product.stockQuantity} available for "${product.name}".`
          );
        }

        const unitPrice = parseFloat(product.sellingPrice);
        const lineTotal = parseFloat((unitPrice * qty).toFixed(2));
        subtotal += lineTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice: unitPrice,
          quantity: qty,
          lineTotal: lineTotal,
        });

        // Decrement stock
        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: qty } },
        });

        if (updatedProduct.stockQuantity === 0) {
          await tx.notification.create({
            data: {
              shopId,
              productId: product.id,
              type: "OUT_OF_STOCK",
              title: "Product Out of Stock",
              message: `"${product.name}" reached 0 stock via Walk-in sale.`,
            },
          });
        }
      }

      subtotal = parseFloat(subtotal.toFixed(2));
      const totalAmount = subtotal;

      const orderNumber = await generateOrderNumber(tx);
      const pickupId = await generatePickupId(tx);

      // Walk-in order is immediately COMPLETED
      const order = await tx.order.create({
        data: {
          orderNumber,
          pickupId,
          shopId,
          customerId: null,
          orderType: "WALK_IN",
          status: "COMPLETED",
          completedAt: new Date(),
          subtotal,
          totalAmount,
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({
          orderId: order.id,
          ...item,
        })),
      });

      // Walk-in payment is immediately VERIFIED
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: chosenMethod,
          status: "VERIFIED",
          paidAt: new Date(),
          vendorUpiId: chosenMethod === "UPI" ? req.shop.upiId : null,
          providerTransactionId: `WALKIN-${Date.now()}`,
        },
      });

      // Generate Bill immediately
      const billNumber = await generateBillNumber(tx);
      const bill = await tx.bill.create({
        data: {
          orderId: order.id,
          billNumber,
          subtotal,
          totalAmount,
        },
      });

      return {
        order,
        items: orderItemsData,
        payment,
        bill,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Walk-in order created successfully",
      data: result,
    });
  } catch (error) {
    console.error("createWalkInOrder error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create walk-in order",
    });
  }
};

// @desc    Vendor marks an incoming order as completed (upon matching pickup ID and handover)
// @route   PATCH /api/orders/:orderId/complete
const markOrderCompleted = async (req, res) => {
  try {
    const shopId = req.shop?.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        shopId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found in your shop" });
    }

    if (order.status === "COMPLETED") {
      return res.status(400).json({ success: false, message: "Order is already completed" });
    }

    if (order.payment?.status !== "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Cannot complete an order whose payment has not been verified",
      });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: {
        payment: true,
        bill: true,
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Order marked as completed and handed over to customer.",
      order: updated,
    });
  } catch (error) {
    console.error("markOrderCompleted error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark order as completed",
    });
  }
};

// @desc    Get all orders for the authenticated vendor's shop
//          Filters: status ('AWAITING_PICKUP', 'COMPLETED', 'ALL'), orderType ('ONLINE', 'WALK_IN'), search (pickupId/orderNumber)
//          Enforces rule 3.6: unverified online orders are excluded from incoming queue
// @route   GET /api/orders/vendor/orders
const getVendorOrders = async (req, res) => {
  try {
    const shopId = req.shop?.id;
    if (!shopId) {
      return res.status(403).json({ success: false, message: "Shop context required" });
    }

    const { status, type, search } = req.query;

    const where = { shopId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.orderType = type;
    }

    // Exclude unverified online orders
    where.payment = {
      status: "VERIFIED",
    };

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { pickupId: { contains: term, mode: "insensitive" } },
        { orderNumber: { contains: term, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        payment: true,
        bill: true,
        customer: {
          select: { mobile: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      pickupId: o.pickupId,
      orderType: o.orderType,
      status: o.status,
      subtotal: parseFloat(o.subtotal),
      totalAmount: parseFloat(o.totalAmount),
      createdAt: o.createdAt,
      completedAt: o.completedAt,
      customerMobile: o.customer?.mobile || "Walk-in Guest",
      payment: o.payment
        ? {
            method: o.payment.method,
            status: o.payment.status,
            paidAt: o.payment.paidAt,
            providerTransactionId: o.payment.providerTransactionId,
          }
        : null,
      billNumber: o.bill?.billNumber || null,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: parseFloat(i.unitPrice),
        lineTotal: parseFloat(i.lineTotal),
      })),
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("getVendorOrders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch vendor orders",
    });
  }
};

// @desc    Get all orders placed by the authenticated customer
// @route   GET /api/orders/customer/my-orders
const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Customer authentication required" });
    }

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        shop: {
          select: {
            id: true,
            shopId: true,
            shopName: true,
            address: true,
            contactNumber: true,
          },
        },
        items: true,
        payment: true,
        bill: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      pickupId: o.pickupId,
      orderType: o.orderType,
      status: o.status,
      subtotal: parseFloat(o.subtotal),
      totalAmount: parseFloat(o.totalAmount),
      createdAt: o.createdAt,
      completedAt: o.completedAt,
      shop: o.shop,
      payment: o.payment
        ? {
            method: o.payment.method,
            status: o.payment.status,
            paidAt: o.payment.paidAt,
            providerTransactionId: o.payment.providerTransactionId,
          }
        : null,
      bill: o.bill
        ? {
            id: o.bill.id,
            billNumber: o.bill.billNumber,
            issuedAt: o.bill.issuedAt,
          }
        : null,
      items: o.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: parseFloat(i.unitPrice),
        lineTotal: parseFloat(i.lineTotal),
      })),
    }));

    return res.status(200).json({
      success: true,
      orders: formatted,
    });
  } catch (error) {
    console.error("getCustomerOrders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customer orders",
    });
  }
};

// @desc    Get full printable bill for an order
//          Authorized for the shop owner OR the customer who placed it
// @route   GET /api/orders/:orderId/bill
const getOrderBill = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: {
          select: {
            id: true,
            shopId: true,
            shopName: true,
            address: true,
            contactNumber: true,
            upiId: true,
          },
        },
        customer: {
          select: {
            id: true,
            mobile: true,
          },
        },
        items: true,
        payment: true,
        bill: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.bill) {
      return res.status(404).json({
        success: false,
        message: "Bill has not been generated for this order yet",
      });
    }

    // Access check: allow if vendor owns the shop OR customer is the order owner
    const isVendorOwner = req.vendor && req.shop && req.shop.id === order.shopId;
    const isCustomerOwner = req.customer && req.customer.id === order.customerId;

    if (!isVendorOwner && !isCustomerOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this bill",
      });
    }

    return res.status(200).json({
      success: true,
      bill: {
        billNumber: order.bill.billNumber,
        issuedAt: order.bill.issuedAt,
        orderNumber: order.orderNumber,
        pickupId: order.pickupId,
        orderType: order.orderType,
        status: order.status,
        completedAt: order.completedAt,
        subtotal: parseFloat(order.bill.subtotal),
        totalAmount: parseFloat(order.bill.totalAmount),
        shop: order.shop,
        customer: order.customer ? { mobile: order.customer.mobile } : { mobile: "Walk-in Customer" },
        payment: order.payment
          ? {
              method: order.payment.method,
              status: order.payment.status,
              paidAt: order.payment.paidAt,
              providerTransactionId: order.payment.providerTransactionId,
            }
          : null,
        items: order.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: parseFloat(i.unitPrice),
          lineTotal: parseFloat(i.lineTotal),
        })),
      },
    });
  } catch (error) {
    console.error("getOrderBill error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order bill",
    });
  }
};

module.exports = {
  calculateCheckout,
  createOnlineOrder,
  verifyAndConfirmPayment,
  createWalkInOrder,
  markOrderCompleted,
  getVendorOrders,
  getCustomerOrders,
  getOrderBill,
};
