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

      if (!product || product.isDeleted) {
        return res.status(404).json({
          success: false,
          message: product ? `Product "${product.name}" is no longer available.` : `Product not found: ${item.productId}`,
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

// @desc    Initiate an online order for a customer and generate direct merchant UPI payment intent
//          Zero-cost flow: generates dynamic UPI link with vendor's own UPI ID and order reference
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
        message: "This shop has not configured a UPI ID to receive direct payments yet",
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
        if (!product || product.isDeleted) {
          throw new Error(product ? `Product "${product.name}" is no longer available.` : `Product not found: ${item.productId}`);
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

        // Decrement stock atomically to reserve items during payment window
        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: qty } },
        });

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

      // Create Order (pickupId remains NULL until vendor or gateway verifies payment)
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

      // Create Payment record (PENDING status)
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: "UPI",
          status: "PENDING",
          vendorUpiId: shop.upiId,
        },
      });

      // Construct standard Direct Merchant UPI Intent URI
      const upiUrl = `upi://pay?pa=${encodeURIComponent(shop.upiId)}&pn=${encodeURIComponent(
        shop.shopName
      )}&am=${totalAmount.toFixed(2)}&tr=${order.orderNumber}&cu=INR`;

      return {
        order: {
          ...order,
          totalAmount: parseFloat(order.totalAmount) || 0,
        },
        payment: {
          ...payment,
          amount: parseFloat(payment.amount) || 0,
        },
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
      message: "Order placed. Complete direct UPI payment to the merchant.",
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

// @desc    Customer submits UPI Transaction Reference (UTR) after completing payment in their UPI app
//          Does NOT confirm payment automatically; alerts vendor to verify bank receipt
// @route   POST /api/orders/:orderId/submit-payment
const submitCustomerPayment = async (req, res) => {
  try {
    const customerId = req.customer?.id;
    const { orderId } = req.params;
    const { providerTransactionId } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { payment: true, shop: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.payment?.status === "VERIFIED") {
      return res.status(200).json({
        success: true,
        message: "Payment is already verified by merchant",
        order,
      });
    }

    if (!providerTransactionId || !providerTransactionId.trim()) {
      return res.status(400).json({
        success: false,
        message: "UPI Reference / UTR number is mandatory to verify payment.",
      });
    }

    const cleanUtr = providerTransactionId.trim();
    if (cleanUtr.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid UPI Reference / UTR number (at least 6 characters).",
      });
    }

    // Record customer transaction reference
    const updatedPayment = await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        providerTransactionId: cleanUtr,
      },
    });

    // Alert vendor via notification
    await prisma.notification.create({
      data: {
        shopId: order.shopId,
        orderId: order.id,
        type: "NEW_ORDER",
        title: "New UPI Payment Verification Request",
        message: `Order #${order.orderNumber}: Customer submitted UPI Ref ${cleanUtr} for ₹${parseFloat(order.totalAmount).toFixed(2)}. Please verify in your bank app and confirm.`,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment reference submitted! Awaiting merchant verification.",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("submitCustomerPayment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit payment reference",
    });
  }
};

// @desc    Vendor or payment provider verifies received payment
//          CRITICAL ZERO-COST FLOW: Vendor verifies credit in their UPI/bank app, then clicks confirm.
//          Transitions payment PENDING -> VERIFIED, generates unique Pickup ID & Bill.
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

    // Access authorization: allow if Vendor owns the shop, or authorized customer/gateway
    if (req.vendor && req.shop && req.shop.id !== existingOrder.shopId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: this order belongs to another shop",
      });
    }

    // Idempotent check: if already verified, return confirmed state safely
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

    // Strict Zero-Cost Rule: Cannot confirm payment without a valid UPI UTR / Transaction Reference number
    const verifiedUtr = (providerTransactionId || existingOrder.payment?.providerTransactionId || "").trim();
    if (!verifiedUtr) {
      return res.status(400).json({
        success: false,
        message: "Cannot confirm payment without a valid UPI UTR / Transaction Reference number. Please verify bank credit first.",
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
          providerTransactionId: verifiedUtr,
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

      // 5. Trigger notification
      await tx.notification.create({
        data: {
          shopId: existingOrder.shopId,
          orderId: existingOrder.id,
          type: "NEW_ORDER",
          title: "Payment Confirmed • Pickup ID Generated",
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
      message: "Payment successfully verified! Pickup ID generated for customer collection.",
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

// @desc    Vendor rejects an unverified order (payment not received)
//          Restores inventory stock back to the shop
// @route   POST /api/orders/:orderId/reject-payment
const rejectPaymentAndRestoreStock = async (req, res) => {
  try {
    const shopId = req.shop?.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, shopId },
      include: { payment: true, items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found in your shop" });
    }

    if (order.payment?.status === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an order whose payment is already verified",
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update payment to FAILED
      await tx.payment.update({
        where: { orderId: order.id },
        data: { status: "FAILED" },
      });

      // 2. Restore stock for all products in this order
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Order payment marked as FAILED and reserved stock restored.",
    });
  } catch (error) {
    console.error("rejectPayment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject payment",
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

    const { items, paymentMethod = "CASH", providerTransactionId } = req.body;

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
        if (!product || product.isDeleted) {
          throw new Error(product ? `Product "${product.name}" is no longer available.` : `Product not found: ${item.productId}`);
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
          providerTransactionId:
            providerTransactionId && providerTransactionId.trim()
              ? providerTransactionId.trim()
              : chosenMethod === "UPI"
              ? `UPI-POS-${Date.now()}`
              : `CASH-${Date.now()}`,
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
        shop: {
          id: req.shop.id,
          shopId: req.shop.shopId,
          shopName: req.shop.shopName,
          shopNumber: req.shop.shopNumber,
          address: req.shop.address,
          contactNumber: req.shop.contactNumber,
          upiId: req.shop.upiId,
        },
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
//          Supports filtering by paymentStatus ('PENDING', 'VERIFIED'), order status, and search
// @route   GET /api/orders/vendor/orders
const getVendorOrders = async (req, res) => {
  try {
    const shopId = req.shop?.id;
    if (!shopId) {
      return res.status(403).json({ success: false, message: "Shop context required" });
    }

    const { status, type, search, paymentStatus } = req.query;

    const where = { shopId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.orderType = type;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      where.payment = { status: paymentStatus };
    }

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
        shop: {
          select: {
            id: true,
            shopId: true,
            shopName: true,
            shopNumber: true,
            address: true,
            contactNumber: true,
            upiId: true,
          },
        },
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
      shop: o.shop || req.shop,
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
            upiId: true,
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
  submitCustomerPayment,
  verifyAndConfirmPayment,
  rejectPaymentAndRestoreStock,
  createWalkInOrder,
  markOrderCompleted,
  getVendorOrders,
  getCustomerOrders,
  getOrderBill,
};
