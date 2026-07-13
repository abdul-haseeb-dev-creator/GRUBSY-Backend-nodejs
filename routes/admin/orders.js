// routes/admin/orders.js
// Admin Orders API - Order management for admin panel
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/orders
 * Get all orders with search, filter, and pagination
 */
router.get('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const { search, status, page = '1', limit = '50', startDate, endDate } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        // Note: Search on joined fields (Users_Full_Name, Merchants_Name) would require
        // a different query approach. For now, we only search on direct order fields.
      ];
    }
    
    if (status) {
      where.status = status;
    }

    if (startDate) {
      where.Created_At = { ...where.Created_At, gte: startDate };
    }
    if (endDate) {
      where.Created_At = { ...where.Created_At, lte: endDate };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        orderBy: { Created_At: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          Order_ID: true,
          Grubsy_User_ID: true,
          Users_Email: true,
          Grubsy_Partner_ID: true,
          status: true,
          Order_Grand_Total: true,
          Delivery_Address: true,
          Created_At: true,
          Driver_ID: true,
          merchants: {
            select: {
              Merchants_Name: true
            }
          },
          users: {
            select: {
              Users_Full_Name: true
            }
          },
          drivers: {
            select: {
              first_name: true
            }
          }
        },
      }),
      prisma.orders.count({ where })
    ]);

    // Transform the data to include names from joins
    const transformedOrders = orders.map(order => ({
      ...order,
      Merchants_Name: order.merchants?.Merchants_Name || null,
      Users_Name: order.users?.Users_Full_Name || null,
      Driver_Name: order.drivers?.first_name || null,
      merchants: order.merchants, // Remove the joined data
      users: order.users,
      drivers: order.drivers
    }));

    res.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/admin/orders/:id
 * Get single order by ID with detailed info
 */
router.get('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { Order_ID: req.params.id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get order timeline/history
    const timeline = [];
    if (order.Created_At) timeline.push({ status: 'CREATED', timestamp: order.Created_At });
    if (order.merchantAcceptedAt) timeline.push({ status: 'ACCEPTED', timestamp: order.merchantAcceptedAt });
    if (order.readyAt) timeline.push({ status: 'READY', timestamp: order.readyAt });
    if (order.pickedUpAt) timeline.push({ status: 'PICKED_UP', timestamp: order.pickedUpAt });
    if (order.deliveredAt) timeline.push({ status: 'DELIVERED', timestamp: order.deliveredAt });
    if (order.cancelledAt) timeline.push({ status: 'CANCELLED', timestamp: order.cancelledAt });

    res.json({
      success: true,
      data: {
        order,
        timeline
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Update order status (admin override)
 */
router.put('/:id/status', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const validStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER', 'DRIVER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const updateData = {
      Status: status,
      Updated_At: new Date().toISOString()
    };

    // Add timestamp for status changes
    if (status === 'DELIVERED') updateData.deliveredAt = new Date().toISOString();
    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date().toISOString();
      if (reason) updateData.cancellationReason = reason;
    }

    const order = await prisma.orders.update({
      where: { Order_ID: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { order },
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

/**
 * PUT /api/admin/orders/:id
 * Update order details (delivery address, special instructions, etc.)
 */
router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Accept frontend field names and map to database fields
    const {
      Delivery_Address,
      Delivery_Instructions,
      Users_Phone_number,
      Users_Email
    } = req.body;

    const updateData = {};

    // Map frontend fields to database fields
    if (Delivery_Address !== undefined) updateData.Delivery_Address = Delivery_Address;
    if (Delivery_Instructions !== undefined) updateData.Delivery_Instructions = Delivery_Instructions;
    if (Users_Phone_number !== undefined) updateData.Users_Phone_number = Users_Phone_number;
    if (Users_Email !== undefined) updateData.Users_Email = Users_Email;

    // Check if order exists first
    const existingOrder = await prisma.orders.findUnique({
      where: { Order_ID: req.params.id }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = await prisma.orders.update({
      where: { Order_ID: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { order },
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

/**
 * GET /api/admin/orders/active
 * Get all active orders (in progress)
 */
router.get('/active', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const activeStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER', 'DRIVER_ASSIGNED', 'PICKED_UP'];
    
    const orders = await prisma.orders.findMany({
      where: {
        status: { in: activeStatuses }
      },
      orderBy: { Created_At: 'desc' },
      select: {
        Order_ID: true,
        status: true,
        Created_At: true,
        Delivery_Address: true,
        Driver_ID: true,
        merchants: {
          select: {
            Merchants_Name: true
          }
        },
        users: {
          select: {
            Users_Full_Name: true
          }
        },
        drivers: {
          select: {
            Driver_Name: true
          }
        }
      }
    });

    // Transform the data to include names from joins
    const transformedOrders = orders.map(order => ({
      ...order,
      Merchants_Name: order.merchants?.Merchants_Name || null,
      Users_Name: order.users?.Users_Full_Name || null,
      Driver_Name: order.drivers?.Driver_Name || null,
      merchants: undefined, // Remove the joined data
      users: undefined,
      drivers: undefined
    }));

    res.json({
      success: true,
      data: transformedOrders
    });
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active orders'
    });
  }
});

/**
 * GET /api/admin/orders/:id/full
 * Get single order by ID with all database columns (full details)
 */
router.get('/:id/full', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { Order_ID: req.params.id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get all column names from the order object
    const columns = Object.keys(order);

    res.json({
      success: true,
      data: {
        order,
        columns
      }
    });
  } catch (error) {
    console.error('Get order full details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order full details'
    });
  }
});

/**
 * GET /api/admin/orders/all-columns
 * Get all orders with all database columns
 */
router.get('/all-columns', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
    
    if (orders.length === 0) {
      return res.json({
        success: true,
        data: {
          orders: [],
          columns: []
        }
      });
    }

    // Get all column names from the first order
    const columns = Object.keys(orders[0]);

    res.json({
      success: true,
      data: {
        orders,
        columns
      }
    });
  } catch (error) {
    console.error('Get all orders with columns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders with all columns'
    });
  }
});

/**
 * GET /api/admin/orders/stats/overview
 * Get order statistics
 */
router.get('/stats/overview', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, todayCount, todayRevenue, monthCount, monthRevenue, byStatus] = await Promise.all([
      prisma.orders.count(),
      prisma.orders.count({
        where: { Created_At: { startsWith: todayStr } }
      }),
      prisma.orders.aggregate({
        where: {
          Created_At: { startsWith: todayStr },
          Status: 'DELIVERED'
        },
        _sum: { Order_Grand_total: true }
      }),
      prisma.orders.count({
        where: { Created_At: { gte: monthStart.toISOString() } }
      }),
      prisma.orders.aggregate({
        where: {
          Created_At: { gte: monthStart.toISOString() },
          Status: 'DELIVERED'
        },
        _sum: { Order_Grand_total: true }
      }),
      prisma.orders.groupBy({
        by: ['Status'],
        _count: { Status: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        today: {
          orders: todayCount,
          revenue: parseFloat(todayRevenue._sum.Order_Grand_total || 0)
        },
        this_month: {
          orders: monthCount,
          revenue: parseFloat(monthRevenue._sum.Order_Grand_total || 0)
        },
        by_status: byStatus.map(s => ({
          status: s.Status,
          count: s._count.Status
        }))
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order stats'
    });
  }
});

export default router;
