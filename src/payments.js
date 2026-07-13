// grubsy-backend/src/payments.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
import { authRequired } from "./middleware/authRequired.js";
import { ok, badRequest, notFound } from "./utils/validate.js";
import paymentService from "../services/paymentService.js";

const require = createRequire(import.meta.url);

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * /api/payments/{orderId}:
 *   get:
 *     summary: Get payment status for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to get payment status for
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Payment ID
 *                     orderId:
 *                       type: string
 *                       description: Associated order ID
 *                     status:
 *                       type: string
 *                       enum: ['REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'REQUIRES_ACTION', 'PROCESSING', 'REQUIRES_CAPTURE', 'CANCELED', 'SUCCEEDED']
 *                       example: 'SUCCEEDED'
 *                     amountCents:
 *                       type: integer
 *                       description: Payment amount in cents
 *                       example: 1850
 *                     currency:
 *                       type: string
 *                       example: 'GBP'
 *                     provider:
 *                       type: string
 *                       example: 'stripe'
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Payment or order not found
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

// GET /api/payments/:orderId - Get payment status for an order
router.get("/:orderId", authRequired, async (req, res) => {
  const { orderId } = req.params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            totalCents: true,
            currency: true,
          },
        },
      },
    });

    if (!payment) {
      return notFound(res, "Payment not found");
    }

    // Check if user owns this order
    if (payment.order.userId !== req.user.id) {
      return notFound(res, "Payment not found");
    }

    return ok(res, {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
      provider: payment.provider,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get payment",
    });
  }
});

/**
 * @swagger
 * /api/payments/{orderId}/intent:
 *   post:
 *     summary: Create payment intent for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to create payment intent for
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                       description: Payment ID
 *                     clientSecret:
 *                       type: string
 *                       description: Client secret for Stripe payment intent
 *                       example: 'pi_mock_12345_secret'
 *                     status:
 *                       type: string
 *                       example: 'REQUIRES_PAYMENT_METHOD'
 *                     amountCents:
 *                       type: integer
 *                       description: Payment amount in cents
 *                       example: 1850
 *                     currency:
 *                       type: string
 *                       example: 'GBP'
 *       404:
 *         description: Order not found
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

// POST /api/payments/:orderId/intent - Create payment intent
router.post("/:orderId/intent", authRequired, async (req, res) => {
  const { orderId } = req.params;

  try {
    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    // Check if user owns this order
    if (order.userId !== req.user.id) {
      return notFound(res, "Order not found");
    }

    // Check if payment already exists
    let payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      // Create new payment record
      payment = await prisma.payment.create({
        data: {
          orderId,
          provider: "stripe",
          status: "REQUIRES_PAYMENT_METHOD",
          amountCents: order.totalCents,
          currency: order.currency,
        },
      });
    }

    // In a real implementation, this would create a Stripe payment intent
    // For now, we'll just return a mock response
    return ok(res, {
      paymentId: payment.id,
      clientSecret: `pi_mock_${payment.id}_secret`,
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create payment intent",
    });
  }
});

// POST /api/payments/:orderId/confirm - Confirm payment
router.post("/:orderId/confirm", authRequired, async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethodId } = req.body || {};

  if (!paymentMethodId) {
    return badRequest(res, "paymentMethodId required", "paymentMethodId");
  }

  try {
    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!payment) {
      return notFound(res, "Payment not found");
    }

    // Check if user owns this order
    if (payment.order.userId !== req.user.id) {
      return notFound(res, "Payment not found");
    }

    // In a real implementation, this would confirm the payment with Stripe
    // For now, we'll just update the status to succeeded
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        providerIntent: `pi_mock_${payment.id}`,
      },
    });

    return ok(res, {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      amountCents: updatedPayment.amountCents,
      currency: updatedPayment.currency,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to confirm payment",
    });
  }
});

// POST /api/payments/process-card - Server-side Stripe card payment
router.post("/process-card", authRequired, async (req, res) => {
  const { amount, currency = "gbp", orderId, orderData } = req.body || {};

  if (!Number.isFinite(amount) || amount <= 0) {
    return badRequest(res, "amount must be a positive number", "amount");
  }

  if (!orderId || typeof orderId !== "string") {
    return badRequest(res, "orderId is required", "orderId");
  }

  if (
    !orderData ||
    !orderData.userEmail ||
    !orderData.deliveryAddress?.postcode
  ) {
    return badRequest(
      res,
      "orderData.userEmail and orderData.deliveryAddress.postcode are required",
      "orderData",
    );
  }

  try {
    console.log("[Payments] Process-card received", {
      orderId,
      currency,
      amount,
      userId: req.user?.id,
    });

    const metadata = {
      orderId,
      userEmail: orderData.userEmail,
      deliveryAddress: [
        orderData.deliveryAddress?.street,
        orderData.deliveryAddress?.postcode,
      ]
        .filter(Boolean)
        .join(", "),
    };

    const result = await paymentService.createStripePaymentIntent(
      amount,
      currency,
      metadata,
    );

    if (!result?.success) {
      console.warn("[Payments] Process-card failed to create intent", {
        orderId,
        error: result?.error,
      });
      return res.status(400).json({
        success: false,
        error: result?.error || "Payment processing failed",
      });
    }

    console.log("[Payments] Process-card succeeded", {
      orderId,
      paymentIntentId: result.paymentIntent.id,
    });

    return res.json({
      success: true,
      paymentId: result.paymentIntent.id,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("[Payments] Process-card internal error", {
      orderId,
      error: error?.message,
    });
    return res.status(500).json({
      success: false,
      error: "Card declined",
    });
  }
});

export default router;
