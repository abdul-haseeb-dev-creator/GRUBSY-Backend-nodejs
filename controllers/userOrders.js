// controllers/userOrders.js
// User order management controller

const { PrismaClient } = require('@prisma/client');
const { mapOrderStatusForUser } = require('../utils/statusMapping');
const { validateRequiredFields } = require('../utils/validation');

const prisma = new PrismaClient();

/**
 * Create a new order for user
 * POST /api/orders
 */
async function createUserOrder(req, res) {
  try {
    const userId = req.user.userId;
    const {
      items,
      deliveryAddress,
      postcode,
      nameOnCard,
      registeredAddress,
      registeredPostcode,
      paymentMethod,
      giftCard,
      subtotal,
      deliveryFee,
      serviceFee,
      grandTotal,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      items,
      deliveryAddress,
      postcode,
      paymentMethod,
      subtotal,
      deliveryFee,
      serviceFee,
      grandTotal,
    };

    const validation = validateRequiredFields(requiredFields);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: validation.missingFields,
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Order must contain at least one item',
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.name || !item.size || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({
          error: 'Invalid item format. Each item must have name, size, and positive quantity',
        });
      }
    }

    // Server-side price validation (convert to pence for precision)
    const subtotalPence = Math.round(subtotal * 100);
    const deliveryFeePence = Math.round(deliveryFee * 100);
    const serviceFeePence = Math.round(serviceFee * 100);
    const grandTotalPence = Math.round(grandTotal * 100);

    const calculatedTotalPence = subtotalPence + deliveryFeePence + serviceFeePence;

    if (Math.abs(grandTotalPence - calculatedTotalPence) > 1) { // Allow 1p tolerance for rounding
      return res.status(400).json({
        error: 'Price calculation mismatch. Please refresh and try again.',
        details: {
          provided: grandTotal,
          calculated: calculatedTotalPence / 100,
        },
      });
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderId,
        userId,
        userEmail: req.user.email,
        items: JSON.stringify(items),
        deliveryAddress,
        postcode,
        nameOnCard,
        registeredAddress,
        registeredPostcode,
        paymentMethod,
        giftCard: giftCard || null,
        subtotal: subtotalPence,
        deliveryFee: deliveryFeePence,
        serviceFee: serviceFeePence,
        grandTotal: grandTotalPence,
        orderStatus: 'PENDING',
        createdAt: new Date(),
      },
    });

    // Prepare response with mapped status
    const responseOrder = {
      ...order,
      subtotal: order.subtotal / 100,
      deliveryFee: order.deliveryFee / 100,
      serviceFee: order.serviceFee / 100,
      grandTotal: order.grandTotal / 100,
      items: JSON.parse(order.items),
      mappedStatus: mapOrderStatusForUser(order.orderStatus),
    };

    // If payment method is Stripe, include client secret
    let paymentData = null;
    if (paymentMethod === 'stripe') {
      // This would integrate with Stripe to create payment intent
      // For now, return a placeholder
      paymentData = {
        clientSecret: `pi_${orderId}_secret_placeholder`,
        paymentIntentId: `pi_${orderId}`,
      };
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: responseOrder,
      payment: paymentData,
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Internal server error during order creation',
    });
  }
}

/**
 * Get user's orders
 * GET /api/orders
 */
async function getUserOrders(req, res) {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const whereClause = { userId };

    // Filter by status if provided
    if (status === 'active') {
      whereClause.orderStatus = {
        notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'],
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleType: true,
          },
        },
      },
    });

    // Map orders with user-facing status and convert prices
    const mappedOrders = orders.map(order => ({
      ...order,
      subtotal: order.subtotal / 100,
      deliveryFee: order.deliveryFee / 100,
      serviceFee: order.serviceFee / 100,
      grandTotal: order.grandTotal / 100,
      items: JSON.parse(order.items),
      mappedStatus: mapOrderStatusForUser(order.orderStatus),
    }));

    res.json({
      orders: mappedOrders,
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Get specific order by ID (user must own the order)
 * GET /api/orders/:id
 */
async function getUserOrderById(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderId: id },
          { id: parseInt(id) || -1 },
        ],
        userId,
      },
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleType: true,
            currentLocation: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Map order with user-facing status and convert prices
    const mappedOrder = {
      ...order,
      subtotal: order.subtotal / 100,
      deliveryFee: order.deliveryFee / 100,
      serviceFee: order.serviceFee / 100,
      grandTotal: order.grandTotal / 100,
      items: JSON.parse(order.items),
      mappedStatus: mapOrderStatusForUser(order.orderStatus),
      driverLocation: order.driver?.currentLocation ? JSON.parse(order.driver.currentLocation) : null,
    };

    res.json({
      order: mappedOrder,
    });

  } catch (error) {
    console.error('Get user order by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

module.exports = {
  createUserOrder,
  getUserOrders,
  getUserOrderById,
};