import express from 'express';
import { getAll, getMyMerchants, getById, update, getMenu } from '../controllers/merchants.js';
import { authRequired } from '../src/middleware/authRequired.js';

const router = express.Router();

/**
 * @swagger
 * /merchants:
 *   get:
 *     summary: Get all merchants (Restaurant Staff)
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filter by cuisine type
 *     responses:
 *       200:
 *         description: Merchants retrieved successfully
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
 *                     $ref: '#/components/schemas/Merchant'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
// Get all merchants (public access for customers)
router.get('/', getAll);
/**
 * @swagger
 * /merchants/my:
 *   get:
 *     summary: Get current user's merchants
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's merchants retrieved successfully
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
 *                     $ref: '#/components/schemas/Merchant'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
// Get merchants for current user (restaurant staff)
router.get('/my', authRequired, getMyMerchants);
/**
 * @swagger
 * /merchants/{id}:
 *   get:
 *     summary: Get merchant details by ID
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchant ID to retrieve
 *     responses:
 *       200:
 *         description: Merchant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Merchant'
 *       404:
 *         description: Merchant not found
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *   patch:
 *     summary: Update merchant settings
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchant ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               active:
 *                 type: boolean
 *                 example: true
 *                 description: Whether merchant is accepting orders
 *               acceptingOrders:
 *                 type: boolean
 *                 example: false
 *                 description: Whether merchant is currently accepting new orders
 *               estimatedDeliveryTime:
 *                 type: integer
 *                 example: 30
 *                 description: Estimated delivery time in minutes
 *     responses:
 *       200:
 *         description: Merchant updated successfully
 *       404:
 *         description: Merchant not found
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
// Get a single merchant (public access for customers)
router.get('/:id', getById);
// Get menu for a merchant (public access for customers)
router.get('/:id/menu', getMenu);
// Update merchant (toggle accepting orders, etc.)
router.patch('/:id', authRequired, update);

export default router;