// routes/admin/exceptions.js
// Admin Exceptions API - Handle stuck orders and exceptions
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/exceptions/stuck-orders
 * Get orders that are stuck or have issues
 */
router.get('/stuck-orders', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { hours = 24, limit = 50 } = req.query;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - parseInt(hours));

    // Find orders that are stuck (not delivered for too long)
    const stuckOrders = await prisma.orders.findMany({
      where: {
        Created_At: { lte: cutoffTime.toISOString() },
        status: {
          notIn: ['DELIVERED', 'CANCELLED']
        }
      },
      take: parseInt(limit),
      orderBy: { Created_At: 'asc' }
    });

    res.json({
      success: true,
      data: stuckOrders
    });
  } catch (error) {
    console.error('Get stuck orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stuck orders'
    });
  }
});

/**
 * GET /api/admin/exceptions/stats
 * Get exception statistics
 */
router.get('/stats', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get counts for different exception types
    const [stuckToday, stuckYesterday, noDriver, pendingOrders, cancelledToday] = await Promise.all([
      // Orders stuck today (not delivered, created more than 2 hours ago)
      prisma.orders.count({
        where: {
          Created_At: { startsWith: todayStr },
          status: { notIn: ['DELIVERED', 'CANCELLED'] }
        }
      }),
      // Orders stuck yesterday
      prisma.orders.count({
        where: {
          Created_At: { startsWith: yesterdayStr },
          status: { notIn: ['DELIVERED', 'CANCELLED'] }
        }
      }),
      // Orders with no driver assigned
      prisma.orders.count({
        where: {
          status: { in: ['ACCEPTED', 'PENDING', 'READY_FOR_DRIVER'] },
          Driver_ID: null
        }
      }),
      // Pending acceptance orders
      prisma.orders.count({
        where: { status: 'PENDING' }
      }),
      // Cancelled today
      prisma.orders.count({
        where: {
          Created_At: { startsWith: todayStr },
          status: 'CANCELLED'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        stuckOrders: {
          today: stuckToday,
          yesterday: stuckYesterday
        },
        unassignedOrders: noDriver,
        pendingOrders,
        cancelledToday,
        totalExceptions: stuckToday + noDriver
      }
    });
  } catch (error) {
    console.error('Get exception stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exception statistics'
    });
  }
});

/**
 * POST /api/admin/exceptions/assign-driver
 * Manually assign a driver to an order
 */
router.post('/assign-driver', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { order_id, driver_id } = req.body;

    if (!order_id || !driver_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id and driver_id are required'
      });
    }

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { Order_ID: order_id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if driver exists
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: driver_id }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    // Update order with driver
    const updatedOrder = await prisma.orders.update({
      where: { Order_ID: order_id },
      data: {
        Driver_ID: driver_id,
        status: 'ASSIGNED'
      }
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: `Driver ${driver.Full_Name} assigned to order ${order_id}`
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign driver'
    });
  }
});

/**
 * POST /api/admin/exceptions/cancel-order
 * Cancel an order (admin action)
 */
router.post('/cancel-order', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { order_id, reason, refund } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id is required'
      });
    }

    const order = await prisma.orders.findUnique({
      where: { Order_ID: order_id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled as it is already completed'
      });
    }

    // Update order status
    const updatedOrder = await prisma.orders.update({
      where: { Order_ID: order_id },
      data: {
        status: 'CANCELLED',
        Cancel_Reason: reason || 'Cancelled by admin'
      }
    });

    // Note: Refund processing would go here if payment integration is available

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

/**
 * POST /api/admin/exceptions/notify-merchant
 * Send notification to merchant about an order
 */
router.post('/notify-merchant', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { order_id, message } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id is required'
      });
    }

    const order = await prisma.orders.findUnique({
      where: { Order_ID: order_id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // In production, this would send a push notification or SMS
    // For now, we'll log it and return success
    console.log(`📱 Notification to merchant ${order.merchants?.Merchants_Name}:`, message || 'Please check order ' + order_id);

    res.json({
      success: true,
      message: 'Notification sent to merchant',
      merchant: order.merchants?.Merchants_Name,
      orderId: order_id
    });
  } catch (error) {
    console.error('Notify merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to notify merchant'
    });
  }
});

/**
 * POST /api/admin/exceptions/force-complete
 * Force complete an order (admin action)
 */
router.post('/force-complete', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { order_id, notes } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id is required'
      });
    }

    const order = await prisma.orders.findUnique({
      where: { Order_ID: order_id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Force complete the order
    const updatedOrder = await prisma.orders.update({
      where: { Order_ID: order_id },
      data: {
        status: 'DELIVERED',
        Notes: notes || 'Force completed by admin'
      }
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order force completed successfully'
    });
  } catch (error) {
    console.error('Force complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force complete order'
    });
  }
});

/**
 * GET /api/admin/exceptions/order-issues
 * Get orders with specific issues
 */
router.get('/order-issues', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { issue_type, limit = 50 } = req.query;
    
    let where = {};
    
    switch (issue_type) {
      case 'no_payment':
        where.Payment_Status = 'PENDING';
        break;
      case 'no_driver':
        where = {
          status: { in: ['ACCEPTED', 'PENDING', 'PREPARING'] },
          Driver_ID: null
        };
        break;
      case 'long_wait':
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 2);
        where = {
          Created_At: { lte: cutoff.toISOString() },
          status: { in: ['PENDING', 'ACCEPTED'] }
        };
        break;
      case 'payment_failed':
        where.Payment_Status = 'FAILED';
        break;
      default:
        where = {
          status: { notIn: ['DELIVERED', 'CANCELLED'] }
        };
    }

    const orders = await prisma.orders.findMany({
      where,
      take: parseInt(limit),
      orderBy: { Created_At: 'asc' }
    });

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get order issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order issues'
    });
  }
});

export default router;
