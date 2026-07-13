const express = require('express');
const ordersController = require('../controllers/orders');
const upload = require('../integrations/upload');
const router = express.Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin/Restaurant view)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter orders by status
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter orders by merchant partner ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of orders to return
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
// Get all orders
router.get('/', ordersController.getAll);
/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to retrieve
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryAddress:
 *                 type: string
 *                 example: '456 Oak Street, London, N1 2AB'
 *               specialInstructions:
 *                 type: string
 *                 example: 'Ring doorbell twice'
 *               estimatedDeliveryTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
// Create a new order
router.post('/', ordersController.create);
// Get a single order
router.get('/:orderId', ordersController.getById);
/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (Restaurant/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to update status for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['PENDING', 'ACCEPTED', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER', 'ALLOCATED_DRIVER', 'AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
 *                 example: 'READY_FOR_DRIVER'
 *               estimatedReadyTime:
 *                 type: string
 *                 format: date-time
 *                 description: When order will be ready for pickup
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid status value
 *       500:
 *         description: Server error
 */
// Update order status
router.patch('/:orderId/status', ordersController.updateStatus);
/**
 * @swagger
 * /orders/{orderId}/location:
 *   post:
 *     summary: Update driver location for order tracking
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to update driver location for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat:
 *                 type: number
 *                 format: float
 *                 example: 51.5074
 *               lng:
 *                 type: number
 *                 format: float
 *                 example: -0.1278
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Driver location updated successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid coordinates
 *       500:
 *         description: Server error
 */
// Update driver location for order
router.post('/:orderId/location', ordersController.updateLocation);

/**
 * @swagger
 * /orders/{orderId}/photos:
 *   post:
 *     summary: Upload order photos (before-packed, in-bag, driver-pickup)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to upload photos for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               beforePacked:
 *                 type: string
 *                 format: binary
 *                 description: Photo before packing the order
 *               inBag:
 *                 type: string
 *                 format: binary
 *                 description: Photo of order in delivery bag
 *               driverPickup:
 *                 type: string
 *                 format: binary
 *                 description: Photo when driver picks up order
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 photos:
 *                   type: object
 *                   properties:
 *                     beforePacked:
 *                       type: string
 *                       description: URL to uploaded photo
 *                     inBag:
 *                       type: string
 *                       description: URL to uploaded photo
 *                     driverPickup:
 *                       type: string
 *                       description: URL to uploaded photo
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid file format
 *       500:
 *         description: Server error
 */
// Upload photos for an order (before-packed, in-bag, driver-pickup)
router.post('/:orderId/photos', upload.fields([
  { name: 'beforePacked', maxCount: 1 },
  { name: 'inBag', maxCount: 1 },
  { name: 'driverPickup', maxCount: 1 },
]), ordersController.uploadPhotos);

// Update order (PUT)
router.put('/:orderId', ordersController.updateOrder);

/**
 * @swagger
 * /orders/available:
 *   get:
 *     summary: Get available orders for drivers
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
// Get available orders for drivers
router.get('/available', ordersController.getAvailableOrders);

/**
 * @swagger
 * /orders/{orderId}/accept:
 *   post:
 *     summary: Accept order (Restaurant)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to accept
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estimatedReadyTime:
 *                 type: string
 *                 format: date-time
 *                 description: When order will be ready for pickup
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Order cannot be accepted
 *       500:
 *         description: Server error
 */
// Restaurant operations endpoints
router.post('/:orderId/accept', ordersController.acceptOrder);
/**
 * @swagger
 * /orders/{orderId}/mark-ready:
 *   post:
 *     summary: Mark order as ready for driver pickup (Restaurant)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to mark as ready
 *     description: Changes order status to READY_FOR_DRIVER, making it available for drivers to accept
 *     responses:
 *       200:
 *         description: Order marked as ready successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Order cannot be marked as ready
 *       500:
 *         description: Server error
 */
router.post('/:orderId/mark-ready', ordersController.markReady);
/**
 * @swagger
 * /orders/{orderId}/hand-off:
 *   post:
 *     summary: Hand off order to courier/driver (Restaurant)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to hand off
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courierId]
 *             properties:
 *               courierId:
 *                 type: string
 *                 example: 'driver123'
 *                 description: ID of the courier/driver receiving the order
 *     responses:
 *       200:
 *         description: Order handed off successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid courier or order cannot be handed off
 *       500:
 *         description: Server error
 */
router.post('/:orderId/hand-off', ordersController.handOff);
/**
 * @swagger
 * /orders/{orderId}/delay:
 *   post:
 *     summary: Report order delay (Restaurant)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to report delay for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [delayMinutes, reason]
 *             properties:
 *               delayMinutes:
 *                 type: integer
 *                 example: 15
 *                 description: Additional delay time in minutes
 *               reason:
 *                 type: string
 *                 example: 'Kitchen equipment issue'
 *                 description: Reason for the delay
 *               newEstimatedTime:
 *                 type: string
 *                 format: date-time
 *                 description: New estimated ready time
 *     responses:
 *       200:
 *         description: Order delay reported successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/delay', ordersController.delayOrder);
/**
 * @swagger
 * /orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel order (Restaurant/Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to cancel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: 'Out of ingredients'
 *                 description: Reason for cancellation
 *               refundAmount:
 *                 type: number
 *                 example: 18.50
 *                 description: Amount to refund to customer
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Order cannot be cancelled
 *       500:
 *         description: Server error
 */
router.post('/:orderId/cancel', ordersController.cancelOrder);
/**
 * @swagger
 * /orders/{orderId}/adjustments:
 *   post:
 *     summary: Create order adjustments (Restaurant)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to create adjustments for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [adjustments]
 *             properties:
 *               adjustments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: ['add', 'remove', 'substitute']
 *                       example: 'substitute'
 *                     item:
 *                       type: string
 *                       example: 'Coca Cola'
 *                     reason:
 *                       type: string
 *                       example: 'Out of stock'
 *                     substitute:
 *                       type: string
 *                       example: 'Pepsi'
 *                     priceAdjustment:
 *                       type: number
 *                       example: 0.00
 *     responses:
 *       200:
 *         description: Order adjustments created successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid adjustment data
 *       500:
 *         description: Server error
 */
router.post('/:orderId/adjustments', ordersController.createAdjustment);

module.exports = router;
