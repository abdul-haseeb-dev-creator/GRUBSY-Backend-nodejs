// controllers/payments.js
// Payment processing controller - Stripe-first implementation

const { PrismaClient } = require("@prisma/client");
const { validateRequiredFields } = require("../utils/validation");
const { mapOrderStatusForUser } = require("../utils/statusMapping");

const prisma = new PrismaClient();

/**
 * Create payment intent
 * POST /api/payments/intents
 */
async function createPaymentIntent(req, res) {
  try {
    const { orderId, provider = "stripe" } = req.body;

    // Validate required fields
    const validation = validateRequiredFields({ orderId, provider });
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Missing required fields",
        details: validation.missingFields,
      });
    }

    // Only Stripe is implemented for now
    if (provider !== "stripe") {
      return res.status(501).json({
        error: "Not Implemented",
        message: `Payment provider '${provider}' is not yet supported. Currently only 'stripe' is available.`,
        supportedProviders: ["stripe"],
      });
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderId }, { id: parseInt(orderId) || -1 }],
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Check if order is in valid state for payment
    if (!["PENDING", "CONFIRMED"].includes(order.orderStatus)) {
      return res.status(400).json({
        error: "Order is not in a valid state for payment",
        currentStatus: mapOrderStatusForUser(order.orderStatus),
      });
    }

    // For Stripe implementation
    if (provider === "stripe") {
      // In a real implementation, this would create a Stripe PaymentIntent
      // For now, return a mock response
      const paymentIntentId = `pi_${orderId}_${Date.now()}`;
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`;

      // Store payment intent reference in database
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentIntentId,
          paymentProvider: "stripe",
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        paymentIntent: {
          id: paymentIntentId,
          clientSecret,
          amount: order.grandTotal, // Amount in pence
          currency: "gbp",
          status: "requires_payment_method",
        },
        order: {
          id: order.orderId,
          amount: order.grandTotal / 100, // Convert to pounds for display
          currency: "GBP",
        },
      });
    }
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      error: "Internal server error during payment intent creation",
    });
  }
}

/**
 * Confirm payment
 * POST /api/payments/confirm
 */
async function confirmPayment(req, res) {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Validate required fields
    const validation = validateRequiredFields({ paymentIntentId, orderId });
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Missing required fields",
        details: validation.missingFields,
      });
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderId }, { id: parseInt(orderId) || -1 }],
        paymentIntentId,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found or payment intent mismatch",
      });
    }

    // Return 202 - payment confirmation is handled by webhook
    // In a real implementation, Stripe webhook would be the source of truth
    res.status(202).json({
      message: "Payment confirmation received. Awaiting provider confirmation.",
      status: "processing",
      order: {
        id: order.orderId,
        status: mapOrderStatusForUser(order.orderStatus),
      },
      note: "Payment status will be updated via webhook. Monitor order status for completion.",
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      error: "Internal server error during payment confirmation",
    });
  }
}

/**
 * Handle Stripe webhook (payment_intent.succeeded)
 * POST /api/payments/webhook/stripe
 */
async function handleStripeWebhook(req, res) {
  try {
    // In a real implementation, this would verify the Stripe webhook signature
    const { type, data } = req.body;

    if (type === "payment_intent.succeeded") {
      const paymentIntent = data.object;
      const paymentIntentId = paymentIntent.id;

      // Find order by payment intent ID
      const order = await prisma.order.findFirst({
        where: { paymentIntentId },
      });

      if (order) {
        // Update order status to confirmed/paid
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: "CONFIRMED",
            paymentStatus: "PAID",
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Emit Socket.IO event for real-time updates
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${order.userId}`).emit("order:status-changed", {
            orderId: order.orderId,
            status: mapOrderStatusForUser("CONFIRMED"), // "Placed"
            timestamp: new Date().toISOString(),
          });
        }

        console.log(`Payment confirmed for order ${order.orderId}`);
      }
    }

    // Always respond with 200 to acknowledge webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(500).json({
      error: "Webhook processing failed",
    });
  }
}

/**
 * Process refund
 * POST /api/payments/refund
 */
async function processRefund(req, res) {
  try {
    const { orderId } = req.body;
    // amount and reason would be used in full refund implementation

    // Validate required fields
    const validation = validateRequiredFields({ orderId });
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Missing required fields",
        details: validation.missingFields,
      });
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderId }, { id: parseInt(orderId) || -1 }],
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Check if order is eligible for refund
    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({
        error: "Order is not eligible for refund",
        paymentStatus: order.paymentStatus,
      });
    }

    // For now, return not implemented for refunds
    res.status(501).json({
      error: "Not Implemented",
      message:
        "Refund processing is not yet implemented. Please contact support.",
      order: {
        id: order.orderId,
        status: mapOrderStatusForUser(order.orderStatus),
      },
    });
  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({
      error: "Internal server error during refund processing",
    });
  }
}

/**
 * Process card payment (server-side)
 * POST /api/payments/process-card
 */
async function processCardPayment(req, res) {
  try {
    const { amount, currency = "gbp", orderId, orderData } = req.body;

    // Validate required fields
    const validation = validateRequiredFields({ amount, orderId, orderData });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        details: validation.missingFields,
      });
    }

    // Import payment service
    const paymentService = require("../services/paymentService");

    // Create payment metadata
    const metadata = {
      orderId,
      userEmail: orderData.userEmail,
      deliveryAddress: `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.postcode}`,
    };

    // Create Stripe payment intent with automatic payment methods
    const result = await paymentService.createStripePaymentIntent(
      amount,
      currency,
      metadata,
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Payment processing failed",
      });
    }

    // Update order with payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderId }, { id: parseInt(orderId) || -1 }],
      },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentIntentId: result.paymentIntent.id,
          paymentProvider: "stripe",
          paymentStatus: "PROCESSING",
          updatedAt: new Date(),
        },
      });
    }

    // Return success response
    res.json({
      success: true,
      paymentId: result.paymentIntent.id,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Process card payment error:", error);
    res.status(500).json({
      success: false,
      error: "Card declined",
    });
  }
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  processRefund,
  processCardPayment,
};
