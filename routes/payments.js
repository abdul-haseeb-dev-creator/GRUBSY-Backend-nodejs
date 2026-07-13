// routes/payments.js
// Payment processing routes

const express = require("express");
const {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  processRefund,
  processCardPayment,
} = require("../controllers/payments");
const { authenticateUser } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { paymentSchemas } = require("../middleware/schemas");
const { getRateLimiter } = require("../middleware/rateLimiting");
const { idempotencyMiddleware } = require("../middleware/idempotency");
const {
  createStripeWebhookSecurity,
} = require("../middleware/webhookSecurity");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentIntentRequest:
 *       type: object
 *       required:
 *         - orderId
 *       properties:
 *         orderId:
 *           type: string
 *           description: Order ID to create payment for
 *         provider:
 *           type: string
 *           enum: [stripe]
 *           default: stripe
 *           description: Payment provider
 *     PaymentIntentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         paymentIntent:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Payment intent ID
 *             clientSecret:
 *               type: string
 *               description: Client secret for frontend
 *             amount:
 *               type: integer
 *               description: Amount in pence
 *             currency:
 *               type: string
 *               description: Currency code
 *             status:
 *               type: string
 *               description: Payment intent status
 *         order:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             amount:
 *               type: number
 *               description: Amount in pounds
 *             currency:
 *               type: string
 *     PaymentConfirmRequest:
 *       type: object
 *       required:
 *         - paymentIntentId
 *         - orderId
 *       properties:
 *         paymentIntentId:
 *           type: string
 *           description: Payment intent ID from Stripe
 *         orderId:
 *           type: string
 *           description: Order ID
 *     RefundRequest:
 *       type: object
 *       required:
 *         - orderId
 *       properties:
 *         orderId:
 *           type: string
 *           description: Order ID to refund
 *         amount:
 *           type: number
 *           description: Refund amount (optional, defaults to full refund)
 *         reason:
 *           type: string
 *           description: Reason for refund
 */

/**
 * @swagger
 * /api/payments/intents:
 *   post:
 *     summary: Create payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntentRequest'
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntentResponse'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 *       501:
 *         description: Payment provider not supported
 *       500:
 *         description: Internal server error
 */
router.post(
  "/intents",
  getRateLimiter("createPaymentIntent"),
  authenticateUser,
  validateBody(paymentSchemas.createIntent),
  idempotencyMiddleware.payments,
  createPaymentIntent,
);

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentConfirmRequest'
 *     responses:
 *       202:
 *         description: Payment confirmation received, awaiting provider confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                 note:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found or payment intent mismatch
 *       500:
 *         description: Internal server error
 */
router.post(
  "/confirm",
  authenticateUser,
  validateBody(paymentSchemas.confirm),
  confirmPayment,
);

/**
 * @swagger
 * /api/payments/webhook/stripe:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Payments]
 *     description: Webhook endpoint for Stripe payment events (payment_intent.succeeded)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *       500:
 *         description: Webhook processing failed
 */
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  createStripeWebhookSecurity({
    signature: {
      secretEnvVar: "STRIPE_WEBHOOK_SECRET",
      signatureHeader: "stripe-signature",
    },
    idempotency: {
      eventIdField: "id",
      ttlHours: 72,
    },
  }),
  handleStripeWebhook,
);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Process refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequest'
 *     responses:
 *       501:
 *         description: Refund processing not yet implemented
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 order:
 *                   type: object
 *       400:
 *         description: Invalid request or order not eligible for refund
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/refund",
  authenticateUser,
  validateBody(paymentSchemas.refund),
  processRefund,
);

/**
 * @swagger
 * /api/payments/process-card:
 *   post:
 *     summary: Process card payment (server-side)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderId
 *               - orderData
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in GBP
 *                 example: 25.99
 *               currency:
 *                 type: string
 *                 default: gbp
 *                 example: gbp
 *               orderId:
 *                 type: string
 *                 description: Order ID
 *                 example: order_1234567890_abc123
 *               orderData:
 *                 type: object
 *                 required:
 *                   - userEmail
 *                   - deliveryAddress
 *                 properties:
 *                   userEmail:
 *                     type: string
 *                     example: user@example.com
 *                   deliveryAddress:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: 123 Main St
 *                       postcode:
 *                         type: string
 *                         example: SL1 1AA
 *                       coordinates:
 *                         type: object
 *                         properties:
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                   subtotal:
 *                     type: number
 *                   deliveryFee:
 *                     type: number
 *                   serviceFee:
 *                     type: number
 *                   grandTotal:
 *                     type: number
 *                   billingAddress:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       postcode:
 *                         type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 paymentId:
 *                   type: string
 *                   example: pi_3abc123xyz
 *                 message:
 *                   type: string
 *                   example: Payment processed successfully
 *       400:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Card declined
 *       500:
 *         description: Internal server error
 */
router.post(
  "/process-card",
  getRateLimiter("processCardPayment"),
  authenticateUser,
  validateBody(paymentSchemas.processCard),
  idempotencyMiddleware.payments,
  processCardPayment,
);

module.exports = router;
