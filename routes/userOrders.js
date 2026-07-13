// routes/userOrders.js
// User order management routes

const express = require('express');
const { createUserOrder, getUserOrders, getUserOrderById } = require('../controllers/userOrders');
const { authenticateUser } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { orderSchemas, commonSchemas } = require('../middleware/schemas');
const { getRateLimiter } = require('../middleware/rateLimiting');
const { idempotencyMiddleware } = require('../middleware/idempotency');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - name
 *         - size
 *         - quantity
 *       properties:
 *         name:
 *           type: string
 *           description: Item name
 *         size:
 *           type: string
 *           description: Item size (Regular, Large, Platter)
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Item quantity
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *         - deliveryAddress
 *         - postcode
 *         - paymentMethod
 *         - subtotal
 *         - deliveryFee
 *         - serviceFee
 *         - grandTotal
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           description: Order items
 *         deliveryAddress:
 *           type: string
 *           description: Full delivery address
 *         postcode:
 *           type: string
 *           description: Delivery postcode
 *         nameOnCard:
 *           type: string
 *           description: Name on payment card
 *         registeredAddress:
 *           type: string
 *           description: Billing address
 *         registeredPostcode:
 *           type: string
 *           description: Billing postcode
 *         paymentMethod:
 *           type: string
 *           enum: [stripe, card, paypal, apple_pay, google_pay, klarna]
 *           description: Payment method
 *         giftCard:
 *           type: string
 *           description: Gift card code (optional)
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Subtotal in pounds
 *         deliveryFee:
 *           type: number
 *           minimum: 0
 *           description: Delivery fee in pounds
 *         serviceFee:
 *           type: number
 *           minimum: 0
 *           description: Service fee in pounds
 *         grandTotal:
 *           type: number
 *           minimum: 0
 *           description: Grand total in pounds
 *     OrderResponse:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *           description: Unique order ID
 *         userId:
 *           type: string
 *           description: User ID
 *         userEmail:
 *           type: string
 *           description: User email
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         deliveryAddress:
 *           type: string
 *         postcode:
 *           type: string
 *         paymentMethod:
 *           type: string
 *         subtotal:
 *           type: number
 *           description: Subtotal in pounds
 *         deliveryFee:
 *           type: number
 *           description: Delivery fee in pounds
 *         serviceFee:
 *           type: number
 *           description: Service fee in pounds
 *         grandTotal:
 *           type: number
 *           description: Grand total in pounds
 *         orderStatus:
 *           type: string
 *           description: Internal order status
 *           example: "CONFIRMED"
 *         mappedStatus:
 *           type: string
 *           description: User-facing status label
 *           enum: ["Placed", "Processing", "On Route", "Picked up", "Delivered", "Cancelled"]
 *           example: "Placed"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         driver:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             fullName:
 *               type: string
 *             phone:
 *               type: string
 *             vehicleType:
 *               type: string
 *         driverLocation:
 *           type: object
 *           nullable: true
 *           properties:
 *             lat:
 *               type: number
 *             lng:
 *               type: number
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/OrderResponse'
 *                   example:
 *                     orderId: "order_1234567890_abc123"
 *                     mappedStatus: "Placed"
 *                     grandTotal: 13.00
 *                 payment:
 *                   type: object
 *                   nullable: true
 *                   description: Payment data for Stripe orders
 *                   properties:
 *                     clientSecret:
 *                       type: string
 *                       example: "pi_order_1234567890_abc123_secret_xyz789"
 *                     paymentIntentId:
 *                       type: string
 *                       example: "pi_order_1234567890_abc123"
 *       400:
 *         description: Invalid request data or price mismatch
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active]
 *         description: Filter orders by status (active = not delivered/cancelled)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderResponse'
 *                   example:
 *                     - orderId: "order_1234567890_abc123"
 *                       mappedStatus: "Processing"
 *                       grandTotal: 13.00
 *                       items: [{"name": "Test Item", "size": "Regular", "quantity": 1}]
 *                     - orderId: "order_0987654321_def456"
 *                       mappedStatus: "On Route"
 *                       grandTotal: 25.50
 *                       driver: {"fullName": "John Driver", "phone": "+44123456789"}
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/',
  getRateLimiter('createOrder'),
  authenticateUser,
  validateBody(orderSchemas.create),
  idempotencyMiddleware.orders,
  createUserOrder
);
router.get('/',
  authenticateUser,
  validateQuery(orderSchemas.query),
  getUserOrders
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get specific order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID or database ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/OrderResponse'
 *                   example:
 *                     orderId: "order_1234567890_abc123"
 *                     mappedStatus: "On Route"
 *                     grandTotal: 13.00
 *                     driver:
 *                       fullName: "John Driver"
 *                       phone: "+44123456789"
 *                       vehicleType: "Car"
 *                     driverLocation:
 *                       lat: 51.5074
 *                       lng: -0.1278
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
  authenticateUser,
  validateParams(orderSchemas.params),
  getUserOrderById
);

module.exports = router;